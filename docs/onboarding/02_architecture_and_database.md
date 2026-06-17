# Onboarding Document 2: Architecture and Database Reference

This document covers our decoupled system architecture, core design patterns, custom middleware pipelines, and a database schema quick-reference guide.

---

## 1. System Architecture Overview

Picterest utilizes a modern **Decoupled Client-Server Model**:
1. **Next.js Frontend (Client)**: Acts as a rich, single-page application (SPA) wrapper driven by React 19. It communicates asynchronously via standard HTTP client fetches targeting RESTful backend endpoints.
2. **C# ASP.NET Core Web API (Server)**: Acts as a stateless, high-throughput backend service. It is protected by JWT Bearer token authentication schema, resolving client contexts from claims.

```mermaid
graph TD
    Client[Next.js React Client] -- "JSON / HTTPS" --> API[ASP.NET Web API]
    API -- "DI Context" --> Service[Services Layer]
    Service -- "Entity Framework Core" --> DB[(SQL Server DB)]
    Service -- "HTTP Signature REST" --> Cloudinary[Cloudinary Cloud Store]
```

### Core Design Patterns Implemented

#### Repository & Unit of Work Pattern (via EF Core)
We rely on Entity Framework Core's `DbContext` ([SharingPictureDbContext.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Data/Context/SharingPictureDbContext.cs)) as our central Repository and Unit of Work manager. DB connections, transaction cycles, and change trackers are abstracted by the DbContext interface.

#### Separation of Concerns Service Layer
Database operations and business rule validations are decoupled from API controllers. Controllers ([AuthController.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.WebApi/Controllers/AuthController.cs)) are strictly thin controllers responsible only for deserialization, ModelState checks, and returning IActionResult envelopes. Actual queries, validations, hashes, and updates live inside service classes like `AuthService`, `PostService`, and `ReportService`.

#### Dependency Injection (DI)
All services are registered inside the Web API Dependency Injection container scoped in [Program.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.WebApi/Program.cs). Services request their dependencies (e.g. DbContext or other services) via parameter list constructors, ensuring low coupling and testability.

#### Custom Middlewares
- **Active User Status Guard ([UserStatusValidationMiddleware.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.WebApi/Middleware/UserStatusValidationMiddleware.cs))**: Validates the active status of authenticated users on *every* request. If a user is deactivated or banned, the middleware bypasses subsequent routing and returns HTTP 401 Unauthorized immediately, invalidating any active JWTs.

---

## 2. Database Schema Reference

The SQL Server database is structured with the following normalized tables:

### Table Summary Reference

#### Table: `users`
Represents user credential accounts and profile indicators.
- `id` (int, PK, Identity): Primary key.
- `username` (varchar(50)): Unique username.
- `email` (varchar(100)): Unique email address.
- `password_hash` (varchar(255)): Salted password hash (BCrypt).
- `avatar_url` (varchar(255), nullable): Profile image URL.
- `status` (varchar(20), default `'active'`): Account state (`active`, `banned`, `deactivated`).
- `created_at` (datetime, default `GETDATE()`): Timestamp of signup.

#### Table: `roles`
System authorization roles.
- `id` (int, PK, Identity): Primary key.
- `role_name` (varchar(20)): Unique role string (`admin`, `moderator`, `user`).

#### Table: `user_roles`
Composite join table linking users to roles (Many-to-Many).
- `user_id` (int, FK pointing to `users(id)`): Join composite primary key.
- `role_id` (int, FK pointing to `roles(id)`): Join composite primary key.

#### Table: `posts`
Represents picture uploads metadata.
- `id` (int, PK, Identity): Primary key.
- `user_id` (int, FK pointing to `users(id)`): Creator reference.
- `caption` (varchar(1000), nullable): Post text content.
- `image_url` (varchar(255)): Cloudinary hosting URL.
- `cloudinary_public_id` (varchar(100)): Cloudinary asset ID.
- `delivery_status` (varchar(20), default `'pending'`): Visibility status (`pending`, `hidden`). Active visible statuses on the feed are evaluated via `.Where(p => p.DeliveryStatus != "hidden")`, which means statuses like `'pending'` or `'complete'` are valid public display states.
- `is_private` (bit, default `0`): Privacy visibility indicator.
- `created_at` (datetime, default `GETDATE()`): Timestamp of upload.

#### Table: `tags`
Categorization taxonomy.
- `id` (int, PK, Identity): Primary key.
- `tag_name` (varchar(50)): Unique normalized lowercase tag term.

#### Table: `post_tags`
Join table linking posts to tags (Many-to-Many).
- `post_id` (int, FK pointing to `posts(id)`): Join composite primary key.
- `tag_id` (int, FK pointing to `tags(id)`): Join composite primary key.

#### Table: `likes`
Join table mapping user engagement likes (Many-to-Many).
- `user_id` (int, FK pointing to `users(id)`): Composite primary key.
- `post_id` (int, FK pointing to `posts(id)`): Composite primary key.
- `created_at` (datetime, default `GETDATE()`): Timestamp of like.

#### Table: `comments`
Comments stream linked to posts.
- `id` (int, PK, Identity): Primary key.
- `user_id` (int, FK pointing to `users(id)`): Commenter reference.
- `post_id` (int, FK pointing to `posts(id)`): Target post reference.
- `content` (varchar(1000)): Plaintext message.
- `created_at` (datetime, default `GETDATE()`): Timestamp.

#### Table: `follows`
Social graph relations mapping user followers (Many-to-Many self-join).
- `follower_id` (int, FK pointing to `users(id)`): Composite primary key.
- `followed_id` (int, FK pointing to `users(id)`): Composite primary key.
- `created_at` (datetime, default `GETDATE()`): Timestamp.

#### Table: `reports`
User moderation complaints queue.
- `id` (int, PK, Identity): Primary key.
- `reporter_id` (int, FK pointing to `users(id)`): Reporting user reference.
- `post_id` (int, FK pointing to `posts(id)`): Reported post.
- `reason` (varchar(500)): Complaint comment.
- `status` (varchar(20), default `'pending'`): Report status (`pending`, `resolved`, `dismissed`).
- `moderator_id` (int, FK pointing to `users(id)`, nullable): Moderator processing resolution.
- `created_at` (datetime, default `GETDATE()`): Timestamp.

#### Table: `audit_logs`
Central log history for administrative actions.
- `id` (int, PK, Identity): Primary key.
- `action` (varchar(50)): Event descriptor (`DELETE_POST`, `BAN_USER`, `DISMISS_REPORT`).
- `actor_id` (int, FK pointing to `users(id)`, nullable): Admin/Moderator user ID.
- `target_id` (int, nullable): Infraction target ID.
- `details` (varchar(1000)): Contextual log notes.
- `created_at` (datetime, default `GETDATE()`): Timestamp.

---

## 3. Data Integrity & Cascading Constraints

To protect data consistency and comply with SQL Server constraints, the platform handles CASCADE operations programmatically:
1. **Direct Constraints**: Relational foreign keys are mapped using database integrity rules.
2. **Programmatic Cascadings**: Direct SQL CASCADE deletes on complex entities (like User or Post) can cause circular dependency constraints in SQL Server. Thus, controllers and services execute programmatic cascades. For example, during `DELETE_POST` resolving:
   - Associated Comments are deleted first.
   - Associated Likes are deleted.
   - Associated Reports are cleared.
   - **Cloudinary Deletion**: The system must explicitly invoke the Cloudinary API via `MediaService` (using `cloudinary_public_id`) to destroy the cloud asset before removing the SQL database row to prevent cloud storage leaks.
   - The central Post row is then safely removed, preventing orphan rows.
3. **Validation Guards**: Entity uniqueness is validated (e.g. unique username checks in [ProfileService.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Services/ProfileService.cs) and unique report checks in [ReportService.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Services/ReportService.cs)) prior to database save operations.
