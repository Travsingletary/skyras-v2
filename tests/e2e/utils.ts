import { Page, expect } from '@playwright/test';

/**
 * Login helper - navigates to login page and fills credentials
 * Requires E2E_EMAIL and E2E_PASSWORD env vars
 */
export async function login(page: Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD environment variables are required');
  }

  await page.goto('/login');
  
  // Wait for login form to be visible
  await expect(page.locator('input[type="email"]')).toBeVisible();
  
  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect (should go to /studio or projects page)
  await page.waitForURL(/^\/(studio|projects)/, { timeout: 10000 });
}

/**
 * Navigate to a project page
 * Requires E2E_PROJECT_ID env var
 */
export async function navigateToProject(page: Page) {
  const projectId = process.env.E2E_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('E2E_PROJECT_ID environment variable is required');
  }

  await page.goto(`/projects/${projectId}`);
  
  // Wait for project page to load (check for intent selector or project header)
  await page.waitForSelector('[data-testid="intent-plan"], [data-testid="intent-create"], [data-testid="intent-release"], [data-testid="intent-finish"]', { timeout: 10000 });
}

/**
 * Wait for saved indicator to appear and disappear
 * Useful for debounced saves
 */
export async function waitForSaved(page: Page, testId: string, timeout = 5000) {
  // Wait for "Saved" indicator to appear
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible({ timeout });
  
  // Wait for it to disappear (usually after 2 seconds)
  await expect(page.locator(`[data-testid="${testId}"]`)).not.toBeVisible({ timeout: 5000 });
}

/**
 * Check for console errors (excluding known benign warnings)
 */
export function setupConsoleErrorCheck(page: Page) {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known benign errors/warnings
      if (
        !text.includes('favicon') &&
        !text.includes('404') &&
        !text.includes('Failed to load resource') &&
        !text.includes('net::ERR_')
      ) {
        errors.push(text);
      }
    }
  });
  
  return errors;
}
