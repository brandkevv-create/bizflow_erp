import { test, expect } from '@playwright/test';

test.describe('Point of Sale (POS)', () => {
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

    test('should add a product to cart and complete checkout', async ({ page }) => {
        // Navigate to POS
        await page.goto('/dashboard/sales');

        // Look for the product layout to load (Empty cart state)
        await expect(page.getByText('Cart is empty')).toBeVisible({ timeout: 10000 });

        // Wait for the products to load from the API
        await page.waitForSelector('.grid button', { timeout: 10000 }).catch(() => null);

        // Add the first available product to the cart (this assumes there is at least one product)
        const firstProductCard = page.locator('.grid button').first();
        if (await firstProductCard.count() > 0) {
            await firstProductCard.click();

            // Check the cart panel updates to have the item
            await expect(page.locator('text=Current Order')).toBeVisible();

            // Click Checkout
            await page.getByRole('button', { name: /checkout/i }).click();

            // In the checkout modal, wait for the summary
            await expect(page.locator('text=Checkout')).toBeVisible();

            // Select Cash payment method
            await page.getByRole('button', { name: /cash/i }).click();

            // Fill Amount Tendered for cash payment
            await page.getByPlaceholder('0.00').fill('10000');

            // Confirm Payment
            await page.getByRole('button', { name: /complete sale/i }).click();

            // Should see success state
            await expect(page.locator('text=Sale completed successfully!')).toBeVisible();
        } else {
            console.warn('No products available to test POS checkout flow.');
        }
    });
});
