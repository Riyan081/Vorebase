import Link from "next/link";
import { VorebaseLogo, IconChevronLeft } from "@/lib/icons";
import NewProjectForm from "@/components/projects/new-project-form";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link
            href="/projects"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-all duration-150"
          >
            <IconChevronLeft size={18} />
          </Link>
          <Link href="/projects" className="flex items-center gap-2">
            <VorebaseLogo size={24} />
            <span className="text-base font-semibold text-text-primary tracking-tight">Vorebase</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <NewProjectForm />
      </main>
    </div>
  );
}
