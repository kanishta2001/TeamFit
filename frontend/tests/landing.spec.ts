import { test, expect, type Page } from "@playwright/test";
import { displayName } from "../src/lib/display-name";
import type { Project, Skill, Student } from "../src/lib/types";

const catalog: Skill[] = [
  { id: 1, name: "React", categories: ["Frontend"] },
  { id: 2, name: "Next.js", categories: ["Frontend"] },
  { id: 3, name: "Kotlin", categories: ["Programming Languages", "Mobile Development"] },
  { id: 4, name: "Figma", categories: ["UI/UX & Design"] },
];

// These UI tests intercept API traffic. They never create accounts or touch SQL Server.
async function sessionApi(page: Page, initial: "guest" | "member" | "new" = "guest") {
  let signedIn = initial !== "guest";
  let profile: Student | null = initial === "member" ? {
    id: 1, userId: 1, fullName: "Nimal Perera", universityEmail: "private@example.test",
    bio: "Student", preferredRole: "Frontend Developer", skills: [], availability: [],
  } : null;
  const requested: string[] = [];
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/", "");
    requested.push(path);
    const send = (data: unknown, status = 200) => route.fulfill({
      status, contentType: "application/json", body: JSON.stringify(data),
      headers: { "Access-Control-Allow-Origin": request.headers().origin ?? new URL(page.url()).origin, "Access-Control-Allow-Credentials": "true" },
    });
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: {
      "Access-Control-Allow-Origin": request.headers().origin, "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    } });
    if (path === "auth/register" || path === "auth/login") {
      signedIn = true;
      return send({ user: { id: 1, email: "private@example.test" } }, path.endsWith("register") ? 201 : 200);
    }
    if (!signedIn) return send({ message: "Sign in required." }, 401);
    if (path === "auth/me") return send({ id: 1, email: "private@example.test" });
    if (path === "auth/logout") { signedIn = false; return route.fulfill({ status: 204 }); }
    if (path === "students/me") return profile ? send(profile) : send({}, 404);
    if (path === "students" && request.method() === "POST") {
      const input = request.postDataJSON();
      profile = { ...input, id: 1, userId: 1, skills: catalog.filter(skill => input.skillIds?.includes(skill.id)) };
      return send(profile, 201);
    }
    if (path === "students/1" && request.method() === "PUT") {
      const input = request.postDataJSON();
      profile = { ...profile!, ...input, skills: catalog.filter(skill => input.skillIds?.includes(skill.id)) };
      return send(profile);
    }
    if (path === "students") return send(profile ? [profile] : []);
    if (path === "options") return send({ roles: ["Frontend Developer"], availabilitySlots: ["Weekday Evening"] });
    if (path === "skills") return send(catalog);
    if (["projects", "invitations", "tasks/mine", "activity", "chats"].includes(path)) return send([]);
    if (path === "notifications") return send({ unreadCount: 0, items: [] });
    if (path === "notifications/read") return route.fulfill({ status: 204 });
    return send({ message: "Unexpected test endpoint: " + path }, 500);
  });
  return requested;
}

test("temporary username comes only from the first part of a profile name", () => {
  expect(displayName("Nimal Perera")).toBe("nimal");
  expect(displayName("   NIMAL    Perera  ")).toBe("nimal");
  expect(displayName("නිමල් පෙරේරා")).toBe("නිමල්");
  expect(displayName("Anne-Marie Silva")).toBe("anne-marie");
  expect(displayName("")).toBe("Student");
  expect(displayName(null)).toBe("Student");
});

test("guest home matches the simplified public experience and fictional cards", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const requests = await sessionApi(page);
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Register", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse projects", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Workspace navigation" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Let’s Build" })).toHaveAttribute("href", "/register");
  await expect(page.getByRole("heading", { name: "Sample projects", exact: true })).toHaveCount(0);
  await expect(page.getByText("Your next team starts here")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Campus Connect" })).toBeVisible();
  await expect(page.getByText("Fictional example", { exact: true })).toHaveCount(0);
  await expect(page.getByText("01 / 03", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Example projects, rotating automatically" }).getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "How it works", exact: true })).toHaveCount(0);
  await expect(page.getByText("Clear matching reasons", { exact: true })).toHaveCount(0);
  for (const label of ["Required skills", "Team size", "Roles needed", "Difficulty"])
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "test-results/guest-home-desktop.png", fullPage: true });
  await page.clock.fastForward(10000);
  await expect(page.getByRole("heading", { name: "Study Circle" })).toBeVisible();
  await page.clock.fastForward(10000);
  await expect(page.getByRole("heading", { name: "Green Campus" })).toBeVisible();
  await page.getByRole("link", { name: "How it works", exact: true }).click();
  await expect(page).toHaveURL(/\/how-it-works$/);
  await expect(page.getByRole("heading", { name: "How TeamFit works." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Form a balanced team" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go to previous page" })).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL("/");
  expect(requests.every(path => path === "auth/me")).toBeTruthy();
  expect(errors).toEqual([]);
});

test("signed-in home hides workspace navigation but keeps profile access and logout", async ({ page }) => {
  const requests = await sessionApi(page, "member");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header.getByText("nimal", { exact: true })).toBeVisible();
  await expect(header).not.toContainText("private@example.test");
  await expect(page.getByRole("link", { name: "Let’s Build" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browse projects", exact: true })).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Workspace navigation" });
  await expect(navigation).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("link", { name: "How it works", exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "test-results/member-home-desktop.png", fullPage: true });
  await page.getByRole("main").getByRole("link", { name: "Workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(navigation).toHaveCount(0);
  await expect(page.getByRole("banner")).toContainText("nimal");
  await expect(page.getByRole("banner")).not.toContainText("private@example.test");
  await page.getByRole("link", { name: "TeamFit home" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/dashboard");
  await expect(navigation).toHaveCount(0);
  for (const label of ["Create project", "Browse projects", "Joined projects (0)"])
    await expect(page.getByRole("link", { name: label, exact: true })).toHaveCount(0);
  await page.goto("/");
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  const logoutDialog = page.getByRole("dialog", { name: "Log out of TeamFit?" });
  await expect(logoutDialog).toBeVisible();
  await expect(logoutDialog).toBeInViewport();
  await expect(logoutDialog.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(logoutDialog.getByRole("button", { name: "Log out" })).toBeVisible();
  await logoutDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(logoutDialog).not.toBeVisible();
  expect(requests).not.toContain("auth/logout");
  await expect(page.getByRole("link", { name: "Browse projects", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await logoutDialog.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Login", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Workspace navigation" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browse projects", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("link", { name: "Register", exact: true })).toBeVisible();
});

test("notification popup uses a single See all link to the notifications page", async ({ page }) => {
  await sessionApi(page, "member");
  await page.goto("/");
  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  const panel = page.getByRole("region", { name: "Notifications panel" });
  await expect(panel.getByText("Recently opened", { exact: true })).toHaveCount(0);
  await expect(panel.getByRole("link", { name: "Invitation inbox", exact: true })).toHaveCount(0);
  await expect(panel.getByRole("link", { name: "chats", exact: true })).toHaveCount(0);
  await panel.getByRole("link", { name: "See all", exact: true }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
});

test("profile creation and edits generate the header name; login opens dashboard", async ({ page }) => {
  await sessionApi(page);
  await page.goto("/register");
  await page.getByLabel("Email", { exact: true }).fill("private@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Example-password!12");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page).toHaveURL(/\/profile\/create$/);
  await expect(page.getByRole("banner")).toContainText("Student");
  await expect(page.getByRole("heading", { name: "Create new profile" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: /My profile:/ })).toHaveCount(0);
  await page.screenshot({ path: "test-results/profile-create-desktop.png", fullPage: true });
  for (const path of ["/dashboard", "/profile", "/profile/edit", "/students", "/projects", "/projects/new", "/invitations"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/profile\/create$/);
  }
  await page.getByLabel("Full name", { exact: true }).fill("Nimal Perera");
  await page.getByLabel("Preferred project role").selectOption("Frontend Developer");
  const selector = page.getByRole("combobox", { name: "Your skills" });
  await selector.fill("React");
  await expect(page.getByText("Frontend", { exact: true })).toBeVisible();
  await selector.press("Enter");
  await expect(page.getByRole("button", { name: "Remove React" })).toBeVisible();
  await selector.fill("Kotlin");
  await expect(page.getByRole("option", { name: "Kotlin", exact: true })).toHaveCount(2);
  await page.getByRole("option", { name: "Kotlin", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Remove Kotlin" })).toHaveCount(1);
  await selector.fill("Kotlin");
  await expect(page.getByRole("option", { name: "Kotlin", exact: true })).toHaveCount(0);
  await selector.fill("not in catalogue");
  await expect(page.getByText("No matching skills in the catalogue.")).toBeVisible();
  await selector.press("Enter");
  await expect(page.getByRole("button", { name: "Remove not in catalogue" })).toHaveCount(0);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("banner")).toContainText("nimal");
  await page.getByRole("banner").getByRole("link", { name: /My profile:/ }).click();
  await expect(page.getByText("React", { exact: true })).toBeVisible();
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBeTruthy();
  await page.screenshot({ path: "test-results/profile-view-desktop.png", fullPage: true });
  await page.goto("/profile/edit");
  await expect(page.getByRole("button", { name: "Remove React" })).toBeVisible();
  await page.getByRole("button", { name: "Remove React" }).click();
  await expect(page.getByRole("button", { name: "Remove React" })).toHaveCount(0);
  await page.getByLabel("Full name", { exact: true }).fill("Kasun Perera");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Kasun Perera", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.getByRole("dialog", { name: "Log out of TeamFit?" }).getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "Login", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("private@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Example-password!12");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("banner")).toContainText("kasun");
  await page.reload();
  await expect(page.getByRole("banner")).toContainText("kasun");
});

test("profile layout keeps actions visible without a header or page scrolling", async ({ page }) => {
  const requests = await sessionApi(page, "member");
  await page.route("**/api/students/me", route => route.fulfill({ json: {
    id: 1, userId: 1, fullName: "Nimal Perera", universityEmail: "private@example.test",
    bio: "No bio added yet.", preferredRole: "Full-stack Developer",
    skills: catalog.slice(0, 2), availability: ["Weekday Afternoon", "Weekday Morning"],
  } }));
  for (const [width, height] of [[976, 513], [1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "My profile", exact: true })).toBeVisible();
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "TeamFit home" })).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const edit = page.getByRole("link", { name: "Edit my profile", exact: true });
    const logout = page.getByRole("button", { name: "Log out", exact: true });
    await expect(edit).toBeInViewport();
    await expect(logout).toBeInViewport();
    const editBounds = (await edit.boundingBox())!;
    const logoutBounds = (await logout.boundingBox())!;
    expect(Math.abs(editBounds.y - logoutBounds.y)).toBeLessThan(2);
    const bounds = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    expect(bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.height).toBeLessThanOrEqual(height);
    await page.screenshot({ path: `test-results/profile-layout-${width}.png`, fullPage: true });
  }
  await page.getByRole("link", { name: "Edit my profile", exact: true }).click();
  await expect(page).toHaveURL(/\/profile\/edit$/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/profile");
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  const logoutDialog = page.getByRole("dialog", { name: "Log out of TeamFit?" });
  await expect(logoutDialog).toBeVisible();
  await expect(logoutDialog).toBeInViewport();
  await expect(logoutDialog.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(logoutDialog.getByRole("button", { name: "Log out" })).toBeVisible();
  await page.screenshot({ path: "test-results/profile-logout-confirmation.png" });
  await logoutDialog.getByRole("button", { name: "Cancel" }).click();
  expect(requests).not.toContain("auth/logout");
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await logoutDialog.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");
  expect(requests).toContain("auth/logout");
});

test("portrait and landscape photos stay inside profile and dashboard circles", async ({ page }) => {
  await sessionApi(page, "member");
  await page.route("**/api/students/me", route => route.fulfill({ json: {
    id: 1, userId: 1, fullName: "Nimal Perera", universityEmail: "private@example.test",
    bio: "Student", preferredRole: "Frontend Developer", skills: [], availability: [], photoVersion: "test-photo",
  } }));
  for (const [width, height] of [[1200, 300], [300, 1200]]) {
    const dataUrl = await page.evaluate(([w, h]) => {
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#153e72"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#f0c45c"; ctx.fillRect(w / 3, h / 3, w / 3, h / 3);
      return canvas.toDataURL("image/png");
    }, [width, height]);
    await page.route("**/api/students/1/photo?*", route => route.fulfill({
      contentType: "image/png", body: Buffer.from(dataUrl.split(",")[1], "base64"),
    }));
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const path of ["/profile", "/dashboard"]) {
        await page.goto(path);
        const photo = page.getByRole("img", { name: "Nimal Perera's profile picture", exact: true });
        await expect(photo).toBeVisible();
        await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(width);
        const bounds = await photo.evaluate(img => {
          const circle = img.parentElement!;
          return { image: img.getBoundingClientRect().toJSON(), circle: circle.getBoundingClientRect().toJSON(),
            overflow: getComputedStyle(circle).overflow, radius: getComputedStyle(circle).borderRadius,
            fit: getComputedStyle(img).objectFit };
        });
        expect(bounds.image.width).toBeCloseTo(bounds.circle.width, 0);
        expect(bounds.image.height).toBeCloseTo(bounds.circle.height, 0);
        expect(bounds.image.x).toBeCloseTo(bounds.circle.x, 0);
        expect(bounds.image.y).toBeCloseTo(bounds.circle.y, 0);
        expect(bounds.circle.width).toBeCloseTo(bounds.circle.height, 0);
        expect(bounds.overflow).toBe("hidden");
        expect(bounds.radius).toBe("50%");
        expect(bounds.fit).toBe("cover");
      }
    }
    await page.unroute("**/api/students/1/photo?*");
  }
});

test("Create project appears only in My projects", async ({ page }) => {
  await sessionApi(page, "member");
  await page.goto("/projects");
  await expect(page.getByRole("link", { name: "Create project", exact: true })).toHaveCount(0);
  await page.screenshot({ path: "test-results/projects-all-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "My projects", exact: true }).click();
  await expect(page.getByRole("link", { name: "Create project", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project views" }).getByRole("link")).toHaveCount(2);
  await page.screenshot({ path: "test-results/projects-mine-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Create project", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.getByRole("heading", { name: "Create a project" })).toBeVisible();
  await page.getByRole("combobox", { name: "Required skills" }).fill("React");
  await page.getByRole("option", { name: "React", exact: true }).click();
  await page.getByRole("checkbox", { name: "Frontend Developer", exact: true }).check();
  await expect(page.getByRole("checkbox", { name: "Frontend Developer", exact: true })).toBeChecked();
  await page.getByRole("link", { name: "TeamFit home" }).click();
  await expect(page).toHaveURL("/");
});

test("My projects combines owned and joined projects with clear labels", async ({ page }) => {
  await sessionApi(page, "member");
  const base: Project = {
    id: 1, ownerId: 1, title: "Owned example", description: "Owner's project", teamSize: 4,
    memberCount: 1, isMember: true, taskCount: 0, completedTaskCount: 0, progressPercent: 0,
    status: "Open", requiredSkills: [], desiredRoles: [], availability: [],
  };
  await page.route("**/api/projects", route => route.fulfill({ json: [
    base,
    { ...base, id: 2, ownerId: 2, title: "Joined example" },
    { ...base, id: 3, ownerId: 3, title: "Other example", isMember: false },
  ] }));

  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /^My projects/ })).toContainText("02");
  await page.getByRole("link", { name: /^My projects/ }).click();
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(2);
  await expect(cards.filter({ hasText: "Owned example" }).getByText("Owner", { exact: true })).toBeVisible();
  await expect(cards.filter({ hasText: "Joined example" }).getByText("Joined", { exact: true })).toBeVisible();
  await expect(page.getByText("Other example")).toHaveCount(0);

  await page.goto("/projects/joined");
  await expect(page).toHaveURL(/\/projects\/mine$/);
  await expect(cards).toHaveCount(2);
});

test("workspace pages do not render undo arrow controls", async ({ page }) => {
  await sessionApi(page, "member");
  for (const path of ["/how-it-works", "/dashboard", "/students", "/invitations", "/notifications", "/profile", "/profile/edit", "/projects", "/projects/mine", "/chats"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "Go to previous page" })).toHaveCount(0);
  }
});

for (const state of ["guest", "member"] as const) {
  test(state + " home fits the viewport vertically across desktop and laptop sizes", async ({ page }) => {
    await sessionApi(page, state);
    await page.clock.install();
    for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 600], [888, 429], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await expect(page.getByText("Checking session…")).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      // Verify all three automatic slides, not just the shortest card.
      for (let slide = 0; slide < 3; slide++) {
        const bounds = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
          cardBottom: document.querySelector(".example-project")!.getBoundingClientRect().bottom,
        }));
        expect(bounds.width, `horizontal overflow at ${width}x${height}`).toBeLessThanOrEqual(width);
        expect(bounds.height, `vertical overflow at ${width}x${height}, slide ${slide}`).toBeLessThanOrEqual(height);
        expect(bounds.cardBottom, "Do not clip the bottom of the card").toBeLessThanOrEqual(height);
        await page.clock.fastForward(10000);
      }
    }
  });
  test(state + " layout fits mobile and tablet without horizontal scrolling", async ({ page }) => {
    await sessionApi(page, state);
    for (const width of [390, 320, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Campus Connect" })).toBeVisible();
      await expect(page.getByText("Checking session…")).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      if (width === 390) await page.screenshot({ path: `test-results/${state}-home-mobile.png`, fullPage: true });
    }
  });
}

test("a failed session check preserves the public page and offers retry", async ({ page }) => {
  let unavailable = true;
  await page.route("**/api/**", route => route.fulfill({
    status: unavailable ? 500 : 401, contentType: "application/json",
    body: JSON.stringify({ message: unavailable ? "Backend unavailable" : "Sign in required" }),
    headers: { "Access-Control-Allow-Origin": new URL(page.url()).origin, "Access-Control-Allow-Credentials": "true" },
  }));
  await page.goto("/");
  await expect(page.getByRole("alert", { name: "Session connection error" })).toContainText("Backend unavailable");
  await expect(page.getByRole("heading", { name: "Campus Connect" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse projects", exact: true })).toHaveCount(0);
  unavailable = false;
  await page.getByRole("button", { name: "Retry connection" }).click();
  await expect(page.getByRole("alert", { name: "Session connection error" })).toHaveCount(0);
});

test("automatic cards loop and pause while reading or when reduced motion is requested", async ({ page }) => {
  await sessionApi(page);
  await page.clock.install();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Login", exact: true })).toBeVisible();
  const showcase = page.getByRole("region", { name: "Example projects, rotating automatically" });
  await showcase.hover();
  await page.clock.fastForward(10000);
  await expect(page.getByRole("heading", { name: "Campus Connect" })).toBeVisible();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(10000);
  await expect(page.getByRole("heading", { name: "Study Circle" })).toBeVisible();
  await showcase.focus();
  await page.clock.fastForward(10000);
  await expect(page.getByRole("heading", { name: "Study Circle" })).toBeVisible();
  await page.getByRole("link", { name: "Login", exact: true }).focus();
  await page.clock.fastForward(10000);
  await expect(page.getByRole("heading", { name: "Green Campus" })).toBeVisible();
  await page.clock.fastForward(10000);
  await expect(page.getByRole("heading", { name: "Campus Connect" })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.fastForward(20000);
  await expect(page.getByRole("heading", { name: "Campus Connect" })).toBeVisible();
});

test("private routes still require login and preserve the requested destination", async ({ page }) => {
  await sessionApi(page);
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/login\?next=%2Fprojects$/);
  await expect(page.getByRole("heading", { name: "Welcome back to TeamFit" })).toBeVisible();
});
