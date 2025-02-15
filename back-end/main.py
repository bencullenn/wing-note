from fastapi import FastAPI
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

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
    if visit["approved"] is False:
        updated_visit = (
            supabase.table("visit")
            .update({"approved": True})
            .eq("id", visit_id)
            .execute()
        )
        return updated_visit
    else:
        return {"message": "Visit is already approved"}


# Create an endpoint to process a video


def process_video(video_path: str):
    print("Processing video", video_path)
    # Process video here
    return {"message": "Video processed"}
