"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { API_URL } from "../../config";

interface Visit {
  id: number;
  patient: { first_name: string };
  created_at: string;
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
    <div>
      <h2 className="text-2xl font-semibold mb-4">Visit List</h2>
      <ul className="space-y-2">
        {visits.map((visit) => (
          <li key={visit.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg">
                {visit.patient.first_name} - {formatDate(visit.created_at)}
              </span>
              <Link href={`/visit/${visit.id}`}>
                <Button variant="outline">View EHR</Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
