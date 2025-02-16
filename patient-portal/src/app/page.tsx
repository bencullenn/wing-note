import NotificationList from "@/components/NotificationList";
import AppointmentList from "@/components/AppointmentList";
import { BellIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <ActivityIcon className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Activity Summary</h2>
        </div>
        <div className="rounded-lg border p-4">
          {!terraConnected ? (
            <div className="text-center">
              <p className="mb-4 text-gray-600">
                Connect your fitness data to track your progress
              </p>
              <Button onClick={handleTerraConnect} variant="outline">
                Connect to Terra
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm text-gray-600">Steps Today</p>
                <p className="text-2xl font-semibold">
                  {activityData?.steps || 0}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm text-gray-600">Active Minutes</p>
                <p className="text-2xl font-semibold">
                  {activityData?.activeMinutes || 0}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm text-gray-600">Calories Burned</p>
                <p className="text-2xl font-semibold">
                  {activityData?.calories || 0}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Appointments</h2>
        </div>
        <AppointmentList />
      </div>
    </div>
  );
}
