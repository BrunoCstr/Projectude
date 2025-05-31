import { SharedProjectList } from "@/components/projects/shared-project-list";

export default async function SharedWithMePage() {
  // Logic for fetching and displaying shared projects moved to SharedProjectList
  return (
    <div className="flex flex-col gap-8">
       {/* Header is now handled within SharedProjectList */}
      {/* <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left">Shared with Me</h1> */}
      <SharedProjectList />
    </div>
  );
}
