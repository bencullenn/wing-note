"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin } from "lucide-react"
import { format } from "date-fns"

const appointments = [
  {
    id: 1,
    title: "Colonoscopy",
    date: "2025-10-15",
    doctor: "Dr. William Chen",
    specialty: "Gastroenterologist",
    location: "2nd Floor, 50 Stanford St",
  },
  {
    id: 2,
    title: "Dental Cleaning",
    date: "2025-09-05",
    doctor: "Dr. Serena Wang",
    specialty: "Dentist",
    location: "40 Benefit St",
  },
  {
    id: 3,
    title: "Annual Physical",
    date: "2025-08-20",
    doctor: "Dr. Karen Smith",
    specialty: "General Practitioner",
    location: "3rd Floor, 17 Pine St",
  },
]

export default function AppointmentList() {
  const [specialty, setSpecialty] = useState("all")

  const filteredAppointments = appointments.filter((appointment) => {
    if (specialty !== "all" && appointment.specialty !== specialty) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            <SelectItem value="General Practitioner">General Practitioner</SelectItem>
            <SelectItem value="Gastroenterologist">Gastroenterologist</SelectItem>
            <SelectItem value="Dentist">Dentist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredAppointments.map((appointment) => (
          <Link key={appointment.id} href={`/appointment/${appointment.id}`}>
            <Card className="hover:shadow-md transition-all duration-200">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg">{appointment.title}</h3>
                  <span className="text-purple-600">{format(new Date(appointment.date), "MM/dd/yyyy")}</span>
                </div>

                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{appointment.doctor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{appointment.location}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

