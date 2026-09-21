"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./workspace";
import StudentProfileForm from "./student-profile-form";
import StudentDirectory from "./student-directory";
import ProjectBoard from "./project-board";
import ProjectForm from "./project-form";
import ProjectDetail from "./project-detail";
import InvitationInbox from "./invitation-inbox";
import { buttonStyle, panelStyle, secondaryStyle, Tags } from "./form-controls";

export function DashboardPage() {
  const { user, profile, students, projects, invitations } = useWorkspace();
  const owned = projects.filter(project => project.ownerId === user.id);
  const joined = projects.filter(project => project.isMember && project.ownerId !== user.id);
  const pending = invitations.filter(item => item.status === "Pending").length;
  return <div className="space-y-7">
    <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Signed-in workspace</p>
      <h1 className="mt-2 text-3xl font-bold">Welcome, {profile?.fullName}</h1>
      <p className="mt-3 text-slate-600">Find your people, build your team, and keep your project moving.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: "Students", count: students.filter(student => student.userId !== null).length, href: "/students" },
        { label: "My projects", count: owned.length, href: "/projects/mine" },
        { label: "Pending invitations", count: pending, href: "/invitations" },
      ].map(item => <Link key={item.href} href={item.href} className={panelStyle + " transition hover:border-indigo-400"}>
        <p className="text-sm text-slate-600">{item.label}</p><p className="mt-2 text-3xl font-bold">{item.count}</p>
      </Link>)}
    </div>
    <section className={panelStyle + " space-y-4"}>
      <h2 className="text-xl font-bold">Your active work</h2>
      {[...owned, ...joined].length === 0 ? <p className="text-slate-600">Create a project or accept an invitation to begin.</p> :
        [...owned, ...joined].slice(0, 6).map(project => <Link className="block rounded-xl border border-slate-200 p-4 hover:border-indigo-300" href={`/projects/${project.id}`} key={project.id}>
          <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{project.title}</span><span className="text-sm text-slate-600">{project.status}</span></div>
          <p className="mt-2 text-sm text-slate-600">{project.taskCount ? `${project.completedTaskCount}/${project.taskCount} tasks done · ${project.progressPercent}%` : "No tasks assigned yet"}</p>
        </Link>)}
    </section>
  </div>;
}

export function ProfilePage({ mode = "view" }: { mode?: "view" | "create" | "edit" }) {
  const { user, profile, skills, options, refresh } = useWorkspace();
  const router = useRouter();
  if (mode === "create" && profile) return <div className={panelStyle}><h1 className="text-2xl font-bold">Your profile is ready</h1><Link href="/profile" className="mt-4 inline-block text-indigo-700">View my profile →</Link></div>;
  if (mode !== "view" || !profile) return <div className="space-y-4">
    {mode === "edit" && <Link href="/profile" className={secondaryStyle + " inline-block"}>← Back to my profile</Link>}
    <StudentProfileForm user={user} student={profile} skills={skills} options={options} onCatalogChanged={refresh}
      onSaved={async () => { await refresh(); router.push(mode === "create" ? "/dashboard" : "/profile"); }} />
  </div>;
  return <section className={panelStyle + " space-y-5"}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">My profile</h1><Link className={buttonStyle} href="/profile/edit">Edit my profile</Link></div>
    <div><h2 className="text-xl font-bold">{profile.fullName}</h2><p className="mt-1 text-indigo-700">{profile.preferredRole}</p>
      <p className="mt-1 break-all text-sm text-slate-500">{profile.universityEmail}</p></div>
    <p className="whitespace-pre-wrap break-words text-slate-600">{profile.bio || "No bio added yet."}</p>
    <h3 className="font-semibold">Skills</h3><Tags values={profile.skills.map(skill => skill.name)} />
    <h3 className="font-semibold">Availability</h3><Tags values={profile.availability} />
    <p className="text-sm text-slate-500">Meeting periods use Sri Lanka local time.</p>
  </section>;
}

export function StudentsPage() {
  const { students, skills, options } = useWorkspace();
  return <StudentDirectory students={students} skills={skills} options={options} />;
}

export function ProjectsPage({ filter = "all" }: { filter?: "all" | "owned" | "joined" }) {
  const { user, projects } = useWorkspace();
  return <ProjectBoard user={user} projects={projects} filter={filter} />;
}

export function NewProjectPage() {
  const { skills, options, refresh } = useWorkspace();
  const router = useRouter();
  return <ProjectForm skills={skills} options={options} onCancel={() => router.push("/projects")}
    onSaved={async project => { await refresh(); router.push(`/projects/${project.id}`); }} />;
}

export function ProjectPage({ id, edit = false }: { id: number; edit?: boolean }) {
  const { user, projects, skills, options, students, refresh } = useWorkspace();
  const router = useRouter();
  const project = projects.find(item => item.id === id);
  if (!project) return <section className={panelStyle}><h1 className="text-2xl font-bold">Project not found</h1>
    <p className="my-4">The project may have been deleted or this link is incorrect.</p><Link href="/projects" className={secondaryStyle}>Back to projects</Link></section>;
  if (edit && project.ownerId !== user.id) return <section className={panelStyle}><h1 className="text-2xl font-bold">Only the owner can edit this project</h1><Link className="mt-4 inline-block text-indigo-700" href={`/projects/${id}`}>View project →</Link></section>;
  if (edit) return <ProjectForm project={project} skills={skills} options={options} onCancel={() => router.push(`/projects/${id}`)}
    onSaved={async () => { await refresh(); router.push(`/projects/${id}`); }} />;
  return <ProjectDetail key={id} project={project} user={user} students={students}
    onBack={() => router.push("/projects")} onEdit={() => router.push(`/projects/${id}/edit`)}
    onChanged={refresh} onDeleted={async () => { await refresh(); router.push("/projects/mine"); }} />;
}

export function InvitationsPage() {
  const { invitations, refresh } = useWorkspace();
  return <InvitationInbox invitations={invitations} onChanged={refresh} />;
}
