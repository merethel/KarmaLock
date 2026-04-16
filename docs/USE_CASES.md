# KarmaLock — Use cases

Track implementation by ticking boxes as you complete each flow.

---

## Todo's

[ ] the online mark to show if server is up
[ ] the flicking of keyboeard when typing on login page

## Onboarding & auth

### UC-01: Complete onboarding

|           |                                                             |
| --------- | ----------------------------------------------------------- |
| **Actor** | First-time user (not logged in)                             |
| **Goal**  | Understand what KarmaLock does and continue toward the app. |

**Main success scenario**

1. [ ] User opens the app and sees the onboarding flow.
2. [ ] User reads/swipes through key messages (value proposition, locking/scanning).
3. [ ] User taps to continue and reaches login or registration entry.

---

### UC-02: Log in

|           |                                |
| --------- | ------------------------------ |
| **Actor** | Registered user                |
| **Goal**  | Access their account and data. |

**Main success scenario**

1. [ ] User opens the login screen.
2. [ ] User enters valid credentials and submits.
3. [ ] System authenticates the user.
4. [ ] User is taken to home/dashboard.

---

### UC-02B: Two-factor authentication (2FA) — _future / higher risk_

|           |                                                                                         |
| --------- | --------------------------------------------------------------------------------------- |
| **Actor** | Registered user (when org policy or user enables 2FA)                                   |
| **Goal**  | Add a second factor after password so stolen passwords alone cannot access the account. |

**Scope:** Planned for a later phase when KarmaLock faces higher risk (more sensitive data, compliance, or abuse). Not required for the first MVP.

**Main success scenario**

1. [ ] User enables 2FA in security settings (e.g. authenticator app / TOTP, or SMS if offered).
2. [ ] System shows backup/recovery codes; user stores them safely.
3. [ ] On login, after correct email and password, user is prompted for the second factor (e.g. 6-digit code).
4. [ ] System verifies the code; only then is the session issued.
5. [ ] User can use a recovery code if their second factor is unavailable (per product rules).

**Extensions (optional / future)**

- [ ] Admin or policy can require 2FA for certain roles (e.g. police / organisation accounts).
- [ ] Trusted devices: skip second factor for a limited time on known devices only if product allows it.

---

## Forside & dashboard

### UC-03: Open home (Forside) and start scanning

|           |                                              |
| --------- | -------------------------------------------- |
| **Actor** | Logged-in user                               |
| **Goal**  | Quickly start scanning from the main screen. |

**Main success scenario**

1. [ ] User lands on Forside after login.
2. [ ] User sees a prominent **Scan** action.
3. [ ] User taps **Scan** and is taken to the scan flow (UC-08 / UC-09).

---

### UC-04: View dashboard overview

|           |                                                  |
| --------- | ------------------------------------------------ |
| **Actor** | Logged-in user                                   |
| **Goal**  | See a summary of locked assets and key statuses. |

**Main success scenario**

1. [ ] User opens the dashboard.
2. [ ] User sees top summary: **Beskyttet**, **Stjålet**, **Samlet værdi**.
3. [ ] User sees overview of registered/locked items (list or cards).
4. [ ] User can open item details.

---

### UC-05: Save and review locked items

|           |                                                   |
| --------- | ------------------------------------------------- |
| **Actor** | Logged-in user                                    |
| **Goal**  | Keep track of what is locked and review it later. |

**Main success scenario**

1. [ ] User has previously locked or registered items.
2. [ ] On the dashboard, user sees saved items and status.
3. [ ] User can select an item for details.

---

### UC-06: Transfer an item to another person

|           |                                            |
| --------- | ------------------------------------------ |
| **Actor** | Owner of an asset                          |
| **Goal**  | Hand ownership or custody to someone else. |

**Main success scenario**

1. [ ] User opens dashboard and selects an item.
2. [ ] User chooses **Overfør til andre** (or equivalent).
3. [ ] User specifies recipient (per product rules: user, invite, link, etc.).
4. [ ] System records transfer and updates views for both parties.

---

### UC-06A: Initiate transfer (send invite)

|           |                                                |
| --------- | ---------------------------------------------- |
| **Actor** | Owner of an asset                              |
| **Goal**  | Create a pending transfer and notify recipient |

**Main success scenario**

1. [ ] User opens an item and chooses **Overfør**.
2. [ ] User selects how to identify the recipient (e.g. email/phone/username).
3. [ ] User reviews what will transfer (ownership, access, photos/docs, history, etc. per product rules).
4. [ ] System re-checks user is the owner (and re-auths if required by policy).
5. [ ] System creates a **pending** transfer with an expiry time.
6. [ ] System notifies the recipient and confirms to the sender.

**Extensions / exceptions**

1. [ ] Recipient not found → system offers an invite flow or blocks (per product rules).
2. [ ] Item already has a pending transfer → system blocks or replaces the pending one (per product rules).
3. [ ] Too many attempts → system rate-limits and shows a cooldown message.
4. [ ] Network failure → retry is safe and does not create duplicates (idempotent).

---

### UC-06B: View pending transfer (sender)

|           |                                                     |
| --------- | --------------------------------------------------- |
| **Actor** | Sender (current owner)                              |
| **Goal**  | See status, expiry, and allowed actions while pending |

**Main success scenario**

1. [ ] Sender opens the item with a pending transfer.
2. [ ] System shows transfer status (**Afventer**), recipient hint (minimal PII), and expiry.
3. [ ] System shows available actions (e.g. cancel, resend) per product rules.

---

### UC-06C: Cancel transfer (sender)

|           |                                           |
| --------- | ----------------------------------------- |
| **Actor** | Sender (current owner)                    |
| **Goal**  | Stop a pending transfer before acceptance |

**Main success scenario**

1. [ ] Sender opens the pending transfer and chooses **Annuller overførsel**.
2. [ ] System confirms the action (and re-checks sender is still owner).
3. [ ] System marks the transfer as **annulleret**.
4. [ ] System updates sender UI and (optionally) notifies recipient.

**Extensions / exceptions**

1. [ ] Recipient accepted simultaneously → cancel fails; system shows final status (**accepteret**) and updates UI.

---

### UC-06D: Accept transfer (recipient)

|           |                                           |
| --------- | ----------------------------------------- |
| **Actor** | Recipient (intended new owner)             |
| **Goal**  | Become the new owner of the asset          |

**Main success scenario**

1. [ ] Recipient opens the transfer notification / deep link.
2. [ ] System requires login if not authenticated.
3. [ ] System shows a review screen (sender identity, item name, what transfers).
4. [ ] Recipient taps **Acceptér**.
5. [ ] System atomically transfers ownership, marks transfer **accepteret**, and records a history/audit event.
6. [ ] System notifies sender and shows success to recipient.

**Extensions / exceptions**

1. [ ] Wrong account is logged in → system asks recipient to switch account; no item details are revealed beyond minimal text.
2. [ ] Transfer expired/canceled/declined → system shows status and prevents acceptance.
3. [ ] Duplicate accept attempts → system treats retries safely and returns “already accepted”.

---

### UC-06E: Decline transfer (recipient)

|           |                                  |
| --------- | -------------------------------- |
| **Actor** | Recipient                         |
| **Goal**  | Refuse the transfer               |

**Main success scenario**

1. [ ] Recipient opens the transfer invite.
2. [ ] Recipient taps **Afvis**.
3. [ ] System marks transfer **afvist** and records a history/audit event.
4. [ ] System notifies sender and shows confirmation to recipient.

---

### UC-06F: Expire transfer (system)

|           |                                   |
| --------- | --------------------------------- |
| **Actor** | System (scheduled / background)   |
| **Goal**  | Close unaccepted transfers safely |

**Main success scenario**

1. [ ] Transfer reaches expiry while still pending.
2. [ ] System marks transfer **udløbet** and records a history/audit event.
3. [ ] System updates sender and recipient views (and sends notifications if enabled).

---

### UC-06G: Resend transfer invite (sender)

|           |                                 |
| --------- | ------------------------------- |
| **Actor** | Sender                           |
| **Goal**  | Remind recipient about transfer  |

**Main success scenario**

1. [ ] Sender opens a pending transfer and chooses **Send igen**.
2. [ ] System rate-limits resend attempts.
3. [ ] System sends a new notification pointing to the same pending transfer.
4. [ ] System records “reminder sent” (optional) and updates UI.

---

### UC-06H: Privacy protection for transfer invites

|           |                                                       |
| --------- | ----------------------------------------------------- |
| **Actor** | Any user opening the invite link (including attacker) |
| **Goal**  | Prevent data leakage before acceptance                 |

**Main success scenario**

1. [ ] Someone opens a transfer invite link.
2. [ ] System requires login.
3. [ ] If logged-in user is not the intended recipient, system shows a generic message and does not reveal item details.

---

### UC-07: Search assets on dashboard

|           |                               |
| --------- | ----------------------------- |
| **Actor** | Logged-in user                |
| **Goal**  | Find a specific item quickly. |

**Main success scenario**

1. [ ] User focuses **Søgefelt** on the dashboard.
2. [ ] User types query (name, id, tag, etc.).
3. [ ] System filters to matching items.
4. [ ] User selects a result for details or actions.

---

## Scan

### UC-08: Scan an item (general user)

|           |                                                          |
| --------- | -------------------------------------------------------- |
| **Actor** | Logged-in user                                           |
| **Goal**  | Read NFC/tag/QR (as designed) and see linked asset info. |

**Main success scenario**

1. [ ] User opens scan screen and taps **Scan**.
2. [ ] System reads identifier from physical item.
3. [ ] System loads and displays asset information.
4. [ ] User can leave or use allowed follow-up actions (e.g. history — UC-10).

---

### UC-09: Police scans and views information

|           |                                                                |
| --------- | -------------------------------------------------------------- |
| **Actor** | Police (or role with read access)                              |
| **Goal**  | With minimal taps, see clear information about a scanned item. |

**Main success scenario**

1. [ ] Officer opens scan screen.
2. [ ] Officer taps **Scan** (single clear primary action).
3. [ ] System shows **oplysninger** in a read-first layout (status, stolen, owner hints — per policy).
4. [ ] Officer can open **Historik** for that item (UC-10).

---

### UC-10: View scan history for an item

|           |                                           |
| --------- | ----------------------------------------- |
| **Actor** | User with permission (e.g. owner, police) |
| **Goal**  | See past scans/events for that thing.     |

**Main success scenario**

1. [ ] User is on scan result or item detail for a scanned item.
2. [ ] User opens **Historik**.
3. [ ] System shows chronological scan events (and other events you define).
4. [ ] User can return to current view.

---

## Register new asset

### UC-11: Start registering a new asset

|           |                                                       |
| --------- | ----------------------------------------------------- |
| **Actor** | Logged-in user                                        |
| **Goal**  | Begin multi-step registration of a new physical item. |

**Main success scenario**

1. [ ] User taps **Registrer** (from dashboard or entry point).
2. [ ] System starts registration wizard (5 steps; UC-12–UC-16).
3. [ ] User sees clear progress through steps.

---

### UC-12: Capture three photos of the object

|           |                               |
| --------- | ----------------------------- |
| **Actor** | User registering an asset     |
| **Goal**  | Provide visual documentation. |

**Main success scenario**

1. [ ] User reaches photo step in registration.
2. [ ] User captures or selects **three** images (e.g. front, detail, serial/markings).
3. [ ] System stores images; user can retake before continuing.

---

### UC-13: Learn how to add an NFC chip

|           |                                                    |
| --------- | -------------------------------------------------- |
| **Actor** | User registering an asset                          |
| **Goal**  | Understand how to attach or associate an NFC chip. |

**Main success scenario**

1. [ ] User reaches NFC instruction step.
2. [ ] User reads instructions (and optional illustrations).
3. [ ] User continues when ready (chip may be added later — UC-16).

---

### UC-14: Analyze asset details with AI or manually

|           |                                                          |
| --------- | -------------------------------------------------------- |
| **Actor** | User registering an asset                                |
| **Goal**  | Fill structured fields with less typing or full control. |

**Main success scenario**

1. [ ] After photos, user chooses **AI-analyse** or **Manuel indtastning**.
2. [ ] **AI:** system proposes fields from images.
3. [ ] **Manual:** user enters fields without AI.
4. [ ] User proceeds to review (UC-15).

---

### UC-15: Review and correct registration fields

|           |                                          |
| --------- | ---------------------------------------- |
| **Actor** | User registering an asset                |
| **Goal**  | Ensure data is correct before finishing. |

**Main success scenario**

1. [ ] User sees summary of proposed or entered fields.
2. [ ] User edits incorrect values.
3. [ ] User confirms and continues.

---

### UC-16: Lock to sticker or register without locking

|           |                                                                 |
| --------- | --------------------------------------------------------------- |
| **Actor** | User registering an asset                                       |
| **Goal**  | Bind record to physical sticker/NFC, or save without that step. |

**Main success scenario**

1. [ ] User reaches final association step.
2. [ ] **Lock to sticker:** user links asset to sticker/NFC (scan or enter id); system marks as locked/protected per design.
3. [ ] **Skip:** user registers only; no physical lock yet.
4. [ ] System completes registration; user returns to dashboard (or success screen).

---

## Quick index

| ID     | Name                       |
| ------ | -------------------------- |
| UC-01  | Complete onboarding        |
| UC-02  | Log in                     |
| UC-02B | 2FA (future / higher risk) |
| UC-03  | Forside + Scan entry       |
| UC-04  | Dashboard overview         |
| UC-05  | Save/review locked items   |
| UC-06  | Transfer to others         |
| UC-06A | Initiate transfer          |
| UC-06B | View pending transfer      |
| UC-06C | Cancel transfer            |
| UC-06D | Accept transfer            |
| UC-06E | Decline transfer           |
| UC-06F | Expire transfer            |
| UC-06G | Resend transfer invite     |
| UC-06H | Transfer invite privacy    |
| UC-07  | Search on dashboard        |
| UC-08  | Scan (general user)        |
| UC-09  | Police scan                |
| UC-10  | Scan history               |
| UC-11  | Start register asset       |
| UC-12  | Three photos               |
| UC-13  | NFC how-to                 |
| UC-14  | AI vs manual analysis      |
| UC-15  | Review fields              |
| UC-16  | Lock to sticker or skip    |
