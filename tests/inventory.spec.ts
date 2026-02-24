import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
    test.beforeEach(async ({ page }) => {
        // Go to login page
        await page.goto('/login');

        // Log in as test admin using explicit placeholder selectors
        await page.getByPlaceholder('admin@example.com').fill('brandkevv@gmail.com');
        await page.getByPlaceholder('••••••••').fill('password123');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait to reach the dashboard
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should load the inventory product list and open add product modal', async ({ page }) => {
        // Navigate to Inventory page
        await page.goto('/dashboard/inventory');

        // Verify the heading is present
        await expect(page.getByRole('heading', { name: 'Products & Inventory' })).toBeVisible({ timeout: 10000 });

        // Wait until at least one product row is rendered or the empty state is shown
        // Our products table renders rows with role="row"
        await page.waitForSelector('table', { timeout: 10000 });

        // Click on "Add Product" button
        await page.getByRole('button', { name: /add product/i }).click();

        // Verify the Add Product Modal opens
        await expect(page.getByRole('heading', { name: /add new product/i })).toBeVisible();

        // Close the modal
        await page.getByRole('button', { name: /cancel/i }).click();
    });
});
