import { EHRForm } from "@/components/EHRForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PatientEHR({ params }: { params: { id: string } }) {
  const patientId = Number.parseInt(params.id)

  return (
    <div>
      <div className="mb-4">
        <Link href="/">
          <Button variant="outline">Back to Patient List</Button>
        </Link>
      </div>
      <h2 className="text-2xl font-semibold mb-4">Patient EHR - ID: {patientId}</h2>
      <EHRForm patientId={patientId} />
    </div>
  )
}

