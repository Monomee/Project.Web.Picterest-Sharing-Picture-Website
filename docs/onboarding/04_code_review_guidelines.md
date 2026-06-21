# Onboarding Document 4: Code Review Guidelines & Quality Gates

Welcome to the team! This document acts as our central quality gate. It provides clear, actionable checklists and guidelines to help you perform self-checks before submitting Pull Requests (PRs), and explains how code is evaluated by senior engineers during reviews.

---

## 1. Git Workflow & Pull Request Standards

We maintain a clean, linear git history. Every engineer—including interns—is expected to adhere strictly to our branching and commit message protocols.

### Branching Naming Conventions
Always branch off the default branch (`main` or `develop` as indicated by your team lead) and name your branch based on the category of work:
*   `feature/feature-name` (e.g., `feature/google-oauth`) - For new features and enhancements.
*   `bugfix/issue-name` (e.g., `bugfix/liked-tab-mapping`) - For bug fixes.
*   `hotfix/urgent-patch` (e.g., `hotfix/scroll-lock-leak`) - For production hotfixes.

### Pull Request Prerequisites
Before marking a PR as "Ready for Review," you must verify the following:
*   [ ] **Zero Compile Errors & Warnings**: The codebase must build cleanly.
    *   Backend: Run `dotnet build` from the `backend/SharingPicture` directory. You must see **0 errors** and **0 warnings**.
    *   Frontend: Run `npm run build` from the `frontend` directory. It must compile successfully with **0 errors** and **0 warnings**.
*   [ ] **Local Verification**: Verify the specific feature manually in your browser and check both the backend terminal logs and database states to ensure proper persistence.
*   [ ] **Tests Passed**: Run any automated tests using `dotnet test` to ensure there are no regressions.

### Commit Message Format
We enforce the **Conventional Commits** standard. Commit messages must be structured as follows:
`<type>(<scope>): <short summary in lowercase>`

*   **Allowed Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
*   **Examples**:
    *   `feat(auth): integrate google oauth token verification`
    *   `fix(feed): patch cumulative layout shift in masonry grid layout`
    *   `docs(onboarding): add code review guidelines document`

---

## 2. Backend Code Review Checklist (.NET 8)

Our backend is a high-performance, stateless ASP.NET Core Web API. Use these checks to ensure backend robustness:

### Async/Await Enforcement
*   **No Blocking Calls**: Never block asynchronous threads. Do **NOT** use `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()`. They cause thread pool starvation and can lead to deadlocks under high traffic.
*   **Database Async Operations**: Every database operation in Entity Framework Core must utilize its async counterpart.
    ```csharp
    // BAD (Blocks Thread)
    var posts = _context.Posts.ToList();
    
    // GOOD (Non-blocking Asynchronous Execution)
    var posts = await _context.Posts.ToListAsync();
    ```

### LINQ & Query Optimization
*   **Prevent N+1 Queries**: Ensure that eager loading (`.Include()`) is explicitly defined when querying principal entities if their related child objects are required.
*   **Enforce Projection**: Avoid fetching full entity database rows when only a subset of properties is needed. Use `.Select()` to project queries directly to lightweight DTOs.
    ```csharp
    // BAD: Fetches the entire User entity row including unused PasswordHash, Email, etc.
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
    
    // GOOD: Only queries the specific columns needed, reducing DB load and memory usage
    var userDto = await _context.Users
        .Where(u => u.Id == userId)
        .Select(u => new UserProfileDto 
        {
            Username = u.Username,
            AvatarUrl = u.AvatarUrl
        })
        .FirstOrDefaultAsync();
    ```

### Thin Controllers Rule
*   Controllers must remain as thin as possible. Their duties are strictly limited to:
    1. Parsing and deserializing request payloads.
    2. Evaluating validation states (`ModelState.IsValid`).
    3. Returning standard `IActionResult` envelopes (e.g., `Ok()`, `BadRequest()`, `NotFound()`).
*   **Business Logic Location**: All calculations, validation guards, repository queries, and mapper transformations belong inside the **Service** layer (e.g., `ProfileService`, `PostService`).

---

## 3. Frontend Code Review Checklist (Next.js 16 + React 19)

Our frontend is a fast, responsive Next.js application styled with vanilla Tailwind CSS. Keep performance and layout stability at the forefront of your work.

### Client vs. Server Components
*   **Default to Server Components**: Keep layouts, pages, and components as React Server Components (RSC) to minimize the Javascript bundle sent to the client.
*   **"use client" Directive**: Add the `"use client"` directive at the very top of a file **only** if the component:
    *   Uses React state hooks (`useState`, `useReducer`).
    *   Uses lifecycle hooks (`useEffect`, custom event listeners).
    *   Accesses client APIs (`useSearchParams`, client-side router hooks).
    *   Uses TanStack Query fetch hooks.

### TanStack Query Key Reactivity
*   **Cache Keys**: Ensure all dynamic inputs or states utilized inside query fetching functions are listed inside the TanStack Query cache key array. If they are missing, TanStack Query will not reactively refetch data when the state changes.
    ```typescript
    // BAD: Query key does not change when dynamic search terms or tabs change
    useQuery({
      queryKey: ['profile-posts'],
      queryFn: () => getProfilePosts(id, activeTab)
    });
    
    // GOOD: Automatically invalidates and refetches when id or activeTab updates
    useQuery({
      queryKey: ['profile-posts', id, activeTab],
      queryFn: () => getProfilePosts(id, activeTab)
    });
    ```

### Non-Destructive URL Parameter Mutations
*   When altering query parameters (e.g., opening/closing the detail modal via a `postId` parameter), you must manipulate query strings **non-destructively**.
*   **Always Clone Parameters**: Fetch existing parameters, clone them using `URLSearchParams`, update the specific key, and push the resulting string.
    > [!WARNING]
    > Blatant route overrides (e.g., `router.push("?postId=" + id)`) that destroy active contexts like search queries (`search`) or page pagination will result in **immediate PR rejection**.
    ```typescript
    // GOOD EXAMPLE: Modifying the URL parameters non-destructively
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const handleOpenModal = (id: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('postId', id.toString());
      router.push(`?${params.toString()}`, { scroll: false });
    };
    ```

### Anti-CLS (Cumulative Layout Shift) Pre-allocation
*   To prevent shifting layouts during image loading, we enforce deterministic container layouts.
*   **Aspect Ratio Binding**: Always define aspect ratio placeholders or render programmatic skeleton blocks when images are loading. Images must be contained inside components that occupy a fixed, pre-allocated height based on the picture aspect ratio.

### React Portal Enforcement for Viewport Breakouts
*   [ ] **React Portal for Modal Overlays**: Any global interaction overlay modal instantiated inside deeply nested components (such as a Masonry Grid Pin Card with active scaling animations, transitions, or parent `overflow: hidden` contexts) must utilize React Portal (`createPortal` from `react-dom` targeting `document.body`).
*   **Prevent Trapping & Clipping**: Rendering outside the parent container guarantees that the modal is appended directly under the HTML body element, completely preventing layout truncation, container clipping, or stacking context trapping anomalies caused by parent CSS transforms.

---

## 4. Security, Identity & Constraints Checklist

Maintaining the integrity of user data and backend security is paramount. Pay close attention to authorization and resource lifetimes.

### Authorization Guarding
*   **Secure API Endpoints**: Ensure all controller actions that mutate state or access private data are protected with the `[Authorize]` attribute.
*   **Role-Based Access Control (RBAC)**: Admin routes must strictly declare their role parameters:
    ```csharp
    [Authorize(Roles = "admin,moderator")]
    [HttpPost("resolve/{id}")]
    public async Task<IActionResult> ResolveReport(int id, [FromBody] ReportResolutionDto dto)
    ```
*   **Identity Identity Checks**: Never trust client claims for identity identification during mutations. Always verify the current caller context using claims in the controller:
    ```csharp
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    ```

### Automated Storage Leaks Check & Eventual Consistency Order
*   When deleting posts, you must clean up both the SQL database records and the corresponding physical media files stored on Cloudinary.
    > [!IMPORTANT]
    > **Strict Eventual Consistency Execution Order**:
    > You must perform all database deletions and commit the transaction successfully **before** triggering the Cloudinary asset deletion asynchronously. 
    > 
    > Attempting to delete cloud assets from Cloudinary *before* the SQL database transaction commits is a **severe distributed systems anti-pattern** and will result in **immediate PR rejection**. If the SQL transaction fails or rolls back, the cloud file will have been permanently lost while the database still references it, leading to corrupted data states.

### Cascade Integrity Check
*   Due to SQL Server circular dependency limitations, direct SQL cascade deletes are disabled on several tables.
*   **Programmatic Cascades**: Ensure service methods programmatically remove related child tables (comments, likes, reports) within the active transaction block *before* attempting to delete the principal row (e.g., Post or User) to prevent relational constraint errors.

---

## 5. Code Review Culture & Etiquette

We treat code reviews as educational opportunities. A positive, collaborative culture is essential for high-quality engineering.

### Constructive Feedback Guidelines
When reviewing someone else's pull request, follow these etiquette principles:
*   **Objectivity**: Focus comments on our coding guidelines, standards, performance, and readability, not personal preferences.
*   **Educational Tone**: Explain the *why* behind your request. Frame comments constructively:
    *   *Avoid*: "You forgot to make this call async again."
    *   *Prefer*: "Using the async variant `ToListAsync()` here avoids blocking thread pool threads and prevents thread starvation under high load."

### Intern Guide to Receiving Reviews
As a junior developer or intern, follow these steps to navigate code reviews smoothly:
1.  **Ask Clarifying Questions**: If you do not understand a reviewer's comment or request, ask for clarification. Do not guess.
2.  **Use Thread Resolves Properly**: Do **not** resolve a comment thread yourself unless the reviewer explicitly tells you to or you have pushed the requested fix. Let the reviewer resolve the conversation once they verify the correction.
3.  **Apply Modifications Safely**: Once modifications are applied to your local branch, run another full build (`dotnet build` and `npm run build`) before pushing changes to remote.
