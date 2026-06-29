/**
 * End-to-end tests for Farmingdale Lunch Guide
 */

const { test, expect } = require('@playwright/test');

test.describe('Farmingdale Lunch Guide', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for restaurants to load
        await page.waitForSelector('.restaurant-card', { timeout: 10000 });
    });

    test.describe('Initial Load', () => {
        test('should display the header', async ({ page }) => {
            const header = page.locator('header h1');
            await expect(header).toHaveText('Farmingdale Lunch Guide');
        });

        test('should load restaurants (paginated)', async ({ page }) => {
            const cards = page.locator('.restaurant-card');
            // First page renders PAGE_SIZE (6) cards...
            await expect(cards).toHaveCount(6);
            // ...and the remaining restaurants load on demand.
            await page.click('#load-more-btn');
            await expect(cards).toHaveCount(10);
        });

        test('should display restaurant information', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            await expect(firstCard.locator('.restaurant-name')).toBeVisible();
            await expect(firstCard.locator('.restaurant-category')).toBeVisible();
            await expect(firstCard.locator('.restaurant-price')).toBeVisible();
        });
    });

    test.describe('Filtering', () => {
        test('should filter by price', async ({ page }) => {
            await page.selectOption('#price-filter', '$');
            const cards = page.locator('.restaurant-card');
            // Wait for filter to apply
            await page.waitForTimeout(500);

            const prices = await cards.locator('.restaurant-price').allTextContents();
            prices.forEach(price => expect(price).toBe('$'));
        });

        test('should filter by category using multi-select', async ({ page }) => {
            // Open category dropdown
            await page.click('#category-trigger');
            // Uncheck "All" and select "Pizza"
            await page.click('#category-dropdown input[value="all"]');
            await page.click('#category-dropdown input[value="pizza"]');
            // Close dropdown by clicking outside
            await page.click('body');

            await page.waitForTimeout(500);

            const cards = page.locator('.restaurant-card');
            const categories = await cards.locator('.restaurant-category').allTextContents();
            categories.forEach(cat => expect(cat.toLowerCase()).toBe('pizza'));
        });

        test('should search restaurants', async ({ page }) => {
            await page.fill('#search-input', 'pizza');
            await page.waitForTimeout(500);

            const cards = page.locator('.restaurant-card');
            const count = await cards.count();
            expect(count).toBeGreaterThan(0);
        });

        test('should show no results message', async ({ page }) => {
            await page.fill('#search-input', 'xyznonexistent');
            await page.waitForTimeout(500);

            const noResults = page.locator('.no-results');
            await expect(noResults).toBeVisible();
        });
    });

    test.describe('Sorting', () => {
        test('should sort by rating (default)', async ({ page }) => {
            const ratings = await page.locator('.restaurant-rating').allTextContents();
            const numericRatings = ratings.map(r => parseFloat(r.match(/[\d.]+/)?.[0] || 0));

            for (let i = 1; i < numericRatings.length; i++) {
                expect(numericRatings[i]).toBeLessThanOrEqual(numericRatings[i - 1]);
            }
        });

        test('should sort by name', async ({ page }) => {
            await page.selectOption('#sort-select', 'name');
            await page.waitForTimeout(500);

            const names = await page.locator('.restaurant-name').allTextContents();
            const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

            expect(names).toEqual(sortedNames);
        });

        test('should sort by distance', async ({ page }) => {
            await page.selectOption('#sort-select', 'distance');
            await page.waitForTimeout(500);

            const distances = await page.locator('.restaurant-distance').allTextContents();
            const numericDistances = distances.map(d => parseFloat(d) || 999);

            for (let i = 1; i < numericDistances.length; i++) {
                expect(numericDistances[i]).toBeGreaterThanOrEqual(numericDistances[i - 1]);
            }
        });
    });

    test.describe('Favorites', () => {
        test('should add restaurant to favorites', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            const favoriteBtn = firstCard.locator('.favorite-btn');

            await favoriteBtn.click();

            await expect(favoriteBtn).toHaveClass(/active/);

            // Check favorites section
            const favoritesSection = page.locator('#favorites-container');
            await expect(favoritesSection.locator('.favorite-item')).toHaveCount(1);
        });

        test('should remove restaurant from favorites', async ({ page }) => {
            // First add a favorite
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.locator('.favorite-btn').click();

            // Then remove it
            await firstCard.locator('.favorite-btn').click();

            await expect(firstCard.locator('.favorite-btn')).not.toHaveClass(/active/);

            // Check empty favorites message
            const emptyMessage = page.locator('.empty-favorites');
            await expect(emptyMessage).toBeVisible();
        });

        test('should remove favorite from favorites section', async ({ page }) => {
            // Add a favorite
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.locator('.favorite-btn').click();

            // Remove from favorites section
            const removeBtn = page.locator('#favorites-container .remove-favorite').first();
            await removeBtn.click();

            // Card should no longer be marked as favorite
            await expect(firstCard.locator('.favorite-btn')).not.toHaveClass(/active/);
        });

        test('should persist favorites after page reload', async ({ page }) => {
            // Add a favorite
            const firstCard = page.locator('.restaurant-card').first();
            const restaurantName = await firstCard.locator('.restaurant-name').textContent();
            await firstCard.locator('.favorite-btn').click();

            // Reload page
            await page.reload();
            await page.waitForSelector('.restaurant-card');

            // Check favorite is still marked
            const firstCardAfterReload = page.locator('.restaurant-card').first();
            await expect(firstCardAfterReload.locator('.favorite-btn')).toHaveClass(/active/);

            // Check favorites section
            const favoriteItem = page.locator('#favorites-container .favorite-item').first();
            await expect(favoriteItem).toContainText(restaurantName);
        });
    });

    test.describe('Modal', () => {
        test('should open modal on card click', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.click();

            const modal = page.locator('#restaurant-modal');
            await expect(modal).not.toHaveClass(/hidden/);
        });

        test('should display restaurant details in modal', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            const cardName = await firstCard.locator('.restaurant-name').textContent();

            await firstCard.click();

            const modalName = page.locator('.modal-name');
            await expect(modalName).toHaveText(cardName);
        });

        test('should close modal on close button click', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.click();

            const closeBtn = page.locator('#restaurant-modal .modal-close');
            await closeBtn.click();

            const modal = page.locator('#restaurant-modal');
            await expect(modal).toHaveClass(/hidden/);
        });

        test('should close modal on overlay click', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.click();

            // Click an actual backdrop location (top-left corner), not the
            // centre, which is legitimately covered by the content card.
            const overlay = page.locator('#restaurant-modal .modal-overlay');
            await overlay.click({ position: { x: 5, y: 5 } });

            const modal = page.locator('#restaurant-modal');
            await expect(modal).toHaveClass(/hidden/);
        });

        test('should close modal on Escape key', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.click();

            await page.keyboard.press('Escape');

            const modal = page.locator('#restaurant-modal');
            await expect(modal).toHaveClass(/hidden/);
        });

        test('should toggle favorite from modal', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.click();

            const modalFavoriteBtn = page.locator('.modal-favorite-btn');
            await modalFavoriteBtn.click();

            await expect(modalFavoriteBtn).toHaveClass(/active/);

            // Close modal and check card
            await page.keyboard.press('Escape');
            await expect(firstCard.locator('.favorite-btn')).toHaveClass(/active/);
        });
    });

    test.describe('Dark Mode', () => {
        test('should toggle dark mode', async ({ page }) => {
            const themeToggle = page.locator('#theme-toggle');
            await themeToggle.click();

            await expect(page.locator('body')).toHaveClass(/dark-mode/);
        });

        test('should persist dark mode after reload', async ({ page }) => {
            const themeToggle = page.locator('#theme-toggle');
            await themeToggle.click();

            await page.reload();
            await page.waitForSelector('.restaurant-card');

            await expect(page.locator('body')).toHaveClass(/dark-mode/);
        });
    });

    test.describe('Accessibility', () => {
        test('should have skip link', async ({ page }) => {
            const skipLink = page.locator('.skip-link');
            await expect(skipLink).toBeAttached();
        });

        test('should focus skip link on tab', async ({ page }) => {
            await page.keyboard.press('Tab');

            const skipLink = page.locator('.skip-link');
            await expect(skipLink).toBeFocused();
        });

        test('restaurant cards should be keyboard accessible', async ({ page }) => {
            // Cards expose a tabindex and open on Enter/Space. Focus the first
            // card directly (tab order depends on the filter controls above it).
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.focus();
            await expect(firstCard).toBeFocused();

            // Open modal with Enter
            await page.keyboard.press('Enter');
            const modal = page.locator('#restaurant-modal');
            await expect(modal).not.toHaveClass(/hidden/);
        });
    });

    test.describe('Toast Notifications', () => {
        test('should show toast when adding favorite', async ({ page }) => {
            const firstCard = page.locator('.restaurant-card').first();
            await firstCard.locator('.favorite-btn').click();

            const toast = page.locator('.toast');
            await expect(toast).toBeVisible();
            await expect(toast).toContainText('favorites');
        });
    });
});
