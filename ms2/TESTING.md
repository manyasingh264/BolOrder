# MS2 — Voice AI Service
## Integration Testing Guide

---

## Architecture Overview

**Important:** The frontend never talks to MS2 directly. All communication flows through MS1:

```
React (Frontend) → MS1 (Express) → MS2 (FastAPI)
                     ↓
                PostgreSQL
```

MS1 acts as a secure gateway, injecting `auth_token` and `salesman_id` from the authenticated request context.

---

## Prerequisites

1. **PostgreSQL** running with seeded database
2. **MS1** running at `http://localhost:3000`
3. **MS2** `.env` file created (copy `.env.example`, add your Gemini API key)
4. **MS2** server running: `uvicorn app.main:app --reload --port 8000`
5. **Frontend** running: `npm run dev` (typically at `http://localhost:5173`)

---

## MS2 Direct API Testing (for debugging)

These tests call MS2 directly. **Do not use these from the frontend** — use MS1's proxy endpoints instead.

### Test 1 — Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method GET
```
**Expected:** `{ status: "healthy", service: "BolOrder Voice AI Service", ... }`

### Test 2 — Docs UI

Open in browser: `http://localhost:8000/docs`

---

## MS1 Proxy Endpoints (Frontend → MS1 → MS2)

The frontend calls these MS1 endpoints, which proxy to MS2:

| Method   | MS1 Path                             | MS2 Path (proxied to)           |
|----------|--------------------------------------|----------------------------------|
| `POST`   | `/api/voice-sessions/start`          | `/api/v1/conversation/start`     |
| `POST`   | `/api/voice-sessions/:id/audio`      | `/api/v1/conversation/audio`     |
| `POST`   | `/api/voice-sessions/:id/reply`      | `/api/v1/conversation/reply`     |
| `DELETE` | `/api/voice-sessions/:id`            | `/api/v1/conversation/:id`       |
| `GET`    | `/api/health/ai`                     | `/api/v1/health`                 |

**Security:** MS1 automatically injects `auth_token` and `salesman_id` from the JWT payload.

---

## Full End-to-End Test (via Frontend)

### Step 1: Login to Frontend

1. Open `http://localhost:5173` in browser
2. Login with salesman credentials (e.g., `salesman@bolorder.com` / `Password123!`)

### Step 2: Navigate to Voice Order Page

1. Click "Voice Order" in sidebar
2. Wait for session to start automatically (check browser console for errors)

### Step 3: Record Initial Order

1. Click the microphone button
2. Speak: "Ram Traders ko 10 packet Aloo Bhujia"
3. Click stop when done
4. Click "Send to AI"

### Step 4: Handle Clarification (if triggered)

If AI asks "Which Ram Traders?":
- **Option A (Text):** Type "Ram Traders Main Road" and click Send
- **Option B (Voice):** Record voice reply and send

### Step 5: Review and Confirm Order

When AI shows the order summary:
- Review shop name, items, and quantities
- Click "Confirm & Create Order"

### Step 6: Verify Order Created

1. Navigate to Orders page
2. The new order should appear with status `PENDING_CONFIRMATION`
3. Navigate to Dashboard
4. The order count should reflect the new order

---

## MS1 → MS2 Direct Testing (with auth)

For debugging MS1→MS2 communication:

### Step A: Login to MS1 (get salesman token)
```powershell
$loginBody = '{"email":"salesman@bolorder.com","password":"Password123!"}'
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
         -Method POST -ContentType "application/json" -Body $loginBody
$token = $login.data.token
$salesmanId = $login.data.user.id
Write-Host "Token: $token"
```

### Step B: Start conversation via MS1
```powershell
$headers = @{ Authorization = "Bearer $token" }
$start = Invoke-RestMethod -Uri "http://localhost:3000/api/voice-sessions/start" `
         -Method POST -Headers $headers
$sessionId = $start.data.sessionId
Write-Host "Session: $sessionId"
```

### Step C: Send audio via MS1
```powershell
$audioPath = "C:\path\to\test_audio.wav"

$form = @{
    audio = Get-Item $audioPath
}
$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/voice-sessions/$sessionId/audio" `
        -Method POST -Headers $headers -Form $form
Write-Host "Status: $($resp.data.status)"
Write-Host "Message: $($resp.data.message)"
```

---

## Conversation Status Reference

| `status`      | Meaning                                      | Frontend action                          |
|---------------|----------------------------------------------|------------------------------------------|
| `clarifying`  | MS2 needs more info (shop/product/quantity)  | Play TTS audio, show question, ask user  |
| `completed`   | Order ready for confirmation                 | Show order summary for user confirmation |
| `cancelled`   | User cancelled the order                     | Show cancelled message                   |
| `failed`      | MS1 API error during order creation          | Show error, offer retry                  |

---

## Response Schema (MS1 → Frontend)

```json
{
  "success": true,
  "message": "Audio processed successfully",
  "data": {
    "sessionId":         "uuid",
    "status":            "clarifying | completed | cancelled | failed",
    "message":           "Hindi/English text (what AI said)",
    "audio_base64":      "base64-encoded MP3 (play via VoicePlayer)",
    "clarification_field": "shop | product | null",
    "draft_order": {
      "shopId":   "uuid",
      "shopName": "Sharma General Store",
      "items":    [{"productVariantId": "uuid", "quantity": 10, ...}]
    },
    "order": { "...MS1 order object on completion..." }
  }
}
```

---

## MS2 → MS1 Order Creation (Final Step)

When conversation completes, MS2 calls MS1 directly:

**Endpoint:** `POST http://localhost:3000/api/orders/voice`

**Payload:**
```json
{
  "shopId": "uuid",
  "items": [
    { "productVariantId": "uuid", "quantity": 10 }
  ],
  "rawTranscript": "Original speech-to-text transcript"
}
```

**Response:** Order created with status `PENDING_CONFIRMATION`

---

## Troubleshooting

### Health check fails
- Verify MS2 is running on port 8000
- Check MS2 logs for startup errors
- Verify `FASTAPI_BASE_URL` in MS1 `.env` is `http://localhost:8000`

### Audio upload fails
- Check MS1 uploads directory exists and is writable
- Verify audio file size < 25MB
- Check multer configuration in `voiceSessions.controller.js`

### Session not found
- Session TTL is 30 minutes (configurable in MS2 `.env`)
- Check session store is initialized correctly
- Verify session ID is being passed correctly

### CORS errors
- MS1 CORS origins: `http://localhost:5173,http://localhost:3000`
- MS2 CORS origins: `http://localhost:5173,http://localhost:3000`
- Verify credentials are enabled in both services

### Order not appearing in frontend
- Check MS1 database for the order
- Verify order status is `PENDING_CONFIRMATION`
- Refresh Orders page or Dashboard
- Check browser console for API errors
