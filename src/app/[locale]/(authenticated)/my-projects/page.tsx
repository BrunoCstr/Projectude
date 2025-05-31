
import { ProjectList } from "@/components/projects/project-list";

export default function MyProjectsPage() {
  // The core logic including fetching, filtering, and displaying projects,
  // and handling creation updates, is now moved to ProjectList.
  return (
    <div className="flex flex-col gap-8">
      {/* Header is now handled within ProjectList */}
      {/* <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left">Meus Projetos</h1> */}

      {/* Render the client component that handles project listing and filtering */}
      <ProjectList />
    </div>
  );
}
