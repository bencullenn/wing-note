import VisitDetails from "@/components/VisitDetails";
import { ChatComponent } from "@/components/ChatComponent";

export default function AppointmentPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="p-4 space-y-6">
      <VisitDetails id={params.id} />
    </div>
  );
}
