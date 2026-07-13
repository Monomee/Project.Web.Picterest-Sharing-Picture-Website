# Authentication, Authorization & Password Reset Flows

This document details the architectural structure, class designs, sequence flows, and codebase mappings for authentication, Google OAuth login, and the forgot/reset password system.

---

## 1. Class Diagram

The class diagram below displays the structural relationships and dependencies between controllers, services, database contexts, and models in the authentication module.

```mermaid
classDiagram
    class AuthController {
        - IAuthService _authService
        - IEmailService _emailService
        + Register(RegisterRequest) Task<IActionResult>
        + Login(LoginRequest) Task<IActionResult>
        + GoogleLogin(GoogleLoginRequest) Task<IActionResult>
        + ForgotPassword(ForgotPasswordRequest) Task<IActionResult>
        + ResetPassword(ResetPasswordRequest) Task<IActionResult>
    }

    class IAuthService {
        <<interface>>
        + RegisterAsync(string, string, string) Task<User?>
        + LoginAsync(string, string) Task<User?>
        + VerifyGoogleTokenAsync(string) Task<User?>
        + GenerateJwtToken(User) string
        + GenerateResetTokenAsync(string) Task<string?>
        + ResetPasswordAsync(string, string, string) Task<bool>
    }

    class AuthService {
        - SharingPictureDbContext _context
        - IConfiguration _configuration
    }

    class IEmailService {
        <<interface>>
        + SendEmailAsync(string, string, string) Task
    }

    class EmailService {
        - EmailSettings _emailSettings
    }

    class EmailSettings {
        + string SmtpServer
        + int Port
        + string SenderName
        + string SenderEmail
        + string Username
        + string Password
    }

    class SharingPictureDbContext {
        + DbSet<User> Users
    }

    class User {
        + int Id
        + string Username
        + string Email
        + string PasswordHash
        + string? PasswordResetToken
        + DateTime? PasswordResetTokenExpires
    }

    AuthController --> IAuthService : Dependency
    AuthController --> IEmailService : Dependency
    AuthService ..|> IAuthService : Implements
    EmailService ..|> IEmailService : Implements
    AuthService --> SharingPictureDbContext : Dependency
    EmailService --> EmailSettings : Dependency
    SharingPictureDbContext --> User : Persists
```

---

## 2. Sequence Diagrams

### Use Case 1: Login with Account (Traditional Login)
This diagram illustrates traditional credentials verification using client-side pre-hashing and server-side BCrypt validation.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as Next.js Web Client
    participant AuthCtrl as AuthController
    participant AuthService as AuthService
    participant DB as SQL Server DB

    User->>FE: Inputs credentials (Username/Email & Password)
    FE->>FE: Validates raw input (Length >= 6)
    FE->>FE: Hashes password to SHA-256 Hex string via Web Crypto API
    FE->>AuthCtrl: POST /api/auth/login { usernameOrEmail, password: SHA256_hash }
    AuthCtrl->>AuthService: LoginAsync(usernameOrEmail, SHA256_hash)
    AuthService->>DB: Query User record by username or email
    DB-->>AuthService: Return User details with BCrypt password_hash
    AuthService->>AuthService: Verify password matches via BCrypt.Net.BCrypt.Verify(...)
    alt Credentials Valid
        AuthService-->>AuthCtrl: Return User entity
        AuthCtrl->>AuthService: GenerateJwtToken(user)
        AuthService-->>AuthCtrl: Return JWT token string
        AuthCtrl-->>FE: HTTP 200 OK { token, userMetadata }
        FE->>FE: Store token in localStorage / cookies
        FE-->>User: Redirect to Feed page
    else Credentials Invalid
        AuthService-->>AuthCtrl: Return null
        AuthCtrl-->>FE: HTTP 401 Unauthorized { message: "Invalid credentials" }
        FE-->>User: Show authentication error alert
    end
```

### Use Case 2: Login with Google (OAuth2)
This flow models external single-sign-on token verification, auto-registering new OAuth accounts on-the-fly.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as Next.js Web Client
    participant Google as Google Identity Provider
    participant AuthCtrl as AuthController
    participant AuthService as AuthService
    participant DB as SQL Server DB

    User->>FE: Click "Sign in with Google"
    FE->>Google: Prompt user auth challenge
    Google-->>FE: Return signed OAuth2 ID Token
    FE->>AuthCtrl: POST /api/auth/google { idToken }
    AuthCtrl->>AuthService: VerifyGoogleTokenAsync(idToken)
    AuthService->>Google: Validate token signature & audience
    Google-->>AuthService: Return token payload (Email, Picture, Name)
    AuthService->>DB: Query User record by Google email
    alt User Exists
        DB-->>AuthService: Return existing User entity
    else User is New
        AuthService->>AuthService: Extract base username & generate unique username
        AuthService->>AuthService: Create secure dummy password hash via BCrypt
        AuthService->>DB: Insert new User (Email, Username, DummyHash, Google Avatar)
        DB-->>AuthService: Confirm insertion & return User entity
    end
    AuthService-->>AuthCtrl: Return User details
    AuthCtrl->>AuthService: GenerateJwtToken(user)
    AuthService-->>AuthCtrl: Return JWT token string
    AuthCtrl-->>FE: HTTP 200 OK { token, userMetadata }
    FE->>FE: Store token & redirect to Feed
```

### Use Case 3: Forgot & Reset Password
This sequence maps the request of a reset token (which sends a real HTML email via MailKit SMTP) and the subsequent password reset submission.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Inbox / Browser
    participant FE as Next.js Web Client
    participant AuthCtrl as AuthController
    participant AuthService as AuthService
    participant EmailService as EmailService
    participant DB as SQL Server DB

    Note over User, EmailService: 1. Forgot Password Request Flow
    User->>FE: Navigate to Forgot tab, enter email
    FE->>AuthCtrl: POST /api/auth/forgot-password { email }
    AuthCtrl->>AuthService: GenerateResetTokenAsync(email)
    AuthService->>DB: Fetch user by email
    DB-->>AuthService: User record found
    AuthService->>AuthService: Generate GUID token & expires (UtcNow + 15m)
    AuthService->>DB: Save PasswordResetToken & PasswordResetTokenExpires
    DB-->>AuthService: Persisted
    AuthService-->>AuthCtrl: Return token string
    AuthCtrl->>AuthCtrl: Construct URL: http://localhost:3000/reset-password?token=XYZ&email=email
    AuthCtrl->>EmailService: SendEmailAsync(email, subject, HTML_template_with_URL)
    EmailService->>EmailService: Connect via STARTTLS (Port 587) & Authenticate SMTP
    EmailService-->>User: Deliver HTML reset notification mail
    AuthCtrl-->>FE: HTTP 200 OK { message: "Email sent successfully" }
    FE-->>User: Inform user to check their email inbox

    Note over User, FE: 2. Password Reset Submission Flow
    User->>FE: Click Reset button in mail (loads reset-password page)
    FE->>FE: Extract token and email parameters from URL
    User->>FE: Inputs new password & confirmation
    FE->>FE: Validates password strength (Length >= 6)
    FE->>FE: Hashes new password to SHA-256 Hex string
    FE->>AuthCtrl: POST /api/auth/reset-password { email, token, newPassword: SHA256_hash }
    AuthCtrl->>AuthService: ResetPasswordAsync(email, token, SHA256_hash)
    AuthService->>DB: Fetch user by email
    DB-->>AuthService: Return User details
    AuthService->>AuthService: Verify Token matches & Expiration > UtcNow
    alt Token Valid
        AuthService->>AuthService: Hash incoming SHA-256 string using BCrypt
        AuthService->>DB: Update PasswordHash, clear reset token & expiration columns
        DB-->>AuthService: Save modifications
        AuthService-->>AuthCtrl: Return true
        AuthCtrl-->>FE: HTTP 200 OK { message: "Password reset successfully" }
        FE-->>User: Show success toast & redirect to Login screen
    else Token Invalid / Expired
        AuthService-->>AuthCtrl: Return false
        AuthCtrl-->>FE: HTTP 400 BadRequest { message: "Invalid or expired token" }
        FE-->>User: Display error message
    end
```

---

## 3. Codebase File References

These are the primary source code implementation mappings representing these security architectures:

### Client Interface (Next.js)
- [login/page.tsx](file:///d:/Dev_Web/Picterest/frontend/src/app/(auth)/login/page.tsx): Controls the login and registration switch forms, handles validation, SHA-256 pre-hashing, Google OAuth payload submissions, and Forgot Password email requests.
- [reset-password/page.tsx](file:///d:/Dev_Web/Picterest/frontend/src/app/(auth)/reset-password/page.tsx): Reads parameter tokens from URL queries, executes validation, handles SubtleCrypto SHA-256 password pre-hashing, and submits password reset queries.
- [useAuth.tsx](file:///d:/Dev_Web/Picterest/frontend/src/hooks/useAuth.tsx): Stores active tokens, handles JSON Web Token payload decoding, and provides session state values globally.

### Presentation API Layer (ASP.NET Controllers)
- [AuthController.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.WebApi/Controllers/AuthController.cs): Receives HTTP payloads, validates DTO inputs, injects authorization handlers, maps login profiles, handles Google SSO callbacks, sends SMTP emails, and executes password updates.

### Business & Configuration Layer (C# Services)
- [IAuthService.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Services/IAuthService.cs): Defines the core interface contracts for registration, authentication, OAuth validation, and token updates.
- [AuthService.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Services/AuthService.cs): Holds business logic, verifies security states, generates JWT authorization tokens, hashes incoming passwords using BCrypt, and updates reset credentials.
- [IEmailService.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Services/IEmailService.cs): Defines the SMTP email delivery contracts.
- [EmailService.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Services/EmailService.cs): Connects to Brevo SMTP servers using STARTTLS security protocols via MailKit, delivering HTML templates.
- [EmailSettings.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Services/EmailSettings.cs): Maps the SMTP configuration options.

### Persistent Entity Model
- [SharingPictureDbContext.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Data/Context/SharingPictureDbContext.cs): EF Core context binding mapping.
- [User.cs](file:///d:/Dev_Web/Picterest/backend/SharingPicture/SharingPicture.Data/Entities/User.cs): User table metadata fields mapping.
