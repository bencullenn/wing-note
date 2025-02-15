import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatComponent } from "@/components/ChatComponent"

export default function ProfilePage() {
  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> John Doe
            </p>
            <p>
              <strong>Date of Birth:</strong> 1985-03-15
            </p>
            <p>
              <strong>Email:</strong> john.doe@example.com
            </p>
            <p>
              <strong>Phone:</strong> (123) 456-7890
            </p>
          </div>
        </CardContent>
      </Card>
      <ChatComponent context="general" />
    </div>
  )
}

