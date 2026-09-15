import { test, expect, type Page } from "@playwright/test";

test("two students form a team entirely through the browser", async ({ browser }) => {
  test.skip(!process.env.TEAMFIT_ISOLATED_TEST, "Run scripts/test.ps1 -Browser to avoid modifying real student data.");
  const suffix = Date.now();
  const password = "Browser-test-password!2026";
  const errors: string[] = [];
  const ownerContext = await browser.newContext();
  const memberContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const member = await memberContext.newPage();
  for (const page of [owner, member]) page.on("pageerror", error => errors.push(error.message));

  async function register(page: Page, email: string) {
    await page.goto("/workspace");
    await page.getByRole("button", { name: "New here? Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Create my profile" })).toBeVisible();
  }
  await register(owner, "browser-owner-" + suffix + "@example.test");
  await owner.getByLabel("Full name", { exact: true }).fill("Browser Owner");
  await owner.getByLabel("Preferred project role").selectOption("Frontend Developer");
  await owner.getByLabel("Missing a skill?").fill("Browser React " + suffix);
  await owner.getByRole("button", { name: "Add skill", exact: true }).click();
  await expect(owner.getByRole("checkbox", { name: "Browser React " + suffix, exact: true })).toBeChecked();
  await owner.getByRole("checkbox", { name: "Weekday Evening", exact: true }).check();
  await owner.getByRole("button", { name: "Save profile" }).click();
  await expect(owner.getByRole("heading", { name: "Edit my profile" })).toBeVisible();

  await register(member, "browser-member-" + suffix + "@example.test");
  await member.getByLabel("Full name", { exact: true }).fill("Browser Member");
  await member.getByLabel("Preferred project role").selectOption("Frontend Developer");
  await member.getByRole("checkbox", { name: "Browser React " + suffix, exact: true }).check();
  await member.getByRole("checkbox", { name: "Weekday Evening", exact: true }).check();
  await member.getByRole("button", { name: "Save profile" }).click();
  await expect(member.getByRole("heading", { name: "Edit my profile" })).toBeVisible();
  await owner.getByRole("button", { name: "Refresh", exact: true }).click();
  await owner.getByRole("button", { name: "Students", exact: true }).click();
  await owner.getByLabel("Search by name").fill("Browser Member");
  await expect(owner.getByRole("heading", { name: "Browser Member" })).toBeVisible();
  await owner.getByRole("button", { name: "Projects", exact: true }).click();
  await owner.getByRole("button", { name: "Create project", exact: true }).click();
  await owner.getByLabel("Project title").fill("Browser Team " + suffix);
  await owner.getByLabel("Description", { exact: true }).fill("A complete browser-tested student team.");
  await owner.getByLabel("Team size").fill("2");
  await owner.getByRole("checkbox", { name: "Browser React " + suffix, exact: true }).check();
  await owner.getByRole("checkbox", { name: "Frontend Developer", exact: true }).check();
  await owner.getByRole("checkbox", { name: "Weekday Evening", exact: true }).check();
  await owner.getByRole("button", { name: "Save project" }).click();
  await expect(owner.getByText("100/100", { exact: true })).toBeVisible();
  await owner.screenshot({ path: "test-results/matching-desktop.png", fullPage: true });
  await owner.getByRole("button", { name: "Invite student", exact: true }).click();
  await expect(owner.getByRole("button", { name: "Invitation pending" })).toBeDisabled();
  await member.getByRole("button", { name: "Refresh", exact: true }).click();
  await member.getByRole("button", { name: /^Invitations/ }).click();
  await member.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(member.getByText("You joined the team.", { exact: false })).toBeVisible();
  await owner.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(owner.getByText("Open · 2/2 team members")).toBeVisible();
  await expect(owner.getByText("Browser Member", { exact: true }).first()).toBeVisible();

  // Check the completed state and mobile width without changing the visual design.
  await owner.getByRole("button", { name: "Edit project" }).click();
  await owner.getByLabel("Project status").selectOption("Completed");
  await owner.getByRole("button", { name: "Save project" }).click();
  await expect(owner.getByText("Completed · 2/2 team members")).toBeVisible();
  await owner.screenshot({ path: "test-results/team-desktop.png", fullPage: true });
  await owner.setViewportSize({ width: 390, height: 844 });
  expect(await owner.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await owner.screenshot({ path: "test-results/team-mobile.png", fullPage: true });

  await owner.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(owner.getByRole("heading", { name: "Welcome back to TeamFit" })).toBeVisible();
  await owner.getByLabel("Email", { exact: true }).fill("browser-owner-" + suffix + "@example.test");
  await owner.getByLabel("Password", { exact: true }).fill(password);
  await owner.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(owner.getByRole("heading", { name: "Edit my profile" })).toBeVisible();
  await owner.reload();
  await expect(owner.getByRole("heading", { name: "Edit my profile" })).toBeVisible();
  assertNoErrors();
  await ownerContext.close();
  await memberContext.close();
  function assertNoErrors() { expect(errors).toEqual([]); }
});
