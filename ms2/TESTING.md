# MS2 — Voice AI Service
## Step 12: Manual Testing Guide

---

## Prerequisites

1. MS1 running at `http://localhost:3000`  
2. MS2 `.env` file created (copy `.env.example`, add your Gemini API key)  
3. MS2 server running: `uvicorn app.main:app --reload --port 8000`

---

## Test 1 — Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method GET
```
**Expected:** `{ status: "ok", service: "ms2-voice-ai" }`

---

## Test 2 — Docs UI

Open in browser: `http://localhost:8000/docs`  
All 4 conversation endpoints should appear.

---

## Test 3 — Full Voice Order Flow (Happy Path)

### Step A: Login to MS1 (get salesman token)
```powershell
$loginBody = '{"email":"salesman@bolorder.com","password":"Password123!"}'
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
         -Method POST -ContentType "application/json" -Body $loginBody
$token = $login.data.token
$salesmanId = $login.data.user.id
Write-Host "Token: $token"
```

### Step B: Start a conversation session
```powershell
$start = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/conversation/start" -Method POST
$sessionId = $start.sessionId
Write-Host "Session: $sessionId"
```

### Step C: Send audio file (first order turn)
```powershell
# Requires a test audio file saying e.g., "Sharma Store ke liye 10 packet Aloo Bhujia 200 gram"
$audioPath = "C:\path\to\test_audio.wav"

$form = @{
    session_id  = $sessionId
    salesman_id = $salesmanId
    auth_token  = $token
    audio       = Get-Item $audioPath
}
$resp = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/conversation/audio" `
        -Method POST -Form $form
Write-Host "Status: $($resp.status)"
Write-Host "Message: $($resp.message)"
```

**Expected outcomes:**
- `status: "clarifying"` → MS2 couldn't find the shop, asking for clarification
- `status: "confirming"` → Shop and products found, showing summary
- `message` → Hindi/English text of what MS2 said

### Step D: Reply to clarification (if needed)
```powershell
$replyForm = @{
    session_id = $sessionId
    auth_token = $token
    reply      = "Sharma General Store"   # corrected shop name
}
$resp2 = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/conversation/reply" `
         -Method POST -Form $replyForm
Write-Host "Status: $($resp2.status)"
Write-Host "Message: $($resp2.message)"
```

### Step E: Confirm the order
```powershell
$confirmForm = @{
    session_id = $sessionId
    auth_token = $token
    reply      = "Haan"   # "Yes" in Hindi
}
$resp3 = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/conversation/reply" `
         -Method POST -Form $confirmForm
Write-Host "Status: $($resp3.status)"          # Expected: "completed"
Write-Host "Order: $($resp3.order | ConvertTo-Json)"
```

### Step F: Cancel the order (alternative to Step E)
```powershell
$cancelForm = @{
    session_id = $sessionId
    auth_token = $token
    reply      = "Nahi"   # "No" in Hindi
}
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/conversation/reply" `
    -Method POST -Form $cancelForm
```

---

## Test 4 — End Session Early
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/conversation/$sessionId" -Method DELETE
```

---

## Conversation Status Reference

| `status`      | Meaning                                      | React action             |
|---------------|----------------------------------------------|--------------------------|
| `clarifying`  | MS2 needs more info (shop/product/quantity)  | Play audio, ask user     |
| `confirming`  | MS2 showing order summary, awaiting yes/no   | Play audio, show summary |
| `completed`   | Order placed in MS1 successfully             | Show success + order ID  |
| `cancelled`   | User cancelled the order                     | Show cancelled message   |
| `failed`      | MS1 API error during order creation          | Show error, offer retry  |

---

## Response Schema

```json
{
  "sessionId":         "uuid",
  "status":            "clarifying | confirming | completed | cancelled | failed",
  "message":           "Hindi/English text (what MS2 said)",
  "audio_base64":      "base64-encoded MP3 (play via <audio> tag in React)",
  "clarification_field": "shop | product | confirmation | null",
  "draft_order": {
    "shopId":   "uuid",
    "shopName": "Sharma General Store",
    "items":    [{"productVariantId": "uuid", "quantity": 10, ...}]
  },
  "order": { "...MS1 order object on completion..." }
}
```

---

## Conversation Endpoints Summary

| Method   | Path                                 | Purpose                    |
|----------|--------------------------------------|----------------------------|
| `POST`   | `/api/v1/conversation/start`         | Create session             |
| `POST`   | `/api/v1/conversation/audio`         | Send audio, get AI reply   |
| `POST`   | `/api/v1/conversation/reply`         | Send text reply            |
| `DELETE` | `/api/v1/conversation/{session_id}`  | End session                |
| `GET`    | `/api/v1/health`                     | Health check               |
| `GET`    | `/docs`                              | Swagger UI                 |
