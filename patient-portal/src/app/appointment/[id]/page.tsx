import VisitDetails from "@/components/VisitDetails";

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>; // Type as Promise
}) {
  const { id } = await params; // Await the Promise
  return (
    <div className="p-4 space-y-6">
      <VisitDetails id={id} />
    </div>
  );
}
