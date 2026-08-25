import { getDocuments } from "@/app/actions/documents";
import HistoryList from "./HistoryList";

export const metadata = {
  title: "History | Vellura",
  description: "View your previously generated executive cover letters and pitches.",
};

export default async function HistoryPage() {
  const documents = await getDocuments();

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <HistoryList initialDocuments={documents} />
      </div>
    </div>
  );
}
