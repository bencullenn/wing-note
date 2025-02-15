from fastapi import FastAPI, File, Form, UploadFile, HTTPException, WebSocket, Body
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
)
import asyncio
import subprocess
import os
import wave
from io import BytesIO
from datetime import datetime

from datetime import datetime

load_dotenv()

app = FastAPI()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

deepgram_key = os.environ.get("DEEPGRAM_KEY")
deepgram_client = DeepgramClient(deepgram_key)

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
expecting_audio = False  # toggles packet type with each received message
wav_file = wave.open(audio_buffer, "wb")
wav_file.setnchannels(CHANNELS)
wav_file.setsampwidth(SAMPLE_WIDTH)
wav_file.setframerate(SAMPLE_RATE)

buffer_lock = asyncio.Lock()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global expecting_audio, wav_file, audio_buffer, video_buffer
    await websocket.accept()
    print("WebSocket connection established.")
    try:
        while True:
            data = await websocket.receive_bytes()
            # Protect buffer writes while a badge-scan might be chopping the data.
            async with buffer_lock:
                if expecting_audio:
                    # Write the audio data (raw PCM) into the WAV file
                    wav_file.writeframes(data)
                else:
                    # Write the video data into the video buffer
                    video_buffer.write(data)
                # Alternate between audio and video for each packet
                expecting_audio = not expecting_audio
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


@app.post("/badge-scan/{badge}")
async def badge_scan(badge: int):
    global audio_buffer, video_buffer, wav_file, expecting_audio
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

    # Write the captured buffers out to temporary files.
    audio_temp = f"audio_{ts}.wav"
    video_temp = f"video_{ts}.h264"  # assuming the video data is in H.264 format

    with open(audio_temp, "wb") as af:
        af.write(old_audio_bytes)
    with open(video_temp, "wb") as vf:
        vf.write(old_video_bytes)

    # Define the name of the output MP4 file.
    output_filename = f"output_{ts}.mp4"

    # Build and run the ffmpeg command.
    # Here we assume that:
    # -  The video data is already encoded and can be 'copied' into an MP4 container.
    # -  The audio from the WAV file will be encoded as AAC.
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-i",
        video_temp,  # video input
        "-i",
        audio_temp,  # audio input
        "-c:v",
        "copy",  # copy the video stream without re-encoding
        "-c:a",
        "aac",  # encode audio as AAC
        output_filename,
    ]

    try:
        subprocess.run(ffmpeg_cmd, check=True)
        print(f"MP4 file created: {output_filename}")
    except subprocess.CalledProcessError as e:
        print(f"Error during ffmpeg execution: {e}")
        return {"error": "Failed to generate MP4 file."}

    # Clean up the temporary files.
    """try:
        os.remove(audio_temp)
        os.remove(video_temp)
    except Exception as cleanup_error:
        print(f"Cleanup error: {cleanup_error}")"""

    return {"badge": badge, "output_file": output_filename, "timestamp": ts}


@app.post("/audio")
async def upload_audio(
    patient_id: int = Form(...),
    doctor_id: int = Form(...),
    file: UploadFile = File(...),
):
    file_bytes = await file.read()
    if file_bytes is None:
        raise HTTPException(status_code=400, detail="Invalid audio file")

    file_path = file.filename + datetime.now().strftime("%Y%m%d%H%M%S")
    response = supabase.storage.from_("recordings").upload(
        file_path, file_bytes, file_options={"content-type": file.content_type}
    )

    transcription = await process_audio(file_path)

    # Save the transcription to the database
    visit = {
        "patient": patient_id,
        "doctor": doctor_id,
        "audio_path": file_path,
        "raw_text": transcription.results.channels[0]
        .alternatives[0]
        .paragraphs.transcript,
    }

    visit = supabase.table("visit").insert(visit).execute()

    return visit


# Create an endpoint to process a video
async def process_audio(audio_path: str):
    # Get the file from supabase
    url = supabase.storage.from_("recordings").create_signed_url(audio_path, 300)[
        "signedURL"
    ]
    print("Signed URL", url)
    AUDIO_URL = {
        "url": url,
    }

    ## STEP 2 Call the transcribe_url method on the prerecorded class
    options: PrerecordedOptions = PrerecordedOptions(
        model="nova-3",
        smart_format=True,
        diarize=True,
    )
    response = deepgram_client.listen.rest.v("1").transcribe_url(AUDIO_URL, options)
    print(f"response: {response}\n\n")
    return response


def process_video(video_path: str):
    print("Processing video", video_path)
    # Process video here
    return {"message": "Video processed"}


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


# Approve visit record by id
@app.put("/visits/{visit_id}")
def approve_visit(visit_id: int):
    visit = supabase.table("visit").select("*").eq("id", visit_id).execute()
    print("visit", visit)
    if visit.data[0]["approved"] is False:
        updated_visit = (
            supabase.table("visit")
            .update({"approved": True})
            .eq("id", visit_id)
            .execute()
        )
        return updated_visit
    else:
        return {"message": "Visit is already approved"}


### Patient Portal Endpoints
