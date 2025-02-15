import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const appointments = {
  "1": {
    date: "2023-05-15",
    doctor: "Dr. Smith",
    specialty: "General Practitioner",
    summary: "Routine check-up. Blood pressure and cholesterol levels were normal.",
    suggestedQuestions: [
      "What lifestyle changes can I make to improve my overall health?",
      "Should I be concerned about any specific health risks?",
      "When should I schedule my next check-up?",
    ],
  },
  // Add more appointments as needed
}

export default function AppointmentDetails({ id }: { id: string }) {
  const appointment = appointments[id as keyof typeof appointments]

  if (!appointment) {
    return <div>Appointment not found</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {appointment.date} - {appointment.doctor}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{appointment.summary}</p>
        <h3 className="font-semibold mb-2">Suggested Questions:</h3>
        <ul className="list-disc pl-5">
          {appointment.suggestedQuestions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

