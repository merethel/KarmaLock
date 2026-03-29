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
