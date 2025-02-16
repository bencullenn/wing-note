import { EHRForm } from "@/components/EHRForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VisitEHR({ params }: PageProps) {
  const resolvedParams = await params;
  const visitId = Number.parseInt(resolvedParams.id);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <Link href="/">
          <Button
            variant="outline"
            className="text-purple-600 hover:text-purple-700"
          >
            ← Back to Visit List
          </Button>
        </Link>
      </div>
      <h2 className="text-2xl font-semibold mb-6">Visit EHR - ID: {visitId}</h2>
      <EHRForm visitId={visitId} />
    </div>
  );
}
