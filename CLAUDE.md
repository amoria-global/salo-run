# Connekyt Dashboard — Project Instructions

> Shared rules (repo map, deploy paths, UI design directive, commit and prose
> conventions) live in `~/.claude/CLAUDE.md` and load automatically. This file only
> carries what is specific to this repo.

Next.js app, internally "salo-run", served at `dashboard.connekyt.com`. It is the signed-in
surface for photographers, clients, coordinators and admins. The landing repo (knockout) is
the signed-out surface; keep shared flows consistent between the two.

## Calling the backend

Browser requests go through `app/api/proxy/[...path]` rather than straight to
`backend.connekyt.com`, so the auth cookie is attached server side. When you add a backend
call, route it the same way instead of introducing a direct fetch.

## Gates that block whole sections

Several areas refuse to render until a server-side condition is met, and the checks live in
layouts rather than in the pages themselves. Before concluding a page is broken, look for
the gate above it.

- `app/user/photographer/layout.tsx` gates every `/user/photographer/**` route on profile
  completion and redirects to the profile page.
- Withdrawal needs KYC approved, a withdrawal method owned by the customer, and an active
  wallet. The backend enforces all three; the UI must not imply otherwise.

Profile completion percentage is computed by the backend
(`PhotographerCompletionService`). If you change which fields the UI collects, check that
the same fields are the ones the score counts, or users get stuck below 100 forever.

## Verifying a deploy

This app prerenders an empty client-rendered shell, so `curl | grep` proves nothing. Check
the server checkout's HEAD and the `.next/BUILD_ID` mtime, grep the compiled chunks under
`.next`, or load the page in a browser and read the DOM.
