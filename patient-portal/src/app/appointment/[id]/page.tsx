import AppointmentDetails from "@/components/AppointmentDetails"
import { ChatComponent } from "@/components/ChatComponent"

export default function AppointmentPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4 space-y-6">
      <AppointmentDetails id={params.id} />
      <ChatComponent context={`appointment-${params.id}`} />
    </div>
  )
}

