# Onboarding Document 1: SRS and Tech Stack Reference

Welcome to the team! This onboarding document is designed to get you up to speed quickly on the **Sharing Picture Platform** (codenamed "Picterest"). This guide covers our system requirements, full technology stack, local setup guide, and current product maturity index.

---

## 1. Executive Summary & Core SRS

The **Sharing Picture Platform** is a secure, high-performance, Pinterest-inspired image sharing web application. It features a fully decoupled architecture featuring a rich responsive Next.js frontend and a stateless C# ASP.NET Core Web API backend.

### Primary Functional Modules Implemented
- **Module 1: User Authentication & Security**: Traditional signup/login with BCrypt password hashing, Google OAuth token verification, secure JSON Web Tokens (JWT) storage, and automatic session restoration.
- **Module 2: Direct Image Uploading Workflow**: Direct client-to-Cloudinary upload pipeline utilizing secure backend-generated SHA-256 API signatures, preventing resource hijack.
- **Module 3: Masonry Discovery Feed**: Responsive grid system featuring programmatic layout distribution to eliminate Cumulative Layout Shift (CLS), unified search queries filtering by captions/tags, and infinite scrolling feeds.
- **Module 4: Social Interaction & Engagement**: Optimistic like toggling for instantaneous client responses and chronological comments feeds utilizing cache invalidation hooks.
- **Module 5: Relationship Management & Profiles**: User profile cards displaying detailed metadata statistics, dynamic Follower/Following modal list overlays, and real-time navigation sync.
- **Module 6: Moderation & Audit Logging**: Banning infractions, CASCADE deletes for deleted posts, user reports shadow-ban automation (auto-hiding posts with $\ge 5$ reports), and central database audit logs.

---

## 2. Deep-Dive Tech Stack

The following table documents every core technology, library, and framework used in this project:

### Backend Architecture (.NET 8.0)
| Dependency / Tech | Version | Purpose & Description |
| :--- | :--- | :--- |
| **.NET SDK** | `8.0` | Stateless runtime environment and compile target. |
| **EF Core SqlServer** | `8.0.28` | Object-Relational Mapper (ORM) targeting Microsoft SQL Server database schemas. |
| **BCrypt.Net-Next** | `4.0.3` | Work-factor salted password hashing implementation. |
| **Google.Apis.Auth** | `1.75.0` | Backend Google OAuth2 ID Token signature validation library. |
| **System.IdentityModel.Tokens.Jwt** | `8.0.2` | JWT generation and claims token parsing utility. |
| **CloudinaryDotNet** | `1.29.2` | Signature generator and media management SDK. |
| **Swashbuckle.AspNetCore** | `6.6.2` | OpenAPI Specification (Swagger UI) documentation generator. |

### Frontend Architecture (Next.js 16 + React 19)
| Dependency / Tech | Version | Purpose & Description |
| :--- | :--- | :--- |
| **Next.js** | `16.2.9` | App Router framework driving dynamic rendering, layout structure, and routing. |
| **React** | `19.2.4` | Component tree framework utilizing new client-side hooks (`use`). |
| **TanStack Query** | `5.101.0` | Client state cache manager handling dynamic queries, pre-fetches, and mutations. |
| **Tailwind CSS** | `4.0.0` | Style compiling system driving glassmorphic dark-theme layouts. |
| **@react-oauth/google** | `0.13.5` | Google Identity authentication button loader client wrapper. |
| **react-intersection-observer** | `10.0.3` | Sentinel-trigger monitoring hooks for infinite scrolling feed requests. |

---

## 3. Local Environment Setup Guide

Follow these steps to configure your local developer environment:

### Step A: Database Setup
Make sure you have LocalDB or Microsoft SQL Server Express running.
Configure your database connection string in [appsettings.json](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.WebApi/appsettings.json).

#### Backend Configuration Schema ([appsettings.json](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.WebApi/appsettings.json))
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SharingPictureDb;Trusted_Connection=True;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "YOUR_SUPER_SECRET_COMPLEX_SECURITY_KEY_JWT_MUST_BE_AT_LEAST_32_CHARACTERS",
    "Issuer": "SharingPicture",
    "Audience": "SharingPictureUsers"
  },
  "Cloudinary": {
    "CloudName": "YOUR_CLOUDINARY_CLOUD_NAME",
    "ApiKey": "YOUR_CLOUDINARY_API_KEY",
    "ApiSecret": "YOUR_CLOUDINARY_API_SECRET",
    "UploadPreset": "sharing_preset",
    "Folder": "picterest"
  }
}
```

### Step B: Apply EF Core Database Migrations
Open your CLI in the `backend/SharingPicture` directory and run:
```bash
# Verify dotnet tools are installed
dotnet tool install --global dotnet-ef

# Apply migrations to generate tables
dotnet ef database update --project SharingPicture.Data --startup-project SharingPicture.WebApi
```

### Step C: Frontend Configuration
Create a `.env.local` file inside the `frontend` folder:

#### Frontend Configuration Schema ([.env.local](file:///d:/Dev_Web/Picterest/frontend/.env.local))
```env
NEXT_PUBLIC_API_URL=https://localhost:7287/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
```

### Step D: Run the Applications Locally
Open two terminal instances:

#### Terminal 1: Backend API Service
```bash
cd backend/SharingPicture
dotnet run --project SharingPicture.WebApi
```
Swagger UI will be hosted at `https://localhost:7287/swagger/index.html`.

#### Terminal 2: Next.js Client
```bash
cd frontend
npm install
npm run dev
```
The application will be hosted at `http://localhost:3000`.

---

## 4. Product Maturity Map

Review the current status of each component:

| Feature / Module | Backend Status | Frontend Status | Status |
| :--- | :--- | :--- | :--- |
| **Traditional Auth & Google OAuth** | Fully Implemented | State Synced Modals | **Done** |
| **Media Signature Generation** | SHA-256 Authenticated | Client direct upload | **Done** |
| **Discovery Masonry Feed** | Joined search endpoint | Intersection sentinel | **Done** |
| **Interaction System** | Like/Comment services | Optimistic Cache Sync | **Done** |
| **Relationship overlays** | Follows counts endpoints | Overlay Modal Lists | **Done** |
| **Report shadow-ban** | Threshold auto-hiding | Form inputs & alert | **Done** |
| **Admin Moderation Portal** | Cascade deletions API | Layout role guards | **Done** |
| **Audit Logging** | Central structured tables | N/A | **Done** |
| **Direct Binary Downloads** | N/A | CORS Blob fallback | **Done** |
| **Privacy Toggle Controls** | Strict feed filtering | Form toggle selectors | **Done** |
| **Live Notifications** | Future Scope | Future Scope | **Active** |
| **Direct Messages** | Future Scope | Future Scope | **Backlog** |

---

## 5. Direct Binary Downloads & CORS Behavior

The application supports direct binary image downloads from both the Discovery Feed cards and the Pin Detail Modals.

> [!NOTE]
> **Intern Note on Cloudinary CORS Settings**:
> When a user triggers an image download, the client attempts to retrieve the image file using `fetch(imageUrl)`. This allows the browser to convert the response into a binary `Blob` object and programmatically download it with a custom filename.
>
> However, whether this request succeeds depends on the CORS (Cross-Origin Resource Sharing) configurations in your **Cloudinary console**:
> 1. **If CORS is configured to allow your client origin** (e.g., `http://localhost:3000` or your production domain), the `fetch` query completes successfully, downloading the image directly to the client's device.
> 2. **If CORS is NOT configured** (or blocks the request), the `fetch` call will fail due to cross-origin security restrictions. The client-side code catches this error and gracefully falls back to invoking `window.open(imageUrl, '_blank')`, opening the raw image asset in a new browser tab for manual saving.

