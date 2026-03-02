# Backend Endpoint Report

**Tested:** 2026-03-02
**Server:** `http://197.243.24.101`

Not fixed. All issues remain exactly the same:

| Endpoint | Status |
|---|---|
| `DELETE photographer/notifications/{id}` | ❌ Hangs/timeout |
| `DELETE customer/notifications/{id}` | ❌ Hangs/timeout |
| `DELETE coordinator/notifications/{id}` | ❌ Hangs/timeout |
| `DELETE photographer/notifications/delete-read` | ❌ Hangs/timeout |
| `DELETE customer/notifications/delete-read` | ❌ Hangs/timeout |
| `DELETE coordinator/notifications/delete-read` | ❌ Hangs/timeout |
| `DELETE photographer/plans/{id}` | ❌ Hangs/timeout |
| `PUT photographer/preferences/{key}` | ❌ Hangs/timeout |
| `PUT customer/preferences/{key}` | ❌ Hangs/timeout |
| `PUT coordinator/preferences/{key}` | ❌ Hangs/timeout |
| `PUT coordinator/profile` | ❌ Hangs/timeout |
| `PUT customer/profile` | ❌ Hangs/timeout |
| `PUT coordinator/events/{id}` | ❌ Hangs/timeout |
| `PUT customer/events/{id}` | ❌ Hangs/timeout |
| `PUT coordinator/galleries/{id}` | ❌ Hangs/timeout |
| `PUT customer/albums/{id}` | ❌ Hangs/timeout |
| `PUT coordinator/archives/{id}` | ❌ Hangs/timeout |
| `PUT customer/archives/{id}` | ❌ Hangs/timeout |
| `PUT chat/messages/{id}` | ❌ Hangs/timeout |
| `PUT photographer/plans/{id}` | ❌ Hangs/timeout |
| `POST coordinator/galleries` (with image files) | ❌ Hangs/timeout |

GET endpoints all return 200 — server is up, issue is isolated to all write/mutating operations.
