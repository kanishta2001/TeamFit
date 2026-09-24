export type User = { id: number; email: string };
export type Skill = { id: number; name: string; categories?: string[] };
export type Options = { roles: string[]; availabilitySlots: string[] };
export type Student = {
  id: number; userId: number | null; fullName: string; universityEmail: string;
  bio: string | null; preferredRole: string; skills: Skill[]; availability: string[];
  photoVersion?: string | null;
};
export type Project = {
  id: number; ownerId: number; title: string; description: string; teamSize: number;
  memberCount: number; isMember: boolean; taskCount: number; completedTaskCount: number;
  progressPercent: number; status: "Open" | "InProgress" | "Completed";
  requiredSkills: Skill[]; desiredRoles: string[]; availability: string[];
};
export type Recommendation = {
  student: Student; score: number; skillScore: number; roleScore: number;
  availabilityScore: number; requiredSkillCount: number; matchedSkills: Skill[];
  missingSkills: Skill[]; roleMatched: boolean; sharedAvailability: string[];
};
export type Member = {
  studentId: number; userId: number; fullName: string; preferredRole: string;
};
export type Invitation = {
  id: number; projectId: number; title: string; projectStatus: string;
  kind: "Project" | "Task"; status: string; createdAt: string;
  taskId: number | null; taskTitle: string | null; deadlineAt: string | null;
};
export type SentInvitation = { id: number; studentId: number; fullName: string; status: string };
export type ProjectTask = {
  id: number; title: string; description: string | null; deadlineDays: number; dueAt: string;
  isCompleted: boolean; assignments: TaskAssignment[];
};
export type TaskAssignment = {
  id: number; studentId: number; fullName: string; status: "Pending" | "Accepted" | "Rejected";
  isCompleted: boolean;
};
export type MyTask = {
  assignmentId: number; taskId: number; projectId: number; projectTitle: string;
  title: string; description: string | null; deadlineAt: string; isCompleted: boolean;
};
export type ActivityFeedItem = {
  id: string; type: "ProjectCreated" | "TaskCreated" | "TaskAccepted" | "TaskCompleted" | "Invitation" | "MemberJoined" | "Message";
  title: string; detail: string; createdAt: string; href: string;
};
export type NotificationSummary = { unreadCount: number; items: ActivityFeedItem[] };
export type ChatThread = {
  projectId: number; projectTitle: string; unreadCount: number;
  lastMessage: string | null; lastMessageAt: string | null;
};
export type ChatMessage = {
  id: number; projectId: number; senderUserId: number; senderName: string;
  body: string; createdAt: string; isMine: boolean;
};
