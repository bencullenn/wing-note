from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Query, Depends
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    PrerecordedOptions,
    FileSource,
)

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
