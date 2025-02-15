"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatComponent } from "@/components/ChatComponent";
import { useEffect, useState } from "react";
import { API_URL, PATIENT_MRN } from "../../../config";

interface PatientProfile {
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  mrn: number;
}

export default function ProfilePage() {
  const [patient, setPatient] = useState<PatientProfile | null>(null);

  async function getPatientProfile() {
    const response = await fetch(API_URL + `/patient/${PATIENT_MRN}`);
    const data = await response.json();
    console.log("Data: ", data);
    setPatient(data);
  }

  useEffect(() => {
    getPatientProfile();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {patient?.first_name} {patient?.last_name}
            </p>
            <p>
              <strong>Age:</strong> {patient?.age}
            </p>
            <p>
              <strong>Medical Record Number:</strong> {patient?.mrn}
            </p>
          </div>
        </CardContent>
      </Card>
      <ChatComponent context="general" />
    </div>
  );
}
