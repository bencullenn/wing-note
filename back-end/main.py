from fastapi import FastAPI
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


# Get all visits
@app.get("/visits")
def get_visits():
    visits = supabase.table("visits").select("*").execute()
    return visits


# Get visit for patient by id
@app.get("/visits/{id}")
def get_visit_by_id(id: int):
    visits = supabase.table("visits").select("*").eq("id", id).execute()
    return visits


# Approve visit record by id
@app.put("/visits/{visit_id}")
def approve_visit(visit_id: int):
    visit = supabase.table("visits").select("*").eq("id", visit_id).execute()
    if visit["approved"] is False:
        updated_visit = (
            supabase.table("visits")
            .update({"approved": True})
            .eq("id", visit_id)
            .execute()
        )
        return updated_visit
    else:
        return {"message": "Visit is already approved"}
