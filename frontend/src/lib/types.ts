export type User = { id: number; email: string };
export type Skill = { id: number; name: string };
export type Options = { roles: string[]; availabilitySlots: string[] };
export type Student = {
  id: number; userId: number | null; fullName: string; universityEmail: string;
  bio: string | null; preferredRole: string; skills: Skill[]; availability: string[];
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
  status: string; createdAt: string;
};
export type SentInvitation = { id: number; studentId: number; fullName: string; status: string };
export type ProjectTask = {
  id: number; title: string; description: string | null; assignedStudentId: number | null;
  assignedStudentName: string | null; status: "Todo" | "InProgress" | "Done";
};
