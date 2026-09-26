# Part 13 — Schedule

Ports the web `/schedule` page (`app/[locale]/schedule/*`) to the Expo app.

## Ownership analysis (user / contractor / both?)

- **Web page scoping is customer-side.** `getUserScheduledAppointments` filters
  `Conversation.userId === userId`, i.e. appointments the user booked *as a
  customer*, and every card shows the **contractor**.
- **Web menu shows the link to both roles.** `components/header/profilemenu.tsx`
  renders the Schedule link for any signed-in user (not gated by `isContractor`).
- **Mobile endpoint covers both sides.** `GET /api/user/appointments` explicitly
  gathers conversations where the caller is the user **or** the contractor.
- **Contractor viewing it on the web sees only their customer-side bookings**,
  because the action is customer-scoped.

Conclusion: the schedule is a **customer-oriented feature available to both
roles**. The RN screen therefore renders for both roles and filters to the active
role's side, showing the counterpart:
- **user mode** → appointments where the user is the customer (shows contractor)
- **contractor mode** → appointments where the user is the contractor (shows customer)

## Backend (Next.js) change

- `app/api/user/appointments/route.ts` — added the conversation's `User` to the
  include and returned `customer: { id, name }` on each appointment, so the
  contractor-side schedule can show who the job is for (previously only the
  contractor was returned).

## RN changes

- `api/chatapi.tsx` — `ScheduledAppointment` gained
  `customer?: { id, name } | null`.
- `app/(auth)/schedule.tsx` — NEW screen mirroring the web page: summary cards
  (Upcoming / Total / Completed), Upcoming + Past sections, tap a card to open the
  conversation (`/(auth)/chat/{contractorId}/{conversationId}`). Role-aware:
  filters appointments to the active role and shows the counterpart name.
- `app/profile.tsx` — added a **Schedule** link (shown for both roles, web parity).
  The link uses a monochrome calendar SVG (`assets/icons/schedule.svg`) instead of
  a coloured emoji. Profile-menu icons were darkened to `#1f1f1f` (see Part 11).

## Notes

- Reuses the existing `getUserAppointments()` client and endpoint (already used by
  the in-chat `SchedulePlanner`).
- Only the customer/contractor counterpart is shown; no separate contractor
  "schedule" page exists on the web.
