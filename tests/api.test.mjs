// Run through scripts/test.ps1: it supplies a disposable SQL Server database and API.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const base = process.env.TEAMFIT_TEST_API;
if (!base || !process.env.TEAMFIT_ISOLATED_TEST) throw new Error("Use scripts/test.ps1; never run these fixtures against real student data.");
const prefix = crypto.randomUUID().slice(0, 8);
const password = "TeamFit-test-password!23";
let assertions = 0;
async function request(path, { method = "GET", body, token, status = 200, headers = {} } = {}) {
  const response = await fetch(base + "/api/" + path, {
    method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: "Bearer " + token } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  assert.equal(response.status, status, method + " " + path + ": " + text); assertions++;
  return { data: text ? JSON.parse(text) : null, headers: response.headers };
}

test("complete authenticated team workflow, validation, ownership, capacity and revocation", async () => {
  const options = (await request("options")).data;
  assert.equal(options.roles.length, 7);
  await request("students", { status: 401 });
  await request("projects", { status: 401 });
  await request("auth/register", { method: "POST", body: { email: "bad", password: "123" }, status: 400 });
  const accounts = [];
  for (const label of ["Owner", "React", "Backend"]) {
    const result = await request("auth/register", { method: "POST", body: { email: prefix + label + "@example.test", password }, status: 201 });
    assert.match(result.headers.get("set-cookie"), /httponly/i);
    assert.match(result.headers.get("set-cookie"), /samesite=strict/i);
    accounts.push({ ...result.data.user, token: result.data.token, label, cookie: result.headers.get("set-cookie").split(";")[0] });
  }
  const [owner, react, backend] = accounts;
  await request("auth/register", { method: "POST", body: { email: owner.email, password }, status: 409 });
  await request("auth/login", { method: "POST", body: { email: owner.email, password: "wrong" }, status: 401 });
  await request("auth/login", { method: "POST", body: { email: owner.email, password } });
  await request("auth/me", { headers: { Cookie: owner.cookie } });
  await request("skills", { method: "POST", body: { name: "CSRF blocked" }, headers: { Cookie: owner.cookie, Origin: "https://untrusted.example" }, status: 403 });
  const skills = (await request("skills", { token: owner.token })).data;
  const a = skills.find(skill => skill.name === "React");
  const b = skills.find(skill => skill.name === "SQL Server");
  assert.ok(a?.categories.includes("Frontend"));
  assert.ok(b?.categories.includes("Databases"));
  assert.deepEqual(skills.find(skill => skill.name === "Kotlin").categories, ["Programming Languages", "Mobile Development"]);
  await request("skills", { token: owner.token, method: "POST", body: { name: prefix + " React" }, status: 405 });
  const profile = account => ({
    fullName: account.label, universityEmail: account.email, bio: "Integration test",
    preferredRole: account === backend ? "Backend Developer" : "Frontend Developer",
    skillIds: [account === backend ? b.id : a.id], availability: ["Weekday Evening"],
  });
  await request("students", { token: owner.token, method: "POST", body: { ...profile(owner), skillIds: [2147483647] }, status: 400 });
  await request("students", { token: owner.token, method: "POST", body: { ...profile(owner), universityEmail: react.email }, status: 400 });
  for (const account of accounts) {
    account.profile = (await request("students", { token: account.token, method: "POST", body: profile(account), status: 201 })).data;
    assert.equal(account.profile.skills.length, 1);
    assert.deepEqual(account.profile.availability, ["Weekday Evening"]);
  }
  const photoPath = `students/${owner.profile.id}/photo`;
  const png = readFileSync(new URL("../frontend/public/brand/teamfit-logo.png", import.meta.url));
  async function uploadPhoto(token, bytes = png, status = 200, headers = {}) {
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "image/png" }), "avatar.png");
    const response = await fetch(`${base}/api/${photoPath}`, {
      method: "PUT", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: form,
    });
    assert.equal(response.status, status); assertions++;
    return response;
  }
  assert.equal(owner.profile.photoVersion, null);
  await request(photoPath, { token: owner.token, status: 404 });
  await uploadPhoto(undefined, png, 401);
  await uploadPhoto(react.token, png, 403);
  await uploadPhoto(owner.token, Buffer.from("<svg></svg>"), 400);
  await uploadPhoto(owner.token, Buffer.alloc(2 * 1024 * 1024 + 1), 400);
  await uploadPhoto(undefined, png, 403, { Cookie: owner.cookie, Origin: "https://untrusted.example" });
  const savedPhoto = await (await uploadPhoto(owner.token)).json();
  const readPhoto = await fetch(`${base}/api/${photoPath}`, { headers: { Cookie: owner.cookie } });
  assert.equal(readPhoto.status, 200); assertions++;
  assert.equal(readPhoto.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await readPhoto.arrayBuffer()), png);
  assert.equal((await request("students/me", { token: owner.token })).data.photoVersion, savedPhoto.photoVersion);
  await request(photoPath, { status: 401 });
  const replacement = await (await uploadPhoto(owner.token)).json();
  assert.notEqual(replacement.photoVersion, savedPhoto.photoVersion);
  await request(photoPath, { token: react.token, method: "DELETE", status: 403 });
  await request(photoPath, { token: owner.token, method: "DELETE", status: 204 });
  await request(photoPath, { token: owner.token, status: 404 });
  assert.equal((await request("students/me", { token: owner.token })).data.photoVersion, null);
  // Leave a photo attached to verify cascading cleanup when the profile is deleted.
  await uploadPhoto(owner.token);
  await request("students", { token: owner.token, method: "POST", body: profile(owner), status: 409 });
  await request("students/" + owner.profile.id, { token: react.token, method: "PUT", body: profile(owner), status: 403 });
  await request("students/" + owner.profile.id, { token: react.token, method: "DELETE", status: 403 });
  await request("students/" + owner.profile.id + "/skills", { token: react.token, method: "POST", body: { skillId: b.id }, status: 403 });
  await request("students/" + owner.profile.id + "/skills", { token: owner.token, method: "POST", body: { skillId: b.id }, status: 201 });
  await request("students/" + owner.profile.id + "/skills", { token: owner.token, method: "POST", body: { skillId: b.id }, status: 409 });
  await request("students/" + owner.profile.id + "/skills/" + b.id, { token: owner.token, method: "DELETE", status: 204 });
  await request("students/" + owner.profile.id, { token: owner.token, method: "PUT", body: { ...profile(owner), skillIds: [a.id, b.id], availability: ["Weekend Morning"] } });
  const updated = (await request("students/" + owner.profile.id, { token: owner.token, method: "PUT", body: profile(owner) })).data;
  assert.deepEqual(updated.skills.map(x => x.id), [a.id]);
  assert.equal((await request("students?skillId=" + b.id, { token: owner.token })).data.length, 1);
  assert.equal((await request("students?search=React&role=Frontend%20Developer&availability=Weekday%20Evening", { token: owner.token })).data.length, 1);
  const projectBody = { title: "Test team", description: "Build a tested student project", teamSize: 2, status: "Open",
    requiredSkillIds: [a.id, b.id], desiredRoles: ["Frontend Developer"], availability: ["Weekday Evening"] };
  await request("projects", { token: owner.token, method: "POST", body: { ...projectBody, requiredSkillIds: [] }, status: 400 });
  await request("projects", { token: owner.token, method: "POST", body: { ...projectBody, availability: null }, status: 400 });
  const project = (await request("projects", { token: owner.token, method: "POST", body: projectBody, status: 201 })).data;
  const path = "projects/" + project.id;
  assert.equal(project.memberCount, 1);
  await request(path, { token: react.token, method: "PUT", body: projectBody, status: 403 });
  await request(path, { token: react.token, method: "DELETE", status: 403 });
  await request(path + "/recommendations", { token: react.token, status: 403 });
  let matches = (await request(path + "/recommendations", { token: owner.token })).data;
  assert.deepEqual(matches.map(x => x.score), [70, 45]); assertions++;
  assert.equal(matches[0].student.id, react.profile.id);
  assert.equal(matches[0].matchedSkills.length, 1);
  assert.equal(matches[0].missingSkills.length, 1);
  await request(path, { token: owner.token, method: "PUT", body: { ...projectBody, requiredSkillIds: [b.id], desiredRoles: ["Backend Developer"], availability: ["Weekend Morning"] } });
  matches = (await request(path + "/recommendations", { token: owner.token })).data;
  assert.deepEqual(matches.map(x => x.score), [85, 0]); assertions++;
  await request(path, { token: owner.token, method: "PUT", body: projectBody });
  await request(path + "/members/" + owner.profile.id, { token: owner.token, method: "DELETE", status: 409 });
  await request("students/" + owner.profile.id, { token: owner.token, method: "DELETE", status: 409 });
  const invite = async account => (await request(path + "/invitations", { token: owner.token, method: "POST", body: { studentId: account.profile.id }, status: 201 })).data;
  const first = await invite(react);
  await request(path + "/invitations", { token: owner.token, method: "POST", body: { studentId: react.profile.id }, status: 409 });
  await request("invitations/" + first.id, { token: backend.token, method: "PUT", body: { status: "Accepted" }, status: 403 });
  await request("invitations/" + first.id, { token: react.token, method: "PUT", body: { status: "Invalid" }, status: 400 });
  await request("invitations/" + first.id, { token: react.token, method: "PUT", body: { status: "Rejected" } });
  await invite(react);
  await request("invitations/" + first.id, { token: owner.token, method: "DELETE", status: 204 });
  await request("invitations/" + first.id, { token: react.token, method: "PUT", body: { status: "Accepted" }, status: 409 });
  await invite(react);
  const second = await invite(backend);
  assert.equal((await request("invitations", { token: react.token })).data.length, 1);
  // Race two accepts for one remaining seat: exactly one must succeed.
  const races = await Promise.all([[react, first], [backend, second]].map(async ([account, invitation]) => {
    const response = await fetch(base + "/api/invitations/" + invitation.id, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + account.token },
      body: JSON.stringify({ status: "Accepted" }),
    });
    return { account, invitation, status: response.status };
  }));
  assert.deepEqual(races.map(x => x.status).sort(), [200, 409]); assertions++;
  const winner = races.find(x => x.status === 200);
  const loser = races.find(x => x.status === 409);
  // Project chat is restricted to the owner and accepted team members, with per-user unread counts.
  const ownerThreads = (await request("chats", { token: owner.token })).data;
  assert.equal(ownerThreads.some(x => x.projectId === project.id), true);
  await request(`chats/${project.id}/messages`, { token: loser.account.token, status: 403 });
  await request(`chats/${project.id}/messages`, { token: owner.token, method: "POST", body: { body: "Welcome to the team" }, status: 201 });
  let winnerThreads = (await request("chats", { token: winner.account.token })).data;
  assert.equal(winnerThreads.find(x => x.projectId === project.id).unreadCount, 1);
  const chatMessages = (await request(`chats/${project.id}/messages`, { token: winner.account.token })).data;
  assert.equal(chatMessages.at(-1).body, "Welcome to the team");
  await request(`chats/${project.id}/read`, { token: winner.account.token, method: "POST", status: 204 });
  winnerThreads = (await request("chats", { token: winner.account.token })).data;
  assert.equal(winnerThreads.find(x => x.projectId === project.id).unreadCount, 0);
  const notificationSummary = (await request("notifications", { token: winner.account.token })).data;
  assert.ok(notificationSummary.unreadCount > 0);
  assert.ok(notificationSummary.items.some(x => x.type === "Message"));
  await request("notifications/read", { token: winner.account.token, method: "POST", status: 204 });
  assert.equal((await request("notifications", { token: winner.account.token })).data.unreadCount, 0);
  assert.ok((await request("activity", { token: winner.account.token })).data.some(x => x.type === "Message"));
  // Tasks support multiple assignees, acceptance, deadlines, and per-member completion.
  const tasksPath = path + "/tasks";
  const taskBody = { title: "Build student screen", description: "Use accessible form controls",
    assignedStudentIds: [winner.account.profile.id, owner.profile.id], deadlineDays: 2 };
  await request(tasksPath, { status: 401 });
  await request(tasksPath, { token: loser.account.token, status: 403 });
  await request(tasksPath, { token: winner.account.token, method: "POST", body: taskBody, status: 403 });
  await request(tasksPath, { token: owner.token, method: "POST", body: { ...taskBody, title: "   " }, status: 400 });
  await request(tasksPath, { token: owner.token, method: "POST", body: { ...taskBody, assignedStudentIds: [] }, status: 400 });
  await request(tasksPath, { token: owner.token, method: "POST", body: { ...taskBody, assignedStudentIds: [loser.account.profile.id] }, status: 400 });
  await request(tasksPath, { token: owner.token, method: "POST", body: { ...taskBody, deadlineDays: 0 }, status: 400 });
  const task = (await request(tasksPath, { token: owner.token, method: "POST", body: taskBody, status: 201 })).data;
  assert.equal(task.assignments.length, 2);
  assert.equal(task.deadlineDays, 2);
  const otherTask = (await request(tasksPath, { token: owner.token, method: "POST", body: {
    ...taskBody, title: "Review changes", assignedStudentIds: [owner.profile.id], deadlineDays: 3 }, status: 201 })).data;
  assert.equal((await request(tasksPath, { token: winner.account.token })).data.length, 2);
  let progress = (await request(path, { token: winner.account.token })).data;
  assert.equal(progress.isMember, true);
  assert.equal(progress.taskCount, 2);
  assert.equal(progress.progressPercent, 0);
  assert.equal((await request(path, { token: loser.account.token })).data.isMember, false);
  await request(tasksPath + "/" + task.id, { token: winner.account.token, method: "PUT", body: taskBody, status: 403 });
  await request(tasksPath + "/" + task.id, { token: winner.account.token, method: "DELETE", status: 403 });
  const winnerTaskInvite = (await request("invitations", { token: winner.account.token })).data.find(x => x.kind === "Task" && x.taskId === task.id);
  const ownerInvites = (await request("invitations", { token: owner.token })).data.filter(x => x.kind === "Task");
  const ownerTaskInvite = ownerInvites.find(x => x.taskId === task.id);
  const ownerOtherInvite = ownerInvites.find(x => x.taskId === otherTask.id);
  await request("invitations/tasks/" + winnerTaskInvite.id, { token: loser.account.token, method: "PUT", body: { status: "Accepted" }, status: 403 });
  await request("invitations/tasks/" + winnerTaskInvite.id, { token: winner.account.token, method: "PUT", body: { status: "Invalid" }, status: 400 });
  await request("invitations/tasks/" + winnerTaskInvite.id, { token: winner.account.token, method: "PUT", body: { status: "Accepted" } });
  await request("invitations/tasks/" + ownerTaskInvite.id, { token: owner.token, method: "PUT", body: { status: "Accepted" } });
  await request("invitations/tasks/" + ownerOtherInvite.id, { token: owner.token, method: "PUT", body: { status: "Accepted" } });
  assert.equal((await request("tasks/mine", { token: winner.account.token })).data.length, 1);
  await request(tasksPath + "/" + task.id + "/completion", { token: loser.account.token, method: "PATCH", body: { completed: true }, status: 403 });
  await request(tasksPath + "/" + otherTask.id + "/completion", { token: winner.account.token, method: "PATCH", body: { completed: true }, status: 403 });
  await request(tasksPath + "/" + task.id + "/completion", { token: winner.account.token, method: "PATCH", body: { completed: true } });
  assert.equal((await request(path, { token: owner.token })).data.progressPercent, 0);
  await request(tasksPath + "/" + task.id + "/completion", { token: owner.token, method: "PATCH", body: { completed: true } });
  progress = (await request(path, { token: owner.token })).data;
  assert.equal(progress.completedTaskCount, 1);
  assert.equal(progress.progressPercent, 50);
  await request(tasksPath + "/" + otherTask.id + "/completion", { token: owner.token, method: "PATCH", body: { completed: true } });
  assert.equal((await request(path, { token: owner.token })).data.progressPercent, 100);
  await request(tasksPath + "/" + otherTask.id, { token: owner.token, method: "PUT", body: {
    ...taskBody, title: "Reviewed", assignedStudentIds: [owner.profile.id], deadlineDays: 4 } });
  const secondProject = (await request("projects", { token: owner.token, method: "POST", body: projectBody, status: 201 })).data;
  await request("projects/" + secondProject.id + "/tasks/" + task.id, { token: owner.token, method: "PUT", body: taskBody, status: 404 });
  await request("projects/" + secondProject.id, { token: owner.token, method: "DELETE", status: 204 });
  await request(tasksPath + "/" + otherTask.id, { token: owner.token, method: "DELETE", status: 204 });
  assert.equal((await request(tasksPath, { token: owner.token })).data.length, 1);
  assert.equal((await request(path + "/members", { token: owner.token })).data.length, 2);
  assert.equal((await request("projects?mine=true", { token: winner.account.token })).data.length, 1);
  await request("invitations/" + winner.invitation.id, { token: winner.account.token, method: "PUT", body: { status: "Accepted" }, status: 409 });
  await request(path + "/members/" + winner.account.profile.id, { token: loser.account.token, method: "DELETE", status: 403 });
  await request(path, { token: owner.token, method: "PUT", body: { ...projectBody, status: "Completed" } });
  await request("invitations/" + loser.invitation.id, { token: loser.account.token, method: "PUT", body: { status: "Accepted" }, status: 409 });
  await request(path + "/members/" + winner.account.profile.id, { token: winner.account.token, method: "DELETE", status: 204 });
  const preservedTask = (await request(tasksPath, { token: owner.token })).data[0];
  assert.equal(preservedTask.assignments.some(x => x.studentId === winner.account.profile.id), false);
  assert.equal(preservedTask.assignments.some(x => x.studentId === owner.profile.id), true);
  await request(tasksPath, { token: winner.account.token, status: 403 });
  await request(tasksPath + "/" + task.id + "/completion", { token: winner.account.token, method: "PATCH", body: { completed: false }, status: 403 });
  assert.equal((await request(path, { token: winner.account.token })).data.isMember, false);
  await request(path + "/invitations", { token: owner.token, method: "POST", body: { studentId: winner.account.profile.id }, status: 409 });
  await request(path, { token: owner.token, method: "DELETE", status: 204 });
  assert.deepEqual((await request("invitations", { token: react.token })).data, []);
  await request(path, { token: owner.token, status: 404 });
  await request(tasksPath, { token: owner.token, status: 404 });
  for (const account of accounts) {
    await request("students/" + account.profile.id, { token: account.token, method: "DELETE", status: 204 });
    await request("students/me", { token: account.token, status: 404 });
  }
  await request(photoPath, { token: owner.token, status: 404 });
  await request("auth/logout", { token: owner.token, method: "POST", status: 204 });
  await request("auth/me", { token: owner.token, status: 401 });
  await request("auth/me", { headers: { Cookie: owner.cookie }, status: 401 });
  console.log("Verified " + assertions + " API/status/algorithm assertions against isolated SQL Server.");
});
