# Angular Frontend – Blank Page Debugging Guide

Use this when the app runs (`ng serve`) but the browser shows a blank page.

---

## Step 1: Check the browser console

1. Open the frontend address configured for the current environment in Chrome or Edge.
2. Press **F12** (or right‑click → Inspect).
3. Open the **Console** tab.
4. Look for **red errors**.

**Typical errors and fixes:**

| Error | Cause | Fix |
|-------|--------|-----|
| `zone.js` or "Change detection" | Zone.js not loaded | Ensure `main.ts` has `import 'zone.js';` at the top. |
| `Failed to load module` / chunk 404 | Lazy‑load path wrong | Check `loadChildren` paths in `app-routing.module.ts` and that the module file exists. |
| `NullInjectorError` | Missing provider | Add the service in a module `providers` or use `providedIn: 'root'`. |
| `Cannot read property of undefined` | Template or code bug | Fix the reported file/line (e.g. optional chaining or null check). |

---

## Step 2: Check the Network tab

1. In DevTools, open the **Network** tab.
2. Reload the page (**F5**).
3. Look for **red (failed)** requests.

**What to check:**

- **JS chunks (e.g. `auth-auth-module.js`) return 404**  
  → Lazy route path or file name wrong; fix `loadChildren` or move/rename the module file.

- **API calls fail with CORS**
  → Backend must allow the origin in `CORS_ALLOWED_ORIGINS`. A `CorsConfig` (or equivalent) is in the backend; ensure it is running with the required configured origin.

- **API returns 401/403**  
  → Expected if the route is protected; use login first or call a public endpoint to verify connectivity.

---

## Step 3: Verify routing

1. Open the configured frontend address followed by `/auth/login` directly.
2. You should see the **Login** form.

- If **/** is blank but **/auth/login** works: the default route or redirect may be wrong (e.g. `path: ''` redirectTo `'auth/login'`).
- If both are blank: the app may not be bootstrapping (see Step 1) or the root template might be empty/hidden.

---

## Step 4: Confirm build and assets

1. Stop the dev server (**Ctrl+C**).
2. Run:
   ```bash
   npm install
   ng build
   ```
3. Fix any **build errors** (missing imports, wrong paths, etc.).
4. Run `ng serve` again and reload the browser.

---

## Step 5: Ensure backend and CORS

1. Backend must be running at the address configured by `BACKEND_URL`.
2. Backend must allow the frontend origin configured by `CORS_ALLOWED_ORIGINS`.
3. In the browser, try an endpoint below the `API_BASE_URL` configured in `frontend/.env`.
   If CORS is misconfigured, the console will show a CORS error for that request.

---

## Summary of fixes applied in this project

- **`main.ts`** – Added `import 'zone.js';` so Angular change detection runs.
- **`tsconfig.app.json`** – Set `"include": ["src/**/*.ts"]` so all app code is compiled.
- **Backend** – Added `CorsConfig` and enabled CORS in `SecurityConfig` using `CORS_ALLOWED_ORIGINS`.
- **`app.component.html`** – Added a small header with a “Stack Portal” link so something is always visible when the app loads.

If the page is still blank after these changes, the **exact message and stack trace** from the browser Console (and any failed request in Network) are needed to debug further.
