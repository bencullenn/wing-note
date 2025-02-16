import VisitDetails from "@/components/VisitDetails";
import { ChatComponent } from "@/components/ChatComponent";

export default async function AppointmentPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  return (
    <div className="p-4 space-y-6">
      <VisitDetails id={id} />
    </div>
  );
}
