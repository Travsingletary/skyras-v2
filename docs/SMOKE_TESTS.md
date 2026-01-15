# SkyRas v1 E2E Smoke Tests

This document describes the Playwright E2E smoke tests for SkyRas v1, covering the core intent flow: Plan → Create → Release → Finish.

## Prerequisites

- Node.js installed
- Playwright installed (run `npx playwright install chromium` if needed)
- A running SkyRas development server
- Test project and user credentials

## Environment Variables

The tests require the following environment variables:

### Required

- `E2E_PROJECT_ID` - The UUID of a test project to use for testing
- `E2E_EMAIL` - Email address for test user login
- `E2E_PASSWORD` - Password for test user login

### Optional

- `E2E_BASE_URL` - Base URL for the application (defaults to `http://localhost:3000`)

## Setup

1. **Install dependencies** (if not already done):
   ```bash
   cd frontend
   npm install
   ```

2. **Set environment variables**:
   ```bash
   export E2E_PROJECT_ID="your-project-uuid"
   export E2E_EMAIL="test@example.com"
   export E2E_PASSWORD="test-password"
   export E2E_BASE_URL="http://localhost:3000"  # Optional
   ```

   Or create a `.env.local` file in the project root:
   ```
   E2E_PROJECT_ID=your-project-uuid
   E2E_EMAIL=test@example.com
   E2E_PASSWORD=test-password
   E2E_BASE_URL=http://localhost:3000
   ```

3. **Start the development server** (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```

   The server should be running on `http://localhost:3000` (or your configured base URL).

## Running Tests

### Run all tests (headless)
```bash
cd frontend
npm run test:e2e
```

### Run tests with UI mode (interactive)
```bash
cd frontend
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
cd frontend
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
cd frontend
npm run test:e2e:debug
```

## Test Coverage

The smoke test suite (`tests/e2e/smoke.spec.ts`) covers:

### TEST 1: Loads project and navigates intents
- Verifies project page loads
- Tests navigation between all intents (Plan, Create, Release, Finish)
- Asserts each intent root element is visible

### TEST 2: Plan edit + versioning basics
- Fills brief fields (goals, tone)
- Saves draft
- Saves as version
- Verifies version appears in history
- Refreshes and verifies content persists

### TEST 3: Apply Plan seeding (if implemented)
- Seeds Style Card Draft from Plan
- Verifies style card appears in Create → Style Cards
- Seeds Release Plan Draft from Plan
- Verifies seeded indicator in Release
- Tests persistence after refresh

**Note:** This test may be skipped if seeding functionality is not yet implemented.

### TEST 4: References create + approve
- Adds a new reference
- Approves the reference
- Verifies status badge changes to Approved
- Refreshes and confirms it remains Approved

### TEST 5: Style Card create + approve (if allowed)
- Creates a style card draft
- Approves the style card
- Verifies approved badge/lock indicator appears
- Refreshes and confirms still approved

### TEST 6: Release persistence smoke
- Adds an asset in Release intent
- Edits asset name
- Refreshes and verifies change persisted

### TEST 7: Finish persistence smoke
- Toggles a checklist item in Finish → Takes
- Waits for "Saved" indicator
- Refreshes and verifies checklist item remains checked

### TEST 8: Navigate Finish steps
- Tests navigation through all Finish steps:
  - Takes
  - Assembly
  - Look & Feel
  - Final Cut
- Verifies each step content is visible

## Test Selectors (data-testid)

The tests use the following `data-testid` attributes for stable element selection:

### Intent Navigation
- `intent-plan`
- `intent-create`
- `intent-release`
- `intent-finish`

### Plan Intent
- `plan-brief-form`
- `plan-save-draft`
- `plan-save-version`
- `plan-restore-version`

### Create Intent
- `create-tab-references`
- `create-tab-stylecards`
- `references-add-button`
- `references-form`
- `references-approve-first`
- `stylecards-create-button`
- `stylecards-approve-first`

### Release Intent
- `release-assets-add`

### Finish Intent
- `finish-step-takes`
- `finish-step-assembly`
- `finish-step-look-and-feel`
- `finish-step-final-cut`
- `finish-saving-indicator`
- `finish-saved-indicator`

## Known Limitations

1. **Seeding Tests**: Test 3 (Plan seeding) may be skipped if seeding functionality is not yet implemented. The test checks for the presence of seed buttons before attempting to use them.

2. **Console Errors**: The tests monitor console errors but only fail on severe errors. Known benign warnings (favicon, 404s, etc.) are filtered out.

3. **Debounced Saves**: Some operations use debounced saves (e.g., Finish intent with 800ms delay). Tests wait for "Saved" indicators rather than using fixed timeouts.

4. **Auth Requirements**: Tests require a valid test user account. If OAuth-only authentication is used, a test auth bypass may be needed.

5. **Test Data**: Tests use a single test project ID. Ensure the test project exists and is accessible to the test user.

## Troubleshooting

### Tests fail with "E2E_PROJECT_ID is required"
- Ensure environment variables are set correctly
- Check that the project ID is a valid UUID

### Tests fail with login errors
- Verify `E2E_EMAIL` and `E2E_PASSWORD` are correct
- Ensure the test user account exists and is active
- Check that the login page is accessible

### Tests timeout waiting for elements
- Ensure the dev server is running
- Check that the test project exists and is accessible
- Verify network connectivity to the base URL

### Tests fail on console errors
- Check browser console for actual errors
- Some errors may be expected (e.g., missing assets, external API calls)
- Review the test output for specific error messages

## CI/CD Integration

For CI/CD pipelines:

1. Set environment variables in your CI configuration
2. Start the dev server before running tests:
   ```bash
   npm run dev &
   sleep 5  # Wait for server to start
   npm run test:e2e
   ```
3. Consider using `--workers=1` for more stable runs in CI:
   ```bash
   npx playwright test --workers=1
   ```

## Maintenance

When adding new features or changing UI:

1. **Add test selectors**: Use `data-testid` attributes for new interactive elements
2. **Update tests**: Add new test cases for new features
3. **Update documentation**: Keep this file in sync with test coverage

## Files

- `tests/e2e/smoke.spec.ts` - Main test suite
- `tests/e2e/utils.ts` - Test utilities (login, navigation helpers)
- `playwright.config.ts` - Playwright configuration
- `frontend/package.json` - Test scripts
