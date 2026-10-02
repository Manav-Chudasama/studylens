import { NotebookDashboard } from "@/components/study/notebook-dashboard";
import { requireUser } from "@/lib/auth";
import { listNotebooks } from "@/lib/notebooks";

export default async function Home() {
  const [{ userId, email }, notebooks] = await Promise.all([requireUser(), listNotebooks()]);
  return <NotebookDashboard initialNotebooks={notebooks} viewer={{ id: userId, displayName: email ?? "Student" }} />;
}
