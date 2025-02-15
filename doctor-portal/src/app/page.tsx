import Link from "next/link"
import { Button } from "@/components/ui/button"

const patients = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Alice Johnson" },
  // Add more patients as needed
]

export default function Home() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Patient List</h2>
      <ul className="space-y-2">
        {patients.map((patient) => (
          <li key={patient.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg">{patient.name}</span>
              <Link href={`/patient/${patient.id}`}>
                <Button variant="outline">View EHR</Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

