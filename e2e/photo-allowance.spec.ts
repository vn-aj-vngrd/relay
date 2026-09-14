import { expect, test } from "@playwright/test";

test("pricing explains album and storage limits on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pricing");
  const albumRow = page.getByRole("row", {
    name: /Photos per game · shared album, not monthly/,
  });
  await expect(albumRow).toContainText("50 photos");
  await page
    .getByText("Are photo upload limits different on paid plans?", {
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/Whichever fills first stops new uploads/)
  ).toBeVisible();
  await expect(
    page.getByText(
      /Neither the album limit nor retained storage resets monthly/
    )
  ).toBeVisible();
  await expect(
    page.getByText(/There is no per-player album cap/)
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(overflow).toBe(false);
});
