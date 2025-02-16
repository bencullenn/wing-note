"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { API_URL } from "../../config";

interface Visit {
  id: number;
  patient: { 
    first_name: string, 
    last_name: string
  };
  created_at: string;
  approved: boolean;
}

export default function Home() {
  const [visits, setVisit] = useState<Visit[]>([]);

  async function fetchVisits() {
    const response = await fetch(API_URL + "/visits");
    const data = await response.json();
    console.log("Data: ", data);
    setVisit(data);
  }

  useEffect(() => {
    fetchVisits();
  }, []);

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-purple-100">
        <div className="p-6 border-b border-purple-100">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Visit List</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-purple-600 font-medium">
                Total Visits: {visits.length}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-purple-600 font-medium">
                Pending Approval: {visits.filter(v => !v.approved).length}
              </span>
            </div>
          </div>
        </div>
        
        <ul className="divide-y divide-gray-100">
          {visits.map((visit) => (
            <li key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-lg font-medium text-gray-900">
                      {visit.patient.first_name} {visit.patient.last_name.toUpperCase()}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatDate(visit.created_at)}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    visit.approved 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {visit.approved ? "Approved" : "To Approve"}
                  </span>
                </div>
                <Link href={`/visit/${visit.id}`}>
                  <Button 
                    variant="outline" 
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    View EHR
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}