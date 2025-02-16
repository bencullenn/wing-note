"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { API_URL, PATIENT_MRN } from "../../config";
interface Visit {
  id: string;
  patient: {
    mrn: string;
    first_name: string;
    last_name: string;
    age: number;
  };
  doctor: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
  hpi: string;
  pmh: string;
  cc: string;
  meds: string;
  allergies: string;
  ros: string;
  vitals: string;
  findings: string;
  diagnosis: string;
  plan: string;
  interventions: string;
  eval: string;
  discharge: string;
  approved: boolean;
}

export default function VisitDetails({ id }: { id: string }) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [visitSummary, setVisitSummary] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL + `/visit/${id}`)
      .then((response) => response.json())
      .then((data) => setVisit(data));
  }, [id]);

  const getVisitSummary = async () => {
    const response = await fetch(API_URL + `/visit-summary/${id}`);
    const data = await response.json();
    console.log(data);
    setVisitSummary(data);
  };

  useEffect(() => {
    if (id) {
      getVisitSummary();
    }
  }, [id]);

  if (!visit) {
    return <div>Loading Appointment Details...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Summary of Visit with Dr. {visit.doctor?.first_name}{" "}
        </CardTitle>
      </CardHeader>
      <CardContent>{visitSummary}</CardContent>
    </Card>
  );
}
