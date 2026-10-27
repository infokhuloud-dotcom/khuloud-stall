# Khuloud Stall billing

A website the stall staff open on their phones. Tap the products a customer bought, type the amount, and show the QR. The customer scans it and WhatsApp opens with a message to Khuloud (+91 83681 32033) listing their order and the amount they paid. They press send, and you have their number.

- No prices in the app. Staff type the final amount for every sale, so negotiation is fine.
- No discount codes.
- It works without signal. Sales are saved on the phone and upload to the Google Sheet when the internet comes back.
- Every sale gets an order number like `DM-K7-014` (event, phone code, number). It's in the WhatsApp message and in the Sheet, so you can match the two.

## Google Sheet (one-time, about 3 minutes)
1. Make a new Google Sheet, e.g. "Khuloud Stall Sales".
2. Extensions → Apps Script. Delete what's there and paste everything from `google-sheet-script.gs`. Save.
3. Deploy → New deployment → gear icon → **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, then allow access with your Google account.
4. Copy the **Web app URL** (ends in `/exec`).
5. In the app: Setup → paste it under "Google Sheet link" → Save → **Test Sheet** should say "Sheet connected ✓".
6. Press **Copy setup link for other staff** and send that link to your staff's WhatsApp group. When they open it, the event, number and Sheet are filled in. They only type their name.

## Each staff phone
- Open the link in Chrome (Android) or Safari (iPhone), then **Add to Home Screen**. Open it once while online so it saves itself for offline use.
- Setup → type your name → Save.

## Files
`index.html`, `app.js` (app), `catalog.js` (products, edit here to add or remove), `sw.js` (offline), `google-sheet-script.gs` (paste into the Sheet).
