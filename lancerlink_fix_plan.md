# LancerLink Repair & Recovery Plan

This document outlines the analysis and technical plan to fix the critical bugs in the LancerLink portal codebase.

## 1. Homepage Contact Form Issue

### Problem
Submitting the homepage contact form results in a red banner reading: `"Something went wrong. Please try again."`

### Root Cause Analysis
1. In `components/ContactForm.js`, the contact form submits data to `/api/contact` using a standard `fetch` call.
2. In `app/api/contact/route.js`, the database client is initialized via:
   ```javascript
   const supabase = createClient(supabaseUrl, serviceRoleKey, {
     auth: {
       autoRefreshToken: false,
       persistSession: false,
     },
   });
   ```
3. Unlike `lib/supabase.js` and `lib/supabase-server.js`, it does not pass the custom `supabaseFetch` global fetch option.
4. Next.js on Windows patches Node's global `fetch` in a manner that routinely fails with `fetch failed` or socket exceptions when accessing third-party endpoints like Supabase. The `supabaseFetch` helper resolves this by using the `undici` library, which bypasses the Next.js fetch patches and communicates directly with the Node.js network layer.
5. Due to the lack of this wrapper, the API route crashes, causing Next.js to return a 500 HTML error page. Because the response is not valid JSON, the frontend catch block defaults to the generic `"Something went wrong. Please try again."` message.

### Proposed Fix
Modify `app/api/contact/route.js` to initialize the client using `supabaseFetch`, or retrieve it using `getSupabaseAdmin()` which is already configured.

---

## 2. "Unauthorized" Error on Login/Password Reset

### Problem
Clicking `"Forgot password?"` or attempting password sign-in results in a red `"Unauthorized"` label under the fields, even when the email is added to the projects section.

### Root Cause Analysis
1. The codebase contains a `proxy.js` file designed to serve as Next.js middleware to guard routes and refresh Supabase auth tokens.
2. However, Next.js requires the middleware file to be explicitly named `middleware.js` (or `middleware.ts`) in the root directory. Because the file is named `proxy.js`, it is never run by Next.js in normal circumstances.
3. If the file *is* executed (e.g. if the developer had created `middleware.js` locally or it is configured in Vercel), it checks the path of every request.
4. The matcher in `proxy.js` matches all API routes (`/api/:path*`).
5. In `proxy.js`, the request is checked against a list of public paths:
   ```javascript
   const publicPaths = [
     "/api/auth/send-otp",
     "/api/auth/logout",
     "/api/contact"
   ];
   ```
6. The routes `/api/auth/login-password` and `/api/auth/send-password-reset` are **not** present in `publicPaths`.
7. Because they are not public paths, the middleware attempts to authenticate the request:
   ```javascript
   const auth = await authenticateRequest(request);
   if (!auth) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```
8. Since the user is not yet logged in when attempting to log in or request a password reset, `authenticateRequest` returns `null`, and the middleware blocks the request, returning a `401 Unauthorized` JSON response.
9. The login page parses this response and displays `"Unauthorized"` on the screen.

### Proposed Fix
1. Add `/api/auth/login-password` and `/api/auth/send-password-reset` to the `publicPaths` list in `proxy.js`.
2. Create a `middleware.js` file at the root of the project to properly link Next.js with `proxy.js`:
   ```javascript
   import { proxy } from "./proxy";
   export async function middleware(request) {
     return proxy(request);
   }
   export { config } from "./proxy";
   ```

---

## 3. Step-by-Step Implementation Steps

1. **Update `/app/api/contact/route.js`**:
   - Import `supabaseFetch` from `@/lib/supabase-fetch`.
   - Update `createClient` call to pass `global: { fetch: supabaseFetch }`.
2. **Update `/proxy.js`**:
   - Add `/api/auth/login-password` and `/api/auth/send-password-reset` to the `publicPaths` array.
3. **Create `/middleware.js`**:
   - Create the file in the project root directory and export the proxy middleware function and configuration object.
4. **Verification**:
   - Run `npm run dev` locally.
   - Test submitting a contact form message.
   - Test password sign-in and password reset requests.
