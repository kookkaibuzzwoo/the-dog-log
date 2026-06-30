# The Dog Log — Tech Talk Speaker Notes

**Duration:** 30 minutes | **Presenter:** kookkai | **Date:** Feb 2026

---

## Timing Overview

| Slide | Topic | Time | Cumulative |
|-------|-------|------|------------|
| 1 | Title & Intro | 2 min | 2 min |
| 2 | Agenda | 1 min | 3 min |
| 3 | The Problem | 3 min | 6 min |
| 4-5 | Live Demo | 10 min | 16 min |
| 6-9 | Architecture Deep Dive | 8 min | 24 min |
| 10-11 | Cool Features | 3 min | 27 min |
| 12 | Variants | 1 min | 28 min |
| 13-14 | Lessons Learned | 2 min | 30 min |
| 15 | Q&A | remaining | — |

---

## Slide 1: Title (2 min)

**Key points:**
- Welcome everyone, introduce yourself
- "The Dog Log — a project that started as a simple pet medication tracker and grew into a surprisingly capable office tool"
- The hook: "The entire app ships as a single HTML file with zero build process"
- Preview what's coming in the next 30 minutes

**Transition:** "Let me show you the roadmap..."

---

## Slide 2: Agenda (1 min)

**Key points:**
- Walk through the 5 sections quickly
- Set expectations: "We'll start with the story, jump into a live demo, then get technical"
- Note the timing so people know when Q&A is

**Transition:** "Let's start with the problem we were trying to solve..."

---

## Slide 3: The Problem (3 min)

**Key points:**
- Office dogs — keeping track of medications and bills was chaos
- Real quotes from Slack: "Who gave Nexgard?" "Is the vet bill paid?"
- The constraints drove the design:
  - Must work instantly (no install, no setup)
  - Must be shareable (just send the HTML file)
  - Must sync across devices (Firebase)
  - Must work offline (localStorage fallback)

**Transition:** "Enough talking — let me show you what we built..."

---

## Slide 4-5: Live Demo (10 min)

**SWITCH TO BROWSER — open index.html**

**Demo flow:**

1. **Medication Tracking** (3 min)
   - Show the main dashboard with dog cards
   - Add a new dog — show how the name prompt works
   - Give medication — click the button, show it records who + when
   - Point out color coding: green (OK), yellow (soon), red (overdue)
   - Show the activity log

2. **Bill Management** (2 min)
   - Switch to Bills tab
   - Add a new bill
   - Show invoice scanning — upload a receipt photo
   - Walk through OCR process (takes a few seconds)
   - Show scanned items become bills automatically

3. **Invoice Scanning** (2 min)
   - Upload a Thai invoice image
   - Show preprocessing (image gets enhanced)
   - Watch Tesseract.js extract text
   - Show parsed items with amounts

4. **Cash Advance Form** (1 min)
   - Select some bills
   - Generate the Excel form
   - Open downloaded file to show formatting

5. **Settings** (2 min)
   - Show Firebase sync status
   - Show Slack webhook setup
   - Send a test notification
   - Show medication type customization

**Tips:**
- Have a test invoice image ready
- Pre-configure the Slack webhook so the test notification works
- Have Chrome DevTools Network tab open to show Firebase requests

**Transition:** "Now let's look under the hood..."

---

## Slide 6: Under the Hood — Section Divider (15 sec)

Quick transition. Just say: "Now let's look at how this all fits together technically."

---

## Slide 7: Tech Stack (2 min)

**Key points:**
- ~1,350 lines of code in a single HTML file
- Frontend: React 18, Babel Standalone (compiles JSX in browser), Tailwind
- Services: Firebase Realtime DB, Tesseract.js, SheetJS
- "Everything is loaded from CDN. No package.json, no node_modules, no webpack."
- Trade-off: slightly slower initial load, no tree-shaking. Benefit: zero setup friction.

**Transition:** "Let me show you what I mean by single-file architecture..."

---

## Slide 8: Single-File Architecture (2 min)

**Key points:**
- Left side: Traditional React = 6 steps just to deploy
- Right side: The Dog Log = 1 step. Open the file. Done.
- How it works: CDN handles deps, Babel compiles in browser, localStorage for persistence
- The trade-off: "A few hundred milliseconds delay for Babel compilation. Totally acceptable for a tool like this."

**Transition:** "The storage architecture is something I'm particularly proud of..."

---

## Slide 9: Hybrid Storage Strategy (2 min)

**Key points:**
- Offline-first: localStorage is both primary store AND fallback
- Flow: localStorage ↔ React State ↔ Firebase
- Debounced saves: 500ms wait before writing to Firebase (saves costs!)
- Auto-backup: every Firebase save also writes to localStorage
- Graceful degradation: if Firebase dies, app keeps working

**Transition:** "Let me deep-dive into the OCR feature..."

---

## Slide 10: OCR Invoice Scanning (3 min)

**Key points:**
- 6-step pipeline: Upload → Preprocess → OCR → Parse → Extract → Create Bills
- Preprocessing is key: 2x upscale, grayscale, contrast boost, binarization
- Without preprocessing: ~60% accuracy. With: 85-90%
- Smart parsing: Thai keyword detection finds product table boundaries
- Fallback: if smart parsing fails, regex catches what it can
- Optimized for Thai invoices (฿ currency, Thai formatting)

**Transition:** "The Slack integration completes the picture..."

---

## Slide 11: Slack Notifications (2 min)

**Key points:**
- Configure a Slack incoming webhook (2 min setup)
- Sends alerts only when items are overdue or upcoming
- Uses Slack Block Kit for rich formatting
- Color coded: red for overdue, yellow for upcoming
- Smart: no noise when everything is fine

---

## Slide 12: 8 Variants (1 min)

**Key points:**
- 8 HTML variants, each for a different use case
- Main (full features), Standalone, Excel-focused, Firebase-only, Team, Google Sheets, File System, React component
- "Pick the variant that fits. Don't need OCR? Use the simple version."
- ~7,900 total lines across all variants

**Transition:** "Let me share some honest lessons..."

---

## Slide 13: Lessons Learned — Section Divider (15 sec)

Quick transition.

---

## Slide 14: Key Takeaways (3 min)

**Key points:**

1. **No-build has real advantages** for internal tools. Zero friction = adoption.
2. **Be careful with credentials** in client-side code. Firebase security rules are a must.
3. **Mobile-first pays off**. 44px touch targets = people used it on phones from day one.
4. **OCR is amazing but messy**. Image preprocessing is what makes it actually work.

---

## Slide 15: Q&A (remaining time)

**Common questions to prepare for:**

- **"Why not use a proper backend?"** — Firebase is enough for this use case. A backend adds deployment complexity for no benefit.
- **"What about security?"** — Firebase security rules. The API key being public is fine IF rules are configured properly.
- **"Could you use this pattern for bigger apps?"** — Yes, up to ~2,000 lines. Beyond that, you want proper imports and build tools.
- **"What's next?"** — Considering push notifications via service worker, and PWA manifest for native-like mobile experience.

---

## Pre-Talk Checklist

- [ ] Open `index.html` in Chrome (not from file://, use a local server if Firebase needs it)
- [ ] Add 2-3 test dogs with some medications logged
- [ ] Add a few test bills (some paid, some unpaid)
- [ ] Have a Thai invoice image ready for OCR demo
- [ ] Configure Slack webhook and test it
- [ ] Have Chrome DevTools ready but minimized
- [ ] Test the projector / screen share
- [ ] Have the presentation open in PowerPoint alongside the browser
