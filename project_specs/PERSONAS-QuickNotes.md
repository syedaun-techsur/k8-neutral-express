# Personas — QuickNotes

**Product:** QuickNotes
**Version:** 1.0
**Date:** 2026-06-17
**Related PRD:** PRD-QuickNotes.md
**Status:** Active

---

> **Single-user product note:** QuickNotes has exactly one user — the person running the app. Personas here represent distinct **usage contexts and behavioral patterns** rather than different user types or roles. The same person may shift between contexts across the week. Persona differentiation drives UX decisions about which flows to optimize and which features carry the most weight.

---

## 1. Persona Summary

| PER-ID | Name | Usage Context | Primary Goal |
|--------|------|---------------|--------------|
| PER-01 | The Quick Capturer | On-the-go mobile capture | Jot a thought before it disappears — zero friction |
| PER-02 | The Focused Reviewer | Desktop triage and organization | Scan, search, pin, and clean up the note backlog |
| PER-03 | The Technical Deployer | App setup, deployment, and integration | Get the app running correctly in a containerized/iframe environment |

---

## 2. Persona Profiles

---

### PER-01: The Quick Capturer

**Role & Context:**
This is the user in motion — phone in hand, between meetings, mid-commute, or mid-thought. They have a fleeting idea, a URL to save, a task reminder, or a code snippet that must be captured in the next 10 seconds or it's gone. They open QuickNotes in a mobile browser (or embedded preview), type a title, optionally add a body, and hit save. They do not want to log in. They do not want to name a notebook. They just need the app to be there, load fast, and get out of the way.

This context defines the highest-frequency interaction with QuickNotes. Every second of friction — a login wall, a slow page load, an awkward touch target — directly threatens the core value proposition.

**Goals:**
- Get from blank screen to saved note in under 15 seconds (F2, F8)
- Never lose a thought to a failed save or page reload (F5, F7)
- Operate entirely one-handed on a 375 px wide screen with no pinching or horizontal scrolling (F8, F9)
- Skip any setup, configuration, or account management entirely (F7, F9)

**Pain Points (from PRD §2):**
- Mobile-unfriendly layouts force zooming and mis-taps on small screens
- Authentication flows kill momentum — by the time a login completes, the thought is gone
- Apps that require manual setup (database migrations, config files) cannot be deployed for quick personal use
- Heavyweight tools with sharing surfaces and AI panels add visual noise that slows down capture

**Technical Expertise:** Low-to-moderate — comfortable with mobile browsers, not interested in dev tools or terminal commands in this context

**Top Tasks:**
1. Open the app and create a new note with a title (daily, critical — F2)
2. Quickly scan the note list to confirm a note was saved (daily, high — F0)
3. Pin an important note so it stays at the top of the list (as-needed, medium — F2, F3)
4. Edit a note body to add detail captured moments after the initial save (as-needed, medium — F3)

**Success Criteria:**
- Can create a titled note in under 15 seconds from a cold page load on a 375 px mobile viewport
- All tap targets (Save button, title field, nav links) register without mis-tap on first touch
- Saved note appears at the top of the list immediately after redirect, requiring zero additional action
- App loads and is interactive within 10 seconds of process start (NFR: Availability)

---

### PER-02: The Focused Reviewer

**Role & Context:**
This is the same user, but now seated at a desk with a larger screen and a few minutes to spare. The capture backlog has grown — a dozen notes from the past week. Some need editing, some can be deleted, and a few important ones should be pinned. The Focused Reviewer wants to scan the list quickly, use the search box to locate a specific note by a keyword they remember, and do light triage (edit body, toggle pin, delete stale notes).

This context drives the value of a clean, scannable list and a fast search experience. Without these, notes pile up into an unusable list and the app loses its "find it again" promise.

**Goals:**
- Locate a specific note by partial title keyword without scrolling through the entire list (F1)
- Triage and clean up the backlog: pin what matters, delete what doesn't (F3, F4, F0)
- Edit a note body to add context or corrections after the fact (F3)
- Trust that pinned notes will always be at the top on the next visit (F0, F3)

**Pain Points (from PRD §2):**
- No lightweight app surfaces a search box without requiring an account or cloud sync
- Existing tools introduce unnecessary sharing/collaboration surfaces that clutter the review experience
- Without a pinning mechanism, important notes get buried under newer ones

**Technical Expertise:** Moderate — comfortable with web apps, keyboard shortcuts, and form interactions; not interested in API calls or server config during this session

**Top Tasks:**
1. Type a partial title into the search box to filter the note list (as-needed, critical — F1)
2. Open a note and update its body with new information (weekly, high — F3)
3. Toggle the pinned status on a note to elevate or demote its priority (weekly, medium — F3)
4. Delete an outdated note with a confirmation step (weekly, medium — F4)
5. Scan the sorted list (pinned-first, newest-first) to assess what needs attention (weekly, high — F0)

**Success Criteria:**
- Search filters the list in real time with no perceptible lag as characters are typed
- Filtered results always maintain pinned-first, newest-first sort order (not random)
- Can open, edit, and save a note in under 3 interactions from the list view
- Delete confirmation prevents accidental loss without requiring more than 2 taps to confirm

---

### PER-03: The Technical Deployer

**Role & Context:**
This is the user — or a technically-minded version of the user — setting up QuickNotes for the first time. They are working inside a containerized development environment where the app must run on `0.0.0.0:3000`, render inside an iframe preview pane, and connect to a PostgreSQL instance via `DATABASE_URL`. They are not configuring a production system for thousands of users; they are deploying a personal tool and want the entire setup to be automatic and repeatable.

This context surfaces only at initial deployment and after major environment changes (new container, new database, server restart). It is low-frequency but high-stakes: if the app fails to start correctly here, nothing else matters. The Technical Deployer is also the implicit audience for the health endpoint (`GET /api/health`), which signals that the app is alive and the migration completed.

**Goals:**
- Start the app with only a `DATABASE_URL` environment variable and have everything else work automatically (F7, F9)
- Confirm the app is healthy after startup without manually querying the database (F6)
- Embed the app in an iframe preview without hitting frame-blocking headers or CSP errors (F9, F8)
- Restart the server without losing data or triggering migration errors (F7)

**Pain Points (from PRD §2):**
- Setup friction (manual database migrations, hard-coded credentials) prevents quick, repeatable deployment
- No lightweight app runs cleanly inside an iframe-based preview environment without CSP configuration
- Port binding to `localhost` instead of `0.0.0.0` makes apps unreachable from container networking

**Technical Expertise:** High — comfortable with Docker, environment variables, container networking, browser DevTools, and REST API testing

**Top Tasks:**
1. Verify the health endpoint returns `200 {"status":"ok"}` after container start (deployment, critical — F6)
2. Confirm the `notes` table was created automatically without running any SQL manually (deployment, critical — F7)
3. Check browser console and network tab to confirm no frame-blocking errors when embedded in iframe (deployment, high — F9)
4. Test all five REST endpoints directly (e.g., via `curl` or Postman) to validate API correctness (deployment, medium — F5)
5. Restart the server and confirm existing notes survive and migration re-runs without errors (maintenance, high — F7)

**Success Criteria:**
- App reaches healthy state (health endpoint `200`) within 30 seconds of container start, providing only `DATABASE_URL`
- Zero manual SQL commands required to initialize the database schema
- No `SecurityError`, blank page, or frame-blocking console warnings when embedded in a cross-origin iframe
- Server restart produces identical note list and zero migration errors in logs

---

## 3. Persona Relationships

Since QuickNotes is a single-user product, these "relationships" describe how the same user transitions between behavioral contexts during a typical usage lifecycle.

| From | To | Trigger | Interaction |
|------|----|---------|-------------|
| PER-03 (Technical Deployer) | PER-01 (Quick Capturer) | App is healthy; first note to write | Deployer becomes active user immediately after confirming startup |
| PER-01 (Quick Capturer) | PER-02 (Focused Reviewer) | Backlog grows; need to find a specific note | Quick capture sessions accumulate notes that require triage |
| PER-02 (Focused Reviewer) | PER-01 (Quick Capturer) | Triage complete; back to capture mode | Reviewer returns to capture mode after clearing the backlog |
| PER-02 (Focused Reviewer) | PER-03 (Technical Deployer) | Environment change, redeployment needed | User re-enters technical context to redeploy or migrate |

The dominant day-to-day loop is **PER-01 ↔ PER-02**. PER-03 is an infrequent but high-priority context that gates all others.

---

## 4. Feature-Persona Matrix

| Feature | Description | PER-01 Quick Capturer | PER-02 Focused Reviewer | PER-03 Technical Deployer |
|---------|-------------|-----------------------|-------------------------|---------------------------|
| **F0** | Note List View | Primary | Primary | Secondary |
| **F1** | Note Search / Filter | Secondary | Primary | None |
| **F2** | Create Note | Primary | Secondary | None |
| **F3** | Edit Note | Secondary | Primary | None |
| **F4** | Delete Note | None | Primary | None |
| **F5** | REST API | None | None | Primary |
| **F6** | Health Endpoint | None | None | Primary |
| **F7** | Auto-Migration on Startup | Primary | Secondary | Primary |
| **F8** | Mobile-First UI & Design System | Primary | Secondary | Secondary |
| **F9** | Iframe Compatibility & Port Binding | Primary | None | Primary |

**Legend:** Primary = core to this context's success · Secondary = used but not the defining need · None = not relevant in this context

---

## 5. Coverage Check

| Validation | Status |
|------------|--------|
| All PRD target users have a persona (PER-XX) | ✅ PRD §2 identifies "developers and individuals in embedded environments" — covered by PER-01, PER-02, PER-03 |
| Each persona has all required subsections | ✅ Role & Context, Goals, Pain Points, Technical Expertise, Top Tasks, Success Criteria |
| Goals trace back to PRD features/success metrics | ✅ All goals cite F0–F9 feature IDs |
| Pain points trace back to PRD §2 Problem Statement | ✅ All pain points reference PRD §2 bullets |
| Feature-Persona Matrix covers all PRD features (F0–F9) | ✅ 10 features × 3 personas mapped |
| No persona is a clone of another (distinct needs) | ✅ PER-01 = speed/mobile, PER-02 = search/triage, PER-03 = infra/deployment |
| 2–4 personas total | ✅ 3 personas |

---

*PERSONAS generated: 2026-06-17 | Product: QuickNotes v1.0 | Derived from: PRD-QuickNotes.md*
