import { EHRForm } from "@/components/EHRForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function VisitEHR({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const visitId = Number.parseInt(resolvedParams.id);

  return (
    <div>
      <div className="mb-4">
        <Link href="/">
          <Button variant="outline">Back to Visit List</Button>
        </Link>
      </div>
      <h2 className="text-2xl font-semibold mb-4">Visit EHR - ID: {visitId}</h2>
      <EHRForm visitId={visitId} />
    </div>
  );
}
