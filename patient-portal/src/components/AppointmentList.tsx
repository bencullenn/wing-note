"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { API_URL, PATIENT_MRN } from "../../config";

interface Appointment {
  id: number;
  type: string;
  created_at: string;
  doctor: { first_name: string; last_name: string; location: string };
}

export default function AppointmentList() {
  const [type, setType] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const filteredAppointments = appointments.filter((appointment) => {
    if (type !== "all" && appointment.type !== type) return false;
    return true;
  });

  async function getPatientVisits() {
    const response = await fetch(API_URL + `/patient-visits/${PATIENT_MRN}`);
    const data = await response.json();
    console.log("Data: ", data);
    setAppointments(data);
  }

  useEffect(() => {
    getPatientVisits();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by visit type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="emergency-room">Emergency Room</SelectItem>
            <SelectItem value="hospital-stay">Hospital Stay</SelectItem>
            <SelectItem value="surgery-procedures">
              Surgery and Procedures
            </SelectItem>
            <SelectItem value="maternity-newborn">
              Maternity and Newborn Care
            </SelectItem>
            <SelectItem value="specialist">Specialist Care</SelectItem>
            <SelectItem value="intensive">Intensive Care</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredAppointments.map((appointment) => (
          <Link key={appointment.id} href={`/appointment/${appointment.id}`}>
            <Card className="hover:shadow-md transition-all duration-200">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg">
                    {appointment.type.charAt(0).toUpperCase() +
                      appointment.type.slice(1)}
                  </h3>
                  <span className="text-purple-600">
                    {format(new Date(appointment.created_at), "MM/dd/yyyy")}
                  </span>
                </div>

                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {appointment.doctor.first_name +
                        " " +
                        appointment.doctor.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{appointment.doctor.location}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
