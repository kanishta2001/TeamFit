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
import PageBack from "./page-back";
import ProfilePhoto from "./profile-photo";
import StudentAvatar from "./student-avatar";
import LogoutConfirm from "./logout-confirm";

export function DashboardPage() {
  const { user, profile, students, projects, invitations, myTasks } = useWorkspace();
  const owned = projects.filter(project => project.ownerId === user.id);
  const joined = projects.filter(project => project.isMember && project.ownerId !== user.id);
  const pending = invitations.filter(item => item.status === "Pending").length;
  return <div className="dashboard-page space-y-7">
    <div className="dashboard-intro">
      <Link href="/profile" className="dashboard-avatar" aria-label="Open my profile">
        {profile && <StudentAvatar student={profile} />}
      </Link>
      <div><p className="dashboard-workspace-label">Workspace</p>
      <h1 className="mt-2 text-3xl font-bold">Welcome, {profile?.fullName}</h1>
      <p className="mt-3 text-slate-600">Find your people, build your team, and keep your project moving.</p></div></div>
    <div className="dashboard-stats grid gap-4 sm:grid-cols-3">
      {[
        { label: "Students", count: students.filter(student => student.userId !== null).length, href: "/students" },
        { label: "My projects", count: owned.length + joined.length, href: "/projects/mine" },
        { label: "Pending invitations", count: pending, href: "/invitations" },
      ].map(item => <Link key={item.href} href={item.href} className={panelStyle + " dashboard-stat transition hover:border-[#6f8daf]"}>
        <p className="text-sm">{item.label}</p><p>{String(item.count).padStart(2, "0")}</p>
      </Link>)}
    </div>
    <section className={panelStyle + " dashboard-active space-y-4"}>
      <h2 className="text-xl font-bold">Your active work</h2>
      {[...owned, ...joined].length === 0 ? <p className="text-slate-600">Create a project or accept an invitation to begin.</p> :
        [...owned, ...joined].slice(0, 6).map(project => <Link className="block rounded-xl border border-slate-200 p-4 hover:border-indigo-300" href={`/projects/${project.id}`} key={project.id}>
          <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{project.title}</span><span className="text-sm text-slate-600">{project.status}</span></div>
          <p className="mt-2 text-sm text-slate-600">{project.taskCount ? `${project.completedTaskCount}/${project.taskCount} tasks done · ${project.progressPercent}%` : "No tasks assigned yet"}</p>
        </Link>)}
    </section>
    <section className={panelStyle + " space-y-4"} aria-label="My accepted tasks">
      <h2 className="text-xl font-bold">My accepted tasks</h2>
      {myTasks.length === 0 ? <p className="text-slate-600">Accepted task invitations will appear here.</p> :
        myTasks.map(task => <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4" key={task.assignmentId}>
          <div><p className="font-semibold">{task.title}</p><p className="text-sm text-slate-600">{task.projectTitle} · Due {new Date(task.deadlineAt).toLocaleDateString()}</p></div>
          <div className="flex items-center gap-3"><span className={"rounded-full px-3 py-1 text-xs font-bold " + (task.isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
            {task.isCompleted ? "Completed" : "Not completed"}
          </span><Link className={secondaryStyle} href={`/projects/${task.projectId}`}>View task</Link></div>
        </article>)}
    </section>
  </div>;
}

export function ProfilePage({ mode = "view" }: { mode?: "view" | "create" | "edit" }) {
  const { user, profile, skills, options, refresh, logout, busy } = useWorkspace();
  const router = useRouter();
  if (mode === "create" && profile) return <div className={panelStyle}><h1 className="text-2xl font-bold">Your profile is ready</h1><Link href="/profile" className="mt-4 inline-block text-indigo-700">View my profile →</Link></div>;
  if (mode !== "view" || !profile) return <div className="profile-form-page space-y-4">
    {mode === "edit" && <PageBack href="/profile" />}
    <StudentProfileForm user={user} student={profile} skills={skills} options={options}
      onSaved={async () => { await refresh(); router.push(mode === "create" ? "/dashboard" : "/profile"); }} />
  </div>;
  return <div className="profile-view-page">
    <div className="profile-view-heading">
      <PageBack />
      <h1 className="workspace-page-title">My profile</h1>
    </div>
    <section className={panelStyle + " profile-view-card"}>
      <div className="profile-identity">
        <ProfilePhoto student={profile} onChanged={refresh} />
        <h2>{profile.fullName}</h2>
        <p>{profile.preferredRole}</p>
        <p className="break-all">{profile.universityEmail}</p>
      </div>
      <div className="profile-details">
        <p className="whitespace-pre-wrap break-words text-slate-600">{profile.bio || "No bio added yet."}</p>
        <h3 className="font-semibold">Skills</h3><Tags values={profile.skills.map(skill => skill.name)} />
        <h3 className="font-semibold">Availability</h3><Tags values={profile.availability} />
        <p className="text-sm text-slate-500">Meeting periods use Sri Lanka local time.</p>
      </div>
      <div className="profile-actions">
          <Link className={buttonStyle} href="/profile/edit">Edit my profile</Link>
          <LogoutConfirm className={secondaryStyle} busy={busy} onLogout={logout} />
      </div>
    </section>
  </div>;
}

export function StudentsPage() {
  const { students, skills, options } = useWorkspace();
  return <StudentDirectory students={students} skills={skills} options={options} />;
}

export function ProjectsPage({ filter = "all" }: { filter?: "all" | "mine" }) {
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
    onEdit={() => router.push(`/projects/${id}/edit`)}
    onChanged={refresh} onDeleted={async () => { await refresh(); router.push("/projects/mine"); }} />;
}

export function InvitationsPage() {
  const { invitations, refresh } = useWorkspace();
  return <InvitationInbox invitations={invitations} onChanged={refresh} />;
}
