import NotificationList from "@/components/NotificationList"
import AppointmentList from "@/components/AppointmentList"
import { BellIcon, CalendarIcon } from "lucide-react"

export default function Home() {
  return (
    <div className="py-6 space-y-8">
       {/* <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <NotificationList />
      </div> */}

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Appointments</h2>
        </div>
        <AppointmentList />
      </div>
    </div>
  )
}

