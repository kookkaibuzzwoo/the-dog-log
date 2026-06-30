# The Dog Log - Project Guide

## File Conventions

When making changes, always confirm the target file with the user before editing. The main entry point is `index.html`, not auxiliary files like `dog-log-excel.html`.

For UI/styling changes, always sync changes across related files (e.g., if editing a component in one HTML file, check if the same component exists in index.html).

## External Resources

Before fetching URLs or accessing external resources, ask the user if authentication is required or if they have a local copy.

## Overview

Pet medication and bill tracking web application built with React. Browser-based SPA with no build process required.

## Quick Start

Open any `.html` file directly in a modern browser (Chrome/Firefox/Safari). No server or build tools needed.

## File Variants

| File | Use Case |
|------|----------|
| `index.html` | Main app with Firebase real-time sync |
| `the-dog-log.html` | Standalone with localStorage + OCR |
| `dog-log-autosave.html` | File system persistence via File Picker API |
| `dog-log-excel.html` | Excel import/export with SheetJS |
| `dog-log-gsheet.html` | Google Sheets integration |
| `dog-tracker-team.html` | Multi-user team version |
| `dog-medication-tracker.html` | Simplified version |

## Tech Stack

- **React 18.2** + **Babel** (browser-compiled JSX)
- **Tailwind CSS** for styling
- **Firebase Realtime Database** (optional cloud sync)
- **Tesseract.js** (OCR for invoice scanning)
- **SheetJS** (Excel import/export)
- All dependencies loaded via CDN - no npm/node_modules

## Architecture

### State Management
- Functional components with `useState`, `useEffect`, `useRef`
- Local state only (no Redux/Context)
- Auto-save with 500ms debounce

### Data Models

```javascript
// Dog
{ id: number, name: string, [medId]: { lastGiven: "YYYY-MM-DD", givenBy: string } }

// Bill
{ id: number, description: string, amount: number, dueDate: "YYYY-MM-DD", paid: boolean }

// Medication Type
{ id: string, name: string, interval: number, icon: emoji }
```

### Storage
- Primary: `localStorage` (key: `dogLog_backup`)
- Optional: Firebase Realtime Database for cloud sync

## Key Features

- Add/remove dogs and track medications
- Log medication dates with user attribution
- Customizable medication types with intervals
- Bill tracking with payment status
- Invoice generation (HTML/TXT)
- Activity/audit log
- Alerts for upcoming medications and overdue bills

## Common Tasks

### Testing Changes
1. Open HTML file in browser
2. Use DevTools console to inspect state
3. Check localStorage: `localStorage.getItem('dogLog_backup')`

### Adding New Medication Types
Edit the `MEDICATION_TYPES` array in the relevant HTML file:
```javascript
{ id: 'newmed', name: 'New Med', interval: 30, icon: '💊' }
```

### Firebase Setup
Firebase credentials are embedded in `index.html`. To use your own:
1. Create Firebase project
2. Enable Realtime Database
3. Update config object in HTML
4. Set security rules for authenticated access

## UI Patterns

- Tab navigation: Medications | Bills | Activity
- Color-coded status: green (OK), yellow (soon), red (overdue)
- Mobile-first responsive design
- 44px minimum touch targets for accessibility

## Debugging

- Console logs for Firebase sync events
- Network tab for Firebase requests
- localStorage inspector for local data
- Sync status indicator in UI (Firebase versions)
