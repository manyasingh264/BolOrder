# BolOrder — End-to-End Test Checklist

This checklist verifies the complete voice order integration from frontend through MS1 to MS2 and back.

---

## Pre-Test Setup

### 1. Database Setup
- [ ] PostgreSQL is running
- [ ] Database is seeded with test data (shops, products, salesman account)
- [ ] Verify salesman account exists: `salesman@bolorder.com` / `Password123!`

### 2. MS1 (Express Backend)
- [ ] Navigate to `ms1-core-api/`
- [ ] Install dependencies: `npm install`
- [ ] Configure `.env`:
  - `DATABASE_URL=postgresql://...`
  - `JWT_SECRET=your-secret`
  - `FASTAPI_BASE_URL=http://localhost:8000`
  - `PORT=3000`
- [ ] Start server: `npm run dev`
- [ ] Verify health check: `curl http://localhost:3000/api/health`

### 3. MS2 (FastAPI AI Backend)
- [ ] Navigate to `ms2/`
- [ ] Create virtual environment (if not exists)
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Configure `.env` (copy from `.env.example`):
  - `API_KEY=your-gemini-api-key`
  - `MS1_BASE_URL=http://localhost:3000`
  - `PORT=8000`
  - `CORS_ORIGINS=http://localhost:5173,http://localhost:3000`
- [ ] Start server: `uvicorn app.main:app --reload --port 8000`
- [ ] Verify health check: `curl http://localhost:8000/api/v1/health`

### 4. Frontend (React)
- [ ] Navigate to `frontend/`
- [ ] Install dependencies: `npm install`
- [ ] Configure environment (if needed):
  - `VITE_API_BASE_URL=http://localhost:3000/api`
- [ ] Start dev server: `npm run dev`
- [ ] Open browser: `http://localhost:5173`

---

## Integration Smoke Tests

### Test 1: MS1 Health Check
```bash
curl http://localhost:3000/api/health
```
- [ ] Returns `{"success":true,"message":"ms1-core-api is running",...}`

### Test 2: MS2 Health Check
```bash
curl http://localhost:8000/api/v1/health
```
- [ ] Returns `{"status":"healthy","service":"BolOrder Voice AI Service",...}`

### Test 3: MS1 AI Health Check (proxies to MS2)
```bash
curl http://localhost:3000/api/health/ai
```
- [ ] Returns `{"success":true,"message":"AI service is online",...}`

### Test 4: Frontend Login
- [ ] Open `http://localhost:5173`
- [ ] Login with `salesman@bolorder.com` / `Password123!`
- [ ] Redirected to Dashboard
- [ ] No console errors

---

## Voice Order Flow Tests

### Test 5: Basic Voice Order (No Clarification)

**Goal:** Create a simple order without triggering clarifications

1. [ ] Navigate to Voice Order page
2. [ ] Wait for session to start (check console for "Session started")
3. [ ] Click microphone button
4. [ ] Speak clearly: "Sharma Kirana Store ko 5 packet Aloo Bhujia 200 gram"
5. [ ] Stop recording
6. [ ] Click "Send to AI"
7. [ ] Wait for processing (spinner shown)
8. [ ] AI responds with order summary
9. [ ] Verify shop name: "Sharma Kirana Store"
10. [ ] Verify item: "Aloo Bhujia 200g" × 5
11. [ ] Click "Confirm & Create Order"
12. [ ] See success message
13. [ ] Navigate to Orders page
14. [ ] New order appears with status `PENDING_CONFIRMATION`
15. [ ] Navigate to Dashboard
16. [ ] Order count reflects new order

### Test 6: Voice Order with Shop Clarification

**Goal:** Test multi-turn conversation for ambiguous shop name

1. [ ] Navigate to Voice Order page
2. [ ] Click microphone button
3. [ ] Speak: "Ram Traders ko 10 packet Mixture"
4. [ ] Stop recording
5. [ ] Click "Send to AI"
6. [ ] AI responds: "Which Ram Traders?" (text + TTS audio)
7. [ ] Play TTS audio (verify it works)
8. [ ] Type reply: "Ram Traders Main Road"
9. [ ] Click Send button
10. [ ] AI responds with order summary
11. [ ] Verify shop: "Ram Traders Main Road"
12. [ ] Click "Confirm & Create Order"
13. [ ] Order created successfully

### Test 7: Voice Order with Voice Reply

**Goal:** Test voice reply to clarification

1. [ ] Navigate to Voice Order page
2. [ ] Speak: "New Shop ko 5 packet Aloo Bhujia"
3. [ ] Send to AI
4. [ ] AI asks for clarification
5. [ ] Click microphone for reply
6. [ ] Speak: "New Shop Sector 4"
7. [ ] Stop and send voice reply
8. [ ] AI responds with order summary
9. [ ] Confirm order
10. [ ] Order created successfully

### Test 8: Cancel Order

**Goal:** Test order cancellation flow

1. [ ] Navigate to Voice Order page
2. [ ] Speak: "Test Store ko 5 packet Aloo Bhujia"
3. [ ] Send to AI
4. [ ] AI shows order summary
5. [ ] Click "Cancel" button
6. [ ] Session ends
7. [ ] Navigate to Orders page
8. [ ] No new order created

### Test 9: Error Handling - AI Service Offline

**Goal:** Test graceful degradation when MS2 is down

1. [ ] Stop MS2 server
2. [ ] Navigate to Voice Order page
3. [ ] Should see "AI service unavailable" message
4. [ ] Record button should be disabled
5. [ ] Restart MS2
6. [ ] Refresh page
7. [ ] AI service should come back online

### Test 10: Error Handling - Network Error

**Goal:** Test network error handling

1. [ ] Start MS2
2. [ ] Navigate to Voice Order page
3. [ ] Record and send audio
4. [ ] While processing, stop MS2
5. [ ] Should see error message
6. [ ] "Try Again" button should be available
7. [ ] Restart MS2
8. [ ] Click "Try Again"
9. [ ] Should work normally

---

## Data Verification Tests

### Test 11: Order Data Integrity

After creating a voice order:

1. [ ] Check database directly:
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
   ```
2. [ ] Verify `shop_id` matches expected shop
3. [ ] Verify `status` is `PENDING_CONFIRMATION`
4. [ ] Verify `created_by` is the salesman's ID
5. [ ] Check order items:
   ```sql
   SELECT * FROM order_items WHERE order_id = [order_id];
   ```
6. [ ] Verify product variant IDs are correct
7. [ ] Verify quantities match what was spoken

### Test 12: Transcript Storage

1. [ ] Check the created order's `raw_transcript` field
2. [ ] Verify it contains the original speech-to-text output
3. [ ] Should not be null for voice orders

---

## Edge Cases

### Test 13: Empty Audio

1. [ ] Navigate to Voice Order page
2. [ ] Click microphone, immediately stop (0 seconds)
3. [ ] Try to send
4. [ ] Should show error: "Audio too short"

### Test 14: Very Long Audio

1. [ ] Record for 2+ minutes (if possible)
2. [ ] Try to send
3. [ ] Should handle gracefully or show size error

### Test 15: Session Timeout

1. [ ] Start voice order session
2. [ ] Wait 30+ minutes (session TTL)
3. [ ] Try to send audio
4. [ ] Should show "Session expired" error
5. [ ] Should offer to start new session

### Test 16: Rapid Fire Requests

1. [ ] Start session
2. [ ] Send audio immediately
3. [ ] Send reply immediately
4. [ ] Should handle without errors
5. [ ] Verify conversation state is maintained

---

## Cleanup

### Test 17: Session Cleanup

1. [ ] Start voice order session
2. [ ] Navigate away from page
3. [ ] Session should be terminated (check MS2 logs)
4. [ ] No orphaned sessions in memory

### Test 18: Test Data Cleanup

After testing:

1. [ ] Delete test orders from database
2. [ ] Verify no orphaned data
3. [ ] Reset any test shop/product data if modified

---

## Performance Tests

### Test 19: Response Time

1. [ ] Record short audio (5 seconds)
2. [ ] Measure time from "Send" to AI response
3. [ ] Should be < 30 seconds for first turn
4. [ ] Should be < 15 seconds for subsequent turns

### Test 20: Concurrent Users

1. [ ] Open 3 browser windows
2. [ ] Login as same salesman in all 3
3. [ ] Start voice order in each window
4. [ ] All should work independently
5. [ ] Sessions should not interfere with each other

---

## Final Verification

### Test 21: Complete Happy Path

Run the full flow one more time to ensure everything works:

1. [ ] Login
2. [ ] Navigate to Voice Order
3. [ ] Record: "Sharma Kirana Store ko 10 packet Aloo Bhujia 200 gram"
4. [ ] Send to AI
5. [ ] Confirm order
6. [ ] Verify in Orders list
7. [ ] Verify in Dashboard
8. [ ] Logout

**If all tests pass, the integration is complete and working.**

---

## Known Issues / Notes

- Session TTL is 30 minutes (configurable in MS2 `.env`)
- Audio file size limit is 25MB (configurable in MS1)
- CORS origins must match between MS1, MS2, and frontend
- MS2 requires Gemini API key for LLM functionality
- Whisper model size affects transcription accuracy and speed
