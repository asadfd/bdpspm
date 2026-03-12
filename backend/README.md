# BDSPM Backend

Spring Boot 3.4 + Java 17 + PostgreSQL backend with OAuth2 (Google) and dual-key security.

## Requirements

- Java 17+
- Maven 3.9+
- PostgreSQL 14+

## Setup

1. **Database**

   ```bash
   createdb bdspm
   psql -d bdspm -f src/main/resources/schema.sql
   ```

   Or let JPA create schema (set `spring.jpa.hibernate.ddl-auto: update` for dev only).

2. **Google OAuth2**

   - Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
   - Create OAuth 2.0 Client ID (Web application).
   - Set authorized redirect URI: `http://localhost:8080/login/oauth2/code/google` (use HTTPS in production).
   - Set env or `application.yml`:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`

3. **Run**

   ```bash
   mvn spring-boot:run
   ```

   Default port: 8080.

## Security (Dual-Key)

- **Login:** OAuth2 with Google (`/oauth2/authorization/google`). Session is stored in **HttpOnly, Secure, SameSite=Strict** cookie (no JWT in localStorage).
- **API access:** After login, every request to `/api/**` must include header:
  - `X-Agent-Username: <username>`
  - Backend checks that this username and the Google email belong to the **same active user** in the DB. If not, responds with `403 Access Denied`.

Create a user in `users` with `username` and `email` matching the Google account you use, and pass that `username` in `X-Agent-Username` when calling APIs.

## API

- **GET /api/inventory/map**  
  Returns nested JSON: properties → rooms → bed units. Requires authentication + `X-Agent-Username`.

- **POST /api/payments/log**  
  Body: `{ "txnNo": "...", "amount": 100.00, "date": "2025-03-07" }`  
  Links the payment to the logged-in agent (`created_by_user_id`). Requires authentication + `X-Agent-Username`.

## Tech

- Constructor injection, record DTOs, global exception handling (ProblemDetail).
- Session cookie config in `application.yml`; dual-key validation in `AgentUsernameFilter` and `CustomOAuth2UserService`.
