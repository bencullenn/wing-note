# Standard library imports
import asyncio
import base64
import json
import os
import struct
import subprocess
import wave
from datetime import datetime
from io import BytesIO
from typing import Dict, List

# Third party imports
import cv2
import google.generativeai as genai
import numpy as np
import requests
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    PrerecordedOptions,
    FileSource,
)
from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    File,
    Form,
    UploadFile,
    HTTPException,
    Query,
    Depends,
    WebSocket,
)
from fastapi.middleware.cors import CORSMiddleware
from google.generativeai import GenerativeModel
from PIL import Image
from supabase import create_client, Client
from google.genai.types import HttpOptions, Part

load_dotenv()

app = FastAPI()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

deepgram_key = os.environ.get("DEEPGRAM_KEY")
deepgram_client = DeepgramClient(deepgram_key)

google_api_key = os.environ.get("GOOGLE_API_KEY")
genai.configure(api_key=google_api_key)

mistral_api_key = os.getenv("MISTRAL_API_KEY")

doctor_id = 1

perplexity_api_key = os.environ.get("PERPLEXITY_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

### Audio and Video Streaming

SAMPLE_RATE = 16000
CHANNELS = 1
SAMPLE_WIDTH = 2  # 16-bit audio

audio_buffer = BytesIO()  # will hold a valid WAV-file stream
video_buffer = BytesIO()  # will hold raw video packets (e.g. h264)
wav_file = wave.open(audio_buffer, "wb")
wav_file.setnchannels(CHANNELS)
wav_file.setsampwidth(SAMPLE_WIDTH)
wav_file.setframerate(SAMPLE_RATE)

buffer_lock = asyncio.Lock()

HEADER_FORMAT = "!B"  # 1 byte for type,
HEADER_SIZE = struct.calcsize(HEADER_FORMAT)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global wav_file, audio_buffer, video_buffer
    await websocket.accept()
    print("WebSocket connection established.")
    try:
        while True:
            header = await websocket.receive_bytes()

            # Read the header to see if it's 0x01 (audio) or 0x02 (video)
            packet_type = struct.unpack(HEADER_FORMAT, header)

            data = await websocket.receive_bytes()
            async with buffer_lock:
                if packet_type[0] == 0x01:
                    wav_file.writeframes(data)
                else:
                    video_buffer.write(data)

    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        # On disconnect, close the open WAV file resource.
        async with buffer_lock:
            try:
                wav_file.close()
            except Exception:
                pass
        print("WebSocket connection closed.")


@app.get("/upload")
async def upload(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    badge: int = Query(...),
):
    global doctor_id, audio_buffer, video_buffer, wav_file, expecting_audio

    patient_id = (
        supabase.table("patient")
        .select("id")
        .eq("wristband_id", badge)
        .execute()
        .data[0]["id"]
    )
    # Get a timestamp – used for filenames
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    # First, atomically capture and reset our buffers.
    async with buffer_lock:
        # Finalize the currently open WAV file (which finalizes the header)
        try:
            wav_file.close()
        except Exception:
            pass
        # Capture the bytes recorded up to this point
        old_audio_bytes = audio_buffer.getvalue()
        old_video_bytes = video_buffer.getvalue()

        # Reset buffers for future data
        audio_buffer = BytesIO()
        video_buffer = BytesIO()
        expecting_audio = False  # restart packet alternation

        # Reinitialize the WAV writer for the new audio buffer.
        wav_file = wave.open(audio_buffer, "wb")
        wav_file.setnchannels(CHANNELS)
        wav_file.setsampwidth(SAMPLE_WIDTH)
        wav_file.setframerate(SAMPLE_RATE)

    # Save the audio to Supabase
    audio_file_path = "audio" + ts
    supabase.storage.from_("audio").upload(
        audio_file_path, old_audio_bytes, file_options={"content-type": "audio/wav"}
    )

    # Get the file from supabase
    audio_url = supabase.storage.from_("audio").create_signed_url(audio_file_path, 300)[
        "signedURL"
    ]

    print("Signed URL", url)
    AUDIO_URL = {
        "url": audio_url,
    }

    ## STEP 2 Call the transcribe_url method on the prerecorded class
    options: PrerecordedOptions = PrerecordedOptions(
        model="nova-3",
        smart_format=True,
        diarize=True,
    )

    transcription = deepgram_client.listen.rest.v("1").transcribe_url(
        AUDIO_URL, options
    )

    raw_audio_text = (
        transcription.results.channels[0].alternatives[0].paragraphs.transcript
    )

    # Save the video to Supabase
    video_file_path = "video" + ts
    supabase.storage.from_("video").upload(
        video_file_path, old_video_bytes, file_options={"content-type": "video/mp4"}
    )

    video_url = supabase.storage.from_("video").create_signed_url(audio_file_path, 300)[
        "signedURL"
    ]

    # Get visual assessment
    visual_result = await process_video(video_url)
    visual_assessment = visual_result["visual_assessment"]

    # Process combined information
    try:
        structured_data = parse_medical_text(raw_audio_text, visual_assessment)
    except Exception as e:
        print(f"LLM processing error: {e}")
        structured_data = {
            "cc": "",
            "hpi": "",
            "pmh": "",
            "meds": "",
            "allergies": "",
            "ros": "",
            "vitals": "",
            "findings": "",
            "diagnosis": "",
            "plan": "",
            "interventions": "",
            "eval": "",
            "discharge": "",
        }

    # Save to database
    visit_data = {
        "patient": patient_id,
        "doctor": doctor_id,
        "audio_path": audio_file_path,
        "video_path": video_file_path,
        "raw_text": raw_audio_text,
        "visual_assessment": visual_assessment,
        **structured_data,
        "approved": False,
    }
    # Save to database
    visit = supabase.table("visit").insert(visit_data).execute()

    return visit


# Approve visit record by id
@app.post("/visits")
def approve_visit(
    visit_id: int = Form(...),
    patient_first_name: str = Form(...),
    patient_last_name: str = Form(...),
    patient_age: int = Form(...),
    patient_gender: str = Form(...),
    patient_mrn: int = Form(...),
    cc: str = Form(...),
    hpi: str = Form(...),
    pmh: str = Form(...),
    meds: str = Form(...),
    allergies: str = Form(...),
    ros: str = Form(...),
    vitals: str = Form(...),
    findings: str = Form(...),
    diagnosis: str = Form(...),
    plan: str = Form(...),
    interventions: str = Form(...),
    eval: str = Form(...),
    discharge: str = Form(...),
):
    visit = supabase.table("visit").select("*").eq("id", visit_id).execute()
    print("visit", visit)
    if visit.data[0]["approved"] is False:
        updated_visit = (
            supabase.table("visit")
            .update(
                {
                    "approved": True,
                    "cc": cc,
                    "hpi": hpi,
                    "pmh": pmh,
                    "meds": meds,
                    "allergies": allergies,
                    "ros": ros,
                    "vitals": vitals,
                    "findings": findings,
                    "diagnosis": diagnosis,
                    "plan": plan,
                    "interventions": interventions,
                    "eval": eval,
                    "discharge": discharge,
                }
            )
            .eq("id", visit_id)
            .execute()
        )
        return updated_visit
    else:
        return {"message": "Visit is already approved"}


# Add a new endpoint to get questions for a specific visit
@app.get("/visits/{visit_id}/questions")
async def get_visit_questions(visit_id: int):
    # Get visit data from database
    visit = supabase.table("visit").select("*").eq("id", visit_id).execute()

    if not visit.data:
        raise HTTPException(status_code=404, detail="Visit not found")

    questions = await generate_visit_questions(visit.data[0])
    return {"questions": questions}


@app.post("/test")
async def upload_audio_video(
    patient_id: int = Form(...),
    doctor_id: int = Form(...),
    audio_file: UploadFile = File(...),
    video_file: UploadFile = File(...),
):
    try:
        # Read the audio file and save in the audio buffer
        file_bytes = await audio_file.read()
        if file_bytes is None:
            raise HTTPException(status_code=400, detail="Invalid audio file")
        audio_buffer.write(file_bytes)

        # Read the video file and save in the video buffer
        video_bytes = await video_file.read()
        if video_bytes is None:
            raise HTTPException(status_code=400, detail="Invalid video file")
        video_buffer.write(video_bytes)

    except Exception as e:
        print(f"Error in upload_audio_video: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error processing audio upload: {str(e)}"
        )


# Create endpoint for processing text
@app.post("/process-medical-text")
async def process_medical_text(raw_text: str):
    """
    Endpoint to test LLM processing without updating the database
    """
    try:
        structured_data = parse_medical_text(raw_text)
        return structured_data
    except Exception as e:
        return {"error": f"Error processing text: {str(e)}"}


## Patient Portal
@app.get("/patient-visits/{patient_id}")
def get_patient_visits(patient_id: int):
    visits = (
        supabase.table("visit")
        .select("id, doctor(first_name, last_name, location), created_at, type")
        .eq("patient", patient_id)
        .eq("approved", True)
        .order("created_at", desc=True)
        .execute()
    )
    return visits.data


@app.get("/patient/{patient_mrn}")
def get_patient(patient_mrn: int):
    patient = (
        supabase.table("patient")
        .select("mrn, first_name, last_name, age, gender")
        .eq("mrn", patient_mrn)
        .execute()
    )
    return patient.data[0]


@app.post("/chat")
async def chat(messages: List[Dict]):
    headers = {
        "Authorization": f"Bearer {perplexity_api_key}",
        "Content-Type": "application/json",
    }
    print("messages", messages)

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json={
                "model": "sonar",
                "messages": messages,
            },
        )

        print("response", response.json())
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code, detail="Failed to get AI response"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat-context")
async def chat_context(visit_id: int):
    visit = supabase.table("visit").select("*").eq("id", visit_id).execute()
    return visit.data[0]


def parse_medical_text(raw_text: str, visual_assessment: str) -> Dict:
    """
    Use Mistral AI to parse combined audio and video information into structured fields
    """

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {mistral_api_key}",
    }

    prompt = f"""You are an expert medical doctor with extensive experience in clinical documentation and EHR systems. 
    Your task is to analyze both the transcribed consultation and visual assessment data to create a comprehensive medical record.
    
    Please combine and parse both sources of information with high attention to medical accuracy and detail. For each field:
    - Extract and combine relevant information from both the audio transcription and visual assessment
    - Use standard medical terminology
    - Maintain clinical relevance
    - If information for a field is not present in either source, return an empty string
    - When information appears in both sources, combine them coherently
    - Prioritize objective visual findings when they complement verbal descriptions

    Audio Transcription:
    {raw_text}

    Visual Assessment:
    {visual_assessment}

    Parse the combined information into these specific fields and return ONLY a JSON object:
    
    - cc (Chief Complaint): Combine verbal complaint with visible signs of distress or symptoms
    - hpi (History of Present Illness): Integrate verbal history with observed physical manifestations
    - pmh (Past Medical History): Include visible evidence of past procedures/conditions with reported history
    - meds (Current Medications): List medications mentioned and any visible medication use observed
    - allergies: Combine reported allergies with any visible allergic reactions
    - ros (Review of Systems): Merge verbal review with visible signs/symptoms
    - vitals: Combine verbally reported and visually observed/measured vital signs
    - findings: Integrate verbal and visual physical examination findings, organized by body system
    - diagnosis: Synthesize diagnoses based on both verbal and visual clinical evidence
    - plan: Treatment plan incorporating both discussed and demonstrated interventions
    - interventions: Document both verbal and physically demonstrated procedures
    - eval (Evaluation): Comprehensive assessment using both verbal and visual clinical data
    - discharge: Combine verbal instructions with any demonstrated procedures/exercises
    - type: This represents the type of medical visit. The only options are 'emergency-room', 'hospital-stay', 'surgery-procedures', 'maternity-newborn', 'specialist', 'intensive'. Choose the one that best fits the visit.

    Return the response as a valid JSON object with these exact field names.
    """

    try:
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json={
                "model": "mistral-large-latest",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert medical documentation specialist skilled in integrating verbal and visual clinical information.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            },
        )

        if response.status_code != 200:
            raise Exception(f"API call failed with status code: {response.status_code}")

        result = response.json()
        parsed_content = json.loads(result["choices"][0]["message"]["content"])
        return parsed_content

    except Exception as e:
        print(f"Error in LLM processing: {e}")
        raise


def validate_structured_data(data: Dict) -> bool:
    """
    Validates that all required fields are present in the structured data
    """
    required_fields = [
        "cc",
        "hpi",
        "pmh",
        "meds",
        "allergies",
        "ros",
        "vitals",
        "findings",
        "diagnosis",
        "plan",
        "interventions",
        "eval",
        "discharge",
    ]

    return all(field in data for field in required_fields)


def extract_frames(video_path: str, max_frames: int = 20):
    """Extract frames from video at regular intervals"""
    frames = []
    video = cv2.VideoCapture(video_path)
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    interval = max(1, total_frames // max_frames)

    current_frame = 0
    while current_frame < total_frames:
        video.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        success, frame = video.read()
        if success:
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # Convert to PIL Image
            pil_image = Image.fromarray(frame_rgb)
            frames.append(pil_image)
        current_frame += interval

    video.release()
    return frames


async def process_video(video_link: str) -> Dict:
    try:
        print(f"Processing video: {video_link}")
        # frames = extract_frames(video_path)

        # Get the video link

        prompt = """You are an expert medical professional specialized in visual clinical assessment. 
        Analyze these frames from a medical consultation and focus ONLY on visual medical information 
        that would complement an audio transcription.

        Specifically identify and describe:

        1. Physical Examination Findings:
           - Visible skin conditions, lesions, or rashes
           - Patient's mobility and gait patterns
           - Visible swelling or deformities
           - Facial expressions indicating pain or discomfort
           - Any medical devices or supports being used

        2. Visual Clinical Signs:
           - Patient's general appearance and apparent distress level
           - Visible breathing patterns or respiratory effort
           - Apparent neurological signs (tremors, asymmetry, etc.)
           - Color changes (pallor, cyanosis, jaundice)
           - Visible wounds, bandages, or surgical sites

        3. Demonstrated Physical Assessments:
           - Range of motion tests performed
           - Physical manipulation of joints or limbs
           - Neurological examination maneuvers
           - Any medical instruments used and their readings
           - Demonstration of exercises or techniques

        4. Non-verbal Communication:
           - Patient's body language indicating comfort/discomfort
           - Physical demonstrations of symptoms by patient
           - Doctor's demonstrative instructions or examinations

        5. Environmental/Contextual Information:
           - Medical equipment visible in the room
           - Use of assistive devices
           - Any visible medical imaging or test results
           - Demonstrated use of medical devices

        Format the response as a structured medical observation report, focusing ONLY on 
        visually observable information that would NOT be captured in audio transcription.
        If certain categories have no observable information, mark them as 'No visible findings'.
        """

        client = genai.Client(http_options=HttpOptions(api_version="v1"))
        response = client.models.generate_content(
            model="gemini-2.0-flash-001",
            contents=[
                prompt,
                Part.from_uri(
                    file_uri=video_link,
                    mime_type="video/mp4",
                ),
            ],
        )

        return {
            "status": "success",
            "visual_assessment": response.text,
        }

    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return {"status": "error", "error": str(e)}


@app.get("/generate-questions")
async def generate_visit_questions(visit_data: dict) -> List[str]:
    """Generate relevant questions based on visit data using Perplexity API"""

    api_key = os.getenv("PERPLEXITY_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    prompt = f"""As a medical AI assistant, generate 4 relevant and important questions that a patient might ask 
    based on this medical visit information:
    
    Chief Complaint: {visit_data.get("cc", "")}
    Diagnosis: {visit_data.get("diagnosis", "")}
    Treatment Plan: {visit_data.get("plan", "")}
    Medications: {visit_data.get("meds", "")}
    
    Generate questions that:
    1. Focus on understanding the diagnosis
    2. Address treatment plans and medications
    3. Cover potential side effects or complications
    4. Include follow-up care instructions
    
    Return exactly 4 clear, patient-friendly questions."""

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json={
                "model": "pplx-7b-online",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful medical assistant generating patient questions.",
                    },
                    {"role": "user", "content": prompt},
                ],
            },
        )

        if response.status_code == 200:
            questions = response.json()["choices"][0]["message"]["content"].split("\n")
            # Clean and filter questions
            questions = [q.strip().strip("1234. ") for q in questions if q.strip()]
            return questions[:4]  # Ensure we return exactly 4 questions
        else:
            raise Exception(f"API call failed with status {response.status_code}")

    except Exception as e:
        print(f"Error generating questions: {e}")
        return []


### Doctor Portal Endpoints


# Get all visits
@app.get("/visits")
def get_visits():
    visits = (
        supabase.table("visit")
        .select("id, patient(first_name), created_at")
        .order("created_at", desc=True)
        .execute()
    )
    print("visits", visits)
    return visits.data


# Get visit for patient by id
@app.get("/visits/{id}")
def get_visit_by_id(id: int):
    visits = (
        supabase.table("visit")
        .select(
            "id, patient(mrn, first_name, last_name, age, gender), doctor(first_name, last_name), created_at, hpi, pmh, cc, meds, allergies, ros, vitals, findings, diagnosis, plan, interventions, eval, discharge, approved"
        )
        .eq("id", id)
        .execute()
    )

    visit_data = visits.data[0]

    # Flatten the patient and doctor info into the visit data
    visit_data["patient_first_name"] = visit_data["patient"]["first_name"]
    visit_data["patient_last_name"] = visit_data["patient"]["last_name"]
    visit_data["patient_age"] = visit_data["patient"]["age"]
    visit_data["patient_gender"] = visit_data["patient"]["gender"]
    visit_data["patient_mrn"] = visit_data["patient"]["mrn"]
    visit_data["doctor_first_name"] = visit_data["doctor"]["first_name"]
    visit_data["doctor_last_name"] = visit_data["doctor"]["last_name"]

    return visit_data


@app.get("/visit-summary/{id}")
def get_visit_summary(id: int):
    visits = (
        supabase.table("visit")
        .select(
            "id, patient(mrn, first_name, last_name, age, gender), doctor(first_name, last_name), created_at, hpi, pmh, cc, meds, allergies, ros, vitals, findings, diagnosis, plan, interventions, eval, discharge, approved"
        )
        .eq("id", id)
        .execute()
    )

    if not visits.data:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Use mixtral to generate a summary of the visit
    visit_data = visits.data[0]
    prompt = f"""You are a medical professional reviewing a patient visit record. 
    Summarize the key information from the visit into a concise and informative report.
    Make sure to explain any medical terms and provide context for the patient's condition.

    Patient: {visit_data["patient"]["first_name"]} {visit_data["patient"]["last_name"]} (MRN: {visit_data["patient"]["mrn"]})
    Doctor: {visit_data["doctor"]["first_name"]} {visit_data["doctor"]["last_name"]}
    Date: {visit_data["created_at"]}

    Chief Complaint: {visit_data.get("cc", "")}
    History of Present Illness: {visit_data.get("hpi", "")}
    Past Medical History: {visit_data.get("pmh", "")}
    Current Medications: {visit_data.get("meds", "")}
    Allergies: {visit_data.get("allergies", "")}
    Review of Systems: {visit_data.get("ros", "")}
    Vitals: {visit_data.get("vitals", "")}
    Physical Examination Findings: {visit_data.get("findings", "")}
    Diagnosis: {visit_data.get("diagnosis", "")}
    Plan: {visit_data.get("plan", "")}
    Interventions: {visit_data.get("interventions", "")}
    Evaluation: {visit_data.get("eval", "")}
    Discharge Instructions: {visit_data.get("discharge", "")}
    """

    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {mistral_api_key}",
        }

        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json={
                "model": "mistral-large-latest",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a medical professional summarizing a patient visit record.",
                    },
                    {"role": "user", "content": prompt},
                ],
            },
        )

        if response.status_code != 200:
            raise Exception(f"API call failed with status code: {response.status_code}")

        result = response.json()
        print("REsult", result)
        summary = result["choices"][0]["message"]["content"]
        print("Summary", summary)
        return summary

    except Exception as e:
        print(f"Error in LLM processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


### Patient Portal Endpoints
@app.get("/patient-visits")
def get_patient_visits(patient_id: int):
    visits = (
        supabase.table("visit")
        .select("id, doctor(first_name, last_name), created_at")
        .eq("patient", patient_id)
        .order("created_at", desc=True)
        .execute()
    )
    return visits.data


@app.get("/patient/{patient_mrn}")
def get_patient(patient_mrn: int):
    patient = (
        supabase.table("patient")
        .select("mrn, first_name, last_name, age, gender")
        .eq("mrn", patient_mrn)
        .execute()
    )
    return patient.data[0]
