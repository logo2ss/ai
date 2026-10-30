const { chromium } = require("../frontend/node_modules/playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [],
    externalRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:8000"))
      externalRequests.push(r.url());
  });
  await page.goto("http://127.0.0.1:8000");
  await page.evaluate(async () => {
    const stories = await (
      await fetch("/api/stories?q=Folio%20automated%20UI%20test%20story")
    ).json();
    for (const x of stories.items)
      if (x.title === "Folio automated UI test story")
        await fetch("/api/stories/" + x.id, { method: "DELETE" });
    const c = await (await fetch("/api/collections")).json();
    for (const x of c)
      if (x.name === "Folio automated UI test collection")
        await fetch("/api/collections/" + x.id, { method: "DELETE" });
  });
  await page.reload();
  await page
    .getByRole("heading", {
      name: "A little inspiration. Endless possibilities.",
    })
    .waitFor();
  await page.screenshot({
    path: require("path").join(require("os").tmpdir(), "folio-dashboard.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Collections", exact: true }).click();
  await page
    .getByRole("button", { name: "Create collection", exact: true })
    .click();
  await page
    .getByLabel("Collection name")
    .fill("Folio automated UI test collection");
  await page.getByRole("button", { name: "Save collection" }).click();
  await page
    .getByRole("heading", { name: "Folio automated UI test collection" })
    .waitFor();
  await page
    .getByRole("button", { name: "Story Library", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Import stories", exact: true })
    .click();
  await page.getByRole("button", { name: "Paste a story" }).click();
  await page
    .getByLabel("Story title", { exact: true })
    .fill("Folio automated UI test story");
  await page
    .getByLabel("Story text", { exact: true })
    .fill(
      'Ada stood at the gate as the evening light faded. "Is anyone here?" she asked. The gate opened slowly, revealing a garden of silver leaves. She smiled and stepped inside. This is the dedicated Folio automated browser fixture.',
    );
  await page
    .getByLabel("Collection", { exact: true })
    .selectOption({ label: "Folio automated UI test collection" });
  await page.getByRole("button", { name: "Add story", exact: true }).click();
  await page
    .getByText("Folio automated UI test story", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Measure stories" }).click();
  await page
    .getByRole("button", { name: "Analysis Studio", exact: true })
    .click();
  await page
    .getByLabel("Collection to analyze")
    .selectOption({ label: "Folio automated UI test collection" });
  await page.getByText(/1 of 1 stories analyzed/).waitFor();
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: require("path").join(require("os").tmpdir(), "folio-analysis.png"),
    fullPage: true,
  });
  for (const name of [
    "Story Generator",
    "Story Mixer",
    "Generated Stories",
    "Story Editor",
    "Settings",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("heading", { name, exact: true, level: 1 }).waitFor();
  }
  await page.getByRole("button", { name: "Test connection" }).click();
  await page.getByText("No model connection", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await page.screenshot({
    path: require("path").join(require("os").tmpdir(), "folio-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector(".sidebar").getBoundingClientRect().right <= 0,
  );
  await page.screenshot({
    path: require("path").join(require("os").tmpdir(), "folio-mobile.png"),
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  console.log(
    JSON.stringify({
      errors,
      externalRequests,
      mobileOverflow: overflow,
      checkedPages: 9,
    }),
  );
  await page.evaluate(async () => {
    const s = await (
      await fetch("/api/stories?q=Folio%20automated%20UI%20test%20story")
    ).json();
    for (const x of s.items)
      if (x.title === "Folio automated UI test story")
        await fetch("/api/stories/" + x.id, { method: "DELETE" });
    const c = await (await fetch("/api/collections")).json();
    for (const x of c)
      if (x.name === "Folio automated UI test collection")
        await fetch("/api/collections/" + x.id, { method: "DELETE" });
  });
  await browser.close();
  if (errors.length || overflow || externalRequests.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
