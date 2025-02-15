"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "../../config";

const ehrCategories = [
  {
    title: "Patient Information",
    fields: [
      { name: "patient_first_name", label: "First Name", type: "input" },
      { name: "patient_last_name", label: "Last Name", type: "input" },
      { name: "patient_age", label: "Age", type: "input" },
      { name: "patient_gender", label: "Gender", type: "input" },
      {
        name: "patient_mrn",
        label: "Medical Record Number (MRN)",
        type: "input",
      },
    ],
  },
  {
    title: "Chief Complaint",
    fields: [
      {
        name: "cc",
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
        name: "pmh",
        label: "Previous diagnoses, surgeries, hospitalizations, etc.",
        type: "textarea",
      },
    ],
  },
  {
    title: "Medications",
    fields: [
      {
        name: "meds",
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
      { name: "vitals", label: "Vital signs", type: "textarea" },
      {
        name: "findings",
        label: "Head-to-toe assessment findings",
        type: "textarea",
      },
    ],
  },
  {
    title: "Nursing Diagnoses",
    fields: [
      {
        name: "diagnosis",
        label: "Clinical judgments about patient's responses",
        type: "textarea",
      },
    ],
  },
  {
    title: "Plan of Care",
    fields: [
      {
        name: "plan",
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
        name: "eval",
        label: "Assessment of patient's response to interventions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Discharge Planning",
    fields: [
      {
        name: "discharge",
        label: "Plans for patient's discharge",
        type: "textarea",
      },
    ],
  },
];

export function EHRForm({ visitId: visitId }: { visitId: number }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Mock API call - replace with actual API call
  async function fetchVisitData(visit_id: number) {
    const response = await fetch(API_URL + `/visits/${visit_id}`);
    const data = await response.json();
    console.log("Data: ", data);
    return data;
  }

  useEffect(() => {
    const loadVisitData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchVisitData(visitId);
        setFormData(data);
      } catch (error) {
        console.error("Error fetching visit data:", error);
        // Handle error (e.g., show error message to user)
      } finally {
        setIsLoading(false);
      }
    };

    loadVisitData();
  }, [visitId]);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formDataObj = new FormData();
    formDataObj.append("visit_id", visitId.toString());
    formDataObj.append("patient_first_name", formData.patient_first_name);
    formDataObj.append("patient_last_name", formData.patient_last_name);
    formDataObj.append("patient_age", formData.patient_age);
    formDataObj.append("patient_gender", formData.patient_gender);
    formDataObj.append("patient_mrn", formData.patient_mrn);
    formDataObj.append("cc", formData.cc || "");
    formDataObj.append("hpi", formData.hpi || "");
    formDataObj.append("pmh", formData.pmh || "");
    formDataObj.append("meds", formData.meds || "");
    formDataObj.append("allergies", formData.allergies || "");
    formDataObj.append("ros", formData.ros || "");
    formDataObj.append("vitals", formData.vitals || "");
    formDataObj.append("findings", formData.findings || "");
    formDataObj.append("diagnosis", formData.diagnosis || "");
    formDataObj.append("plan", formData.plan || "");
    formDataObj.append("interventions", formData.interventions || "");
    formDataObj.append("eval", formData.eval || "");
    formDataObj.append("discharge", formData.discharge || "");

    try {
      const response = await fetch(API_URL + `/visits`, {
        method: "POST",
        body: formDataObj,
      });
    } catch (error) {
      console.error("Error saving visit data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading visit data...
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
