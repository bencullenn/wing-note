"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ehrCategories = [
  {
    title: "Patient Information",
    fields: [
      { name: "name", label: "Name", type: "input" },
      { name: "age", label: "Age", type: "input" },
      { name: "gender", label: "Gender", type: "input" },
      { name: "mrn", label: "Medical Record Number (MRN)", type: "input" },
    ],
  },
  {
    title: "Chief Complaint",
    fields: [
      {
        name: "chiefComplaint",
        label: "Primary issue or reason for visit",
        type: "textarea",
      },
    ],
  },
  {
    title: "History of Present Illness (HPI)",
    fields: [
      {
        name: "hpi",
        label: "Detailed description of current condition",
        type: "textarea",
      },
    ],
  },
  {
    title: "Past Medical History",
    fields: [
      {
        name: "pastMedicalHistory",
        label: "Previous diagnoses, surgeries, hospitalizations, etc.",
        type: "textarea",
      },
    ],
  },
  {
    title: "Medications",
    fields: [
      {
        name: "medications",
        label: "Current medications, dosage, and frequency",
        type: "textarea",
      },
    ],
  },
  {
    title: "Allergies",
    fields: [
      {
        name: "allergies",
        label: "Documented allergies and reactions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Review of Systems (ROS)",
    fields: [
      {
        name: "ros",
        label: "Systematic review of each body system",
        type: "textarea",
      },
    ],
  },
  {
    title: "Physical Assessment",
    fields: [
      { name: "vitalSigns", label: "Vital signs", type: "textarea" },
      {
        name: "physicalAssessment",
        label: "Head-to-toe assessment findings",
        type: "textarea",
      },
    ],
  },
  {
    title: "Nursing Diagnoses",
    fields: [
      {
        name: "nursingDiagnoses",
        label: "Clinical judgments about patient's responses",
        type: "textarea",
      },
    ],
  },
  {
    title: "Plan of Care",
    fields: [
      {
        name: "planOfCare",
        label: "Interventions planned to address nursing diagnoses",
        type: "textarea",
      },
    ],
  },
  {
    title: "Interventions",
    fields: [
      {
        name: "interventions",
        label: "Actions taken by the nurse",
        type: "textarea",
      },
    ],
  },
  {
    title: "Evaluation",
    fields: [
      {
        name: "evaluation",
        label: "Assessment of patient's response to interventions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Discharge Planning",
    fields: [
      {
        name: "dischargePlanning",
        label: "Plans for patient's discharge",
        type: "textarea",
      },
    ],
  },
];

// Mock API call - replace with actual API call
const fetchPatientData = async (patientId: number) => {
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    name: "John Doe",
    age: "35",
    gender: "Male",
    mrn: "MRN12345",
    chiefComplaint: "",
    hpi: "",
    pastMedicalHistory: "",
    medications: "",
    allergies: "",
    ros: "",
    vitalSigns: "",
    physicalAssessment: "",
    nursingDiagnoses: "",
    planOfCare: "",
    interventions: "",
    evaluation: "",
    patientEducation: "",
    dischargePlanning: "",
  };
};

export function EHRForm({ patientId }: { patientId: number }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPatientData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPatientData(patientId);
        setFormData(data);
      } catch (error) {
        console.error("Error fetching patient data:", error);
        // Handle error (e.g., show error message to user)
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, [patientId]);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Simulating API call to save data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Form approved and saved:", formData);
      // Here you would typically send the data to your backend
      // If successful, you might want to show a success message or redirect
    } catch (error) {
      console.error("Error saving patient data:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading patient data...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {ehrCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <CardTitle>{category.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      handleInputChange(field.name, e.target.value)
                    }
                    className="w-full"
                  />
                ) : (
                  <Input
                    id={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      handleInputChange(field.name, e.target.value)
                    }
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? "Saving..." : "Approve and Save"}
      </Button>
    </form>
  );
}
