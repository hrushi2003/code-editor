import { expect,test } from "@playwright/test";

const USER = process.env.E2E_USER;
const PASS = process.env.E2E_PASS;

test('user can log in and see their projects', async ({ page }) => {
    await page.goto('/Login');

 await page.getByPlaceholder('Enter your username').fill(USER);
  await page.getByPlaceholder('Enter your password').fill(PASS);
  await page.getByRole('button', { name: 'LOG IN' }).click();

  await expect(page).toHaveURL(/\/projects/i);
  await expect(page.getByText('CREATE NEW CODE')).toBeVisible();
})