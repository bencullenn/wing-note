"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { ChatComponent } from "@/components/ChatComponent";
import { API_URL, PATIENT_MRN } from "../../config";
import Link from "next/link";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + `/visit/${id}`)
      .then((response) => response.json())
      .then((data) => setVisit(data));
  }, [id]);

  const getVisitSummary = async () => {
    const response = await fetch(API_URL + `/visit-summary/${id}`);
    const data = await response.json();
    console.log(data);
    setIsLoading(false);
    setVisitSummary(data);
  };

  useEffect(() => {
    if (id) {
      getVisitSummary();
    }
  }, [id]);

  // if (!visit) {
  //   return <div>Loading Appointment Details...</div>;
  // }
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Link href="/">
            <Button 
              variant="ghost" 
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              ← Back to Appointments List
            </Button>
          </Link>
        </div>
        <Card className="border-t-4 border-t-purple-500">
          <CardContent className="p-6 space-y-4">
            <div className="h-4 bg-purple-100 rounded-full w-3/4 animate-pulse"></div>
            <div className="h-4 bg-purple-50 rounded-full w-1/2 animate-pulse"></div>
            <div className="h-4 bg-purple-50 rounded-full w-2/3 animate-pulse"></div>
            <div className="text-purple-600 text-sm mt-4">
              Preparing your visit summary...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/">
          <Button 
            variant="ghost" 
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            ← Back to Visit List
          </Button>
        </Link>
      </div>

      <Card className="border-t-4 border-t-purple-500">
        <CardContent className="prose prose-headings:mt-6 prose-headings:mb-4 max-w-none p-6">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-6 text-purple-900" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-8 mb-4 text-purple-800" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-6 mb-3 text-purple-700" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 text-gray-700" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-4 text-gray-700" {...props} />,
              li: ({node, ...props}) => <li className="mb-2" {...props} />,
              strong: ({node, ...props}) => <strong className="text-purple-900 font-semibold" {...props} />,
              em: ({node, ...props}) => <em className="text-purple-700" {...props} />,
              a: ({node, ...props}) => <a className="text-purple-600 hover:text-purple-800" {...props} />
            }}
          >
            {visitSummary || ''}
          </ReactMarkdown>
        </CardContent>
      </Card>

      {/* Chat Component */}
      {!isLoading && (
        <ChatComponent 
          context="visit" 
          visitId={parseInt(id)} 
        />
      )}
    </div>
  );
}