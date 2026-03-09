# LeadRadar Improvement Plan

## Context

The LeadRadar app currently crams everything (search, results, and saved leads) onto a single `/dashboard` page. The user wants:
1. Saved leads moved to their own page
2. Better overall UI/UX
3. Tooltip issues fixed on saved lead rows (icon buttons have no tooltips / unclear purpose)
4. New features where sensible
5. Security vulnerabilities identified and fixed

---

## Approach

### 1. Multi-Page Layout with Shared Navigation

**Current:** Single `/dashboard` page with everything  
**Proposed:** Split into two pages with a persistent header/nav:
- `/dashboard` — Search + Results + Stats (search workflow)
- `/dashboard/leads` — Saved Leads management (CRM-like view)

Create a shared `dashboard/layout.tsx` with:
- Persistent header with logo + navigation tabs (Search / Leads)
- Active tab highlighting
- Lead count badge on the "Leads" tab
- Theme toggle in header

### 2. Fix Tooltip Issues

The "tooltip" problem: icon buttons in saved leads rows (Email, Notes, Delete) have **no tooltips at all** — users don't know what each icon does. Additionally, the project has no Tooltip UI component.

**Fix:**
- Add a `Tooltip` component using `@base-ui/react/tooltip` (already available in the installed `@base-ui/react` package)
- Wrap all icon-only buttons (Email, Notes, Delete) with descriptive tooltips
- Also add tooltips in the results table for the same buttons

### 3. UI/UX Improvements

- **Toast notifications** — `sonner` is installed but never used. Add toasts for: save success/error, delete confirmation, status update, CSV export, copy-to-clipboard
- **Pagination** — Saved leads table fetches up to 100 but has no pagination UI; add prev/next pagination controls
- **Better empty/loading states** — More engaging empty state with illustration for the search page before any search is performed
- **Responsive polish** — Mobile-friendly navigation, better table scrolling with sticky first column
- **Confirmation dialog** — Replace `window.confirm()` for delete with a proper `Dialog`-based confirmation

### 4. New Features

- **Dashboard overview stats** on the leads page — total leads, leads by status, conversion rate, top cities
- **Bulk actions** on saved leads — select multiple leads, bulk delete, bulk status change
- **Search history** — Show recent searches below the search form (data already saved in `SearchHistory` table)

### 5. Security Vulnerabilities Found

| # | Vulnerability | Severity | Fix |
|---|---|---|---|
| 1 | **PATCH `/api/leads` doesn't validate input** — `updateLeadSchema` exists in `validations.ts` but is never used in the route handler. Arbitrary fields can be passed. | Medium | Apply `updateLeadSchema.safeParse(body)` before update |
| 2 | **SSRF via `/api/analyze`** — The endpoint accepts any URL and makes the server fetch it. Attacker can scan internal network (`http://localhost:*`, `http://169.254.169.254` for cloud metadata) | High | Add URL validation: block private IPs, localhost, metadata endpoints. Restrict to `http/https` schemes only |
| 3 | **No rate limiting** on API routes — An attacker can spam `/api/search` to drain Google Places API credits or use `/api/analyze` as a DDoS relay | Medium | Add basic in-memory rate limiting on search and analyze endpoints |
| 4 | **DELETE endpoint accepts any ID** without confirmation/validation — no Zod validation on the `id` param | Low | Validate ID format with Zod |
| 5 | **Error messages leak internal details** — `google-places.ts` and `website-analyzer.ts` forward raw error messages to client responses | Low | Sanitize error messages before returning to client |

---

## Files to Modify

### New Files
- `src/app/dashboard/layout.tsx` — Shared dashboard layout with nav
- `src/app/dashboard/leads/page.tsx` — Dedicated saved leads page
- `src/app/dashboard/leads/loading.tsx` — Loading skeleton for leads page
- `src/components/ui/tooltip.tsx` — Tooltip component (base-ui)
- `src/components/confirmation-dialog.tsx` — Reusable delete confirmation
- `src/components/recent-searches.tsx` — Recent search history widget
- `src/components/leads-overview-stats.tsx` — Stats cards for leads page
- `src/lib/rate-limit.ts` — Simple in-memory rate limiter

### Modified Files
- `src/app/dashboard/page.tsx` — Remove saved leads section, simplify; add recent searches
- `src/app/dashboard/loading.tsx` — Update skeleton for new layout
- `src/components/saved-leads-table.tsx` — Add tooltips, pagination, bulk actions, toast notifications, proper delete confirmation
- `src/components/results-table.tsx` — Add tooltips to action buttons, toast on save
- `src/components/email-generator.tsx` — Add tooltip to trigger button
- `src/components/search-form.tsx` — Minor UI polish
- `src/components/stats-cards.tsx` — Minor UI polish
- `src/app/api/leads/route.ts` — Apply Zod validation on PATCH, validate DELETE id
- `src/app/api/analyze/route.ts` — Add SSRF protection + rate limiting
- `src/app/api/search/route.ts` — Add rate limiting
- `src/app/api/leads/export/route.ts` — Pass active filters to export
- `src/app/layout.tsx` — Add `Toaster` from sonner

## Reuse

- **`@base-ui/react/tooltip`** — Already installed via `@base-ui/react` package for Tooltip component
- **`sonner`** — Already installed, just need to add `<Toaster />` in layout and use `toast()` calls
- **`src/lib/validations.ts`** — `updateLeadSchema` already exists but is unused; wire it into PATCH route
- **`src/components/ui/dialog.tsx`** — Reuse for confirmation dialog
- **`prisma` schema** — `SearchHistory` model already exists and is being populated; query it for recent searches
- **`src/lib/lead-scoring.ts`** — `getScoreColor`, `getScoreLabel` already used in both tables

---

## Steps

### Phase 1: Foundation (Layout + Navigation + Tooltip)
- [x] Create `src/components/ui/tooltip.tsx` using `@base-ui/react/tooltip`
- [x] Create `src/app/dashboard/layout.tsx` with persistent header, nav tabs (Search / Leads), and theme toggle
- [x] Move header out of `dashboard/page.tsx` into the shared layout
- [x] Add `<Toaster />` from sonner to `src/app/layout.tsx`

### Phase 2: Leads Page
- [x] Create `src/app/dashboard/leads/page.tsx` — move `SavedLeadsTable` here
- [x] Create `src/app/dashboard/leads/loading.tsx` — skeleton for leads page
- [x] Create `src/components/leads-overview-stats.tsx` — summary stats (total leads, by status, top cities)
- [x] Add API support: new endpoint or query param to get leads stats summary

### Phase 3: Fix Tooltips + UI Polish
- [x] Add tooltips to all icon buttons in `saved-leads-table.tsx` (Email, Notes, Delete)
- [x] Add tooltips to all icon buttons in `results-table.tsx` (Email, Website link)
- [x] Replace `window.confirm()` with a proper `ConfirmationDialog` component
- [x] Add toast notifications for save, delete, status update, export, copy-to-clipboard actions
- [x] Add pagination controls to `SavedLeadsTable`

### Phase 4: New Features
- [x] Create `src/components/recent-searches.tsx` — show last 5 searches from `SearchHistory`
- [x] Add recent searches widget to the dashboard search page
- [x] Add bulk selection + bulk actions (status change, delete) to saved leads table
- [x] Add API route for search history: `GET /api/search/history`

### Phase 5: Security Fixes
- [x] Apply `updateLeadSchema` validation in PATCH `/api/leads`
- [x] Add SSRF protection to `/api/analyze` (block private IPs, localhost, metadata URLs)
- [x] Create `src/lib/rate-limit.ts` — simple token-bucket rate limiter
- [x] Apply rate limiting to `/api/search` and `/api/analyze`
- [x] Validate DELETE id param format
- [x] Sanitize error messages in API responses

### Phase 6: Dashboard Page Polish
- [x] Update `dashboard/page.tsx` — remove saved leads section, add recent searches
- [x] Update `dashboard/loading.tsx` for new layout
- [x] Responsive polish: mobile navigation, better table scrolling

---

## Verification

1. **Navigation**: Click between Search and Leads tabs — verify active state, URL changes, no state loss
2. **Search flow**: Perform a search → see results + stats → save leads → navigate to Leads page → verify saved leads appear
3. **Tooltips**: Hover over every icon button in both tables — verify tooltip appears with correct label
4. **Delete flow**: Click delete → proper dialog appears (not browser confirm) → cancel works → confirm deletes + shows toast
5. **Toasts**: Verify toasts appear for: save, delete, status change, export, copy email
6. **Pagination**: Add >10 leads → verify pagination controls work, page state persists across filter changes
7. **Recent searches**: Perform searches → see them listed under the search form
8. **Bulk actions**: Select multiple leads → bulk status change, bulk delete works
9. **Security**: Test `/api/analyze` with `http://localhost:3000`, `http://169.254.169.254` — should be blocked
10. **Security**: Send malformed PATCH body — should be rejected with validation error
11. **Responsive**: Test on mobile viewport — navigation collapses, tables scroll horizontally
12. **Dark mode**: Verify all new components respect theme toggle
