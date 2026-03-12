# BDSPM Backend – Testing Guide

Use this document in order. The application must be **UP** (e.g. `mvn org.springframework.boot:spring-boot-maven-plugin:run`).

---

## Prerequisites

- Application running on **http://localhost:8080**
- PostgreSQL running with database **bdspm**
- Google OAuth2 configured (Client ID & Secret in `application-dev.yml` or env)
- One **user** row in `users` with:
  - `username` and `email` = same as the Google account you will use to log in
  - `is_active = true`

**Create test user (if needed):**

```sql
INSERT INTO users (username, email, role, is_active)
VALUES ('agent1', 'your.google@gmail.com', 'AGENT', true);
```

Replace `your.google@gmail.com` with the exact Gmail you use for Google sign-in.

---

## Step 1: Confirm application is UP

**Request**

- **Method:** GET  
- **URL:** http://localhost:8080/

**Expected**

- Browser may redirect to login or show a default page; no 502/503/connection error means the app is up.

**Optional (if you add a health endpoint later)**

- GET http://localhost:8080/actuator/health (only if Spring Boot Actuator is added).

---

## Step 2: Log in with Google (get session cookie)

**What to do**

1. Open a browser and go to:  
   **http://localhost:8080/oauth2/authorization/google**
2. Sign in with the Google account whose email matches the `users.email` you inserted.
3. After redirect back to the app, you are logged in. The session is stored in a **cookie** (e.g. `BDSPM_SESSION` or `JSESSIONID`).

**Expected**

- No error page; you land on the app (e.g. root or default redirect).
- In DevTools → Application → Cookies → localhost:8080 you should see the session cookie.

**Note:** For **API** calls you must send this cookie with every request (e.g. Postman “Send cookies” or curl `-b`). Use the same browser session or copy the cookie value into your API client.

---

## Step 3: GET Inventory Map (nested Property → Room → BedUnit)

**Request**

- **Method:** GET  
- **URL:** http://localhost:8080/api/inventory/map  
- **Headers:**
  - `X-Agent-Username: agent1` (use the `username` from your `users` row)
  - Cookie: session cookie from Step 2 (browser sends automatically; in Postman/curl you must attach it).

**Example (curl, after logging in in browser and copying cookie):**

```bash
curl -s -b "JSESSIONID=<your-session-id>" \
  -H "X-Agent-Username: agent1" \
  http://localhost:8080/api/inventory/map
```

**Expected**

- **Status:** 200 OK  
- **Body:** JSON with nested structure:

```json
{
  "properties": [
    {
      "id": 1,
      "name": "Property Name",
      "rooms": [
        {
          "id": 1,
          "name": "Room Name",
          "propertyId": 1,
          "bedUnits": [
            {
              "id": 1,
              "status": "AVAILABLE",
              "roomId": 1
            }
          ]
        }
      ]
    }
  ]
}
```

If there is no data yet, `properties` will be `[]`.

**Failure cases**

- **401 Unauthorized:** Not logged in or cookie missing → do Step 2 again.
- **403 Forbidden:** Missing `X-Agent-Username` or username/email do not match an active user → check header and `users` table.

---

## Step 4: POST Log a payment

**Request**

- **Method:** POST  
- **URL:** http://localhost:8080/api/payments/log  
- **Headers:**
  - `Content-Type: application/json`
  - `X-Agent-Username: agent1` (same as Step 3)
  - Cookie: session cookie from Step 2

**Body (JSON):**

```json
{
  "txnNo": "TXN-001",
  "amount": 150.50,
  "date": "2025-03-08"
}
```

**Example (curl):**

```bash
curl -s -X POST http://localhost:8080/api/payments/log \
  -b "JSESSIONID=<your-session-id>" \
  -H "X-Agent-Username: agent1" \
  -H "Content-Type: application/json" \
  -d "{\"txnNo\":\"TXN-001\",\"amount\":150.50,\"date\":\"2025-03-08\"}"
```

**Expected**

- **Status:** 201 Created  
- **Body:** Payment object, e.g.:

```json
{
  "id": 1,
  "txnNo": "TXN-001",
  "amount": 150.50,
  "paymentDate": "2025-03-08",
  "paymentMode": null,
  "status": "PENDING",
  "createdByUserId": 1,
  "createdAt": "2025-03-08T12:00:00Z"
}
```

**Failure cases**

- **400 Bad Request:** Validation error (e.g. missing/invalid `txnNo`, `amount`, or `date`), or duplicate `txnNo` (message like “Payment with txn_no already exists”).
- **401/403:** Same as Step 3 → check login and `X-Agent-Username`.

---

## Step 5: (Optional) Test duplicate transaction number

**Request**

- Same as Step 4, but use the **same** `txnNo` again (e.g. `"txnNo": "TXN-001"`).

**Expected**

- **Status:** 400 Bad Request  
- **Body:** ProblemDetail or message indicating that a payment with this `txn_no` already exists.

---

## Step 6: (Optional) Test 403 without X-Agent-Username

**Request**

- **Method:** GET  
- **URL:** http://localhost:8080/api/inventory/map  
- **Headers:** Only the session cookie; **do not** send `X-Agent-Username`.

**Expected**

- **Status:** 403 Forbidden  
- **Body:** JSON (e.g. ProblemDetail) with an “Access Denied” or “Missing X-Agent-Username” type message.

---

## API summary

| Step | Method | URL | Purpose |
|------|--------|-----|--------|
| 1 | GET | / | Check app is UP |
| 2 | Browser | /oauth2/authorization/google | Log in with Google (get session cookie) |
| 3 | GET | /api/inventory/map | Get nested inventory (Property → Room → BedUnit) |
| 4 | POST | /api/payments/log | Log a payment (linked to logged-in agent) |
| 5 | POST | /api/payments/log (same txnNo) | Expect 400 duplicate |
| 6 | GET | /api/inventory/map (no header) | Expect 403 |

---

## Postman tips

1. **Login:** Use a browser, go to http://localhost:8080/oauth2/authorization/google, sign in.
2. **Cookies:** In Postman, enable “Send cookies” in the request (or use Interceptor / “Cookies” tab and ensure the session cookie is sent for localhost:8080).
3. **Collection variables:** Set `baseUrl` = `http://localhost:8080` and `agentUsername` = `agent1`; use `{{baseUrl}}/api/inventory/map` and header `X-Agent-Username: {{agentUsername}}`.
4. **Sequence:** Create requests in order: Step 1 → Step 2 (in browser) → Step 3 → Step 4 → Step 5 → Step 6.

---

## Quick reference – required for `/api/*`

- **Cookie:** Session cookie from Google login.
- **Header:** `X-Agent-Username: <username>` where `<username>` exists in `users` and matches the logged-in Google email.
