# WhatsApp Message Templates for Meta Approval

Submit these in **Meta Business Suite → WhatsApp Manager → Message templates**.

- **Category:** Utility (for all 4 templates below)
- **Language:** English
- **Audience:** Internal staff alerts (admin + agent) — not sent to customers

Each template uses **6 body variables** in this order:

| Variable | Content |
|---|---|
| {{1}} | Lead name |
| {{2}} | Lead phone |
| {{3}} | Visa type (e.g. Student Visa) |
| {{4}} | Country of choice |
| {{5}} | Follow-up date/time (IST) |
| {{6}} | Assigned agent name or "Unassigned" |

---

## Template 1: `visa_followup_due_in_2d`

**Name (exact):** `visa_followup_due_in_2d`

**Body:**
```
Follow-up in 2 days: {{1}} ({{2}}) — {{3}} for {{4}}. Scheduled: {{5}}. Assigned agent: {{6}}.
```

**Sample values for Meta review:**
```
Follow-up in 2 days: Amit Patel (+919876543210) — Student Visa for UK. Scheduled: 10 Sep 2026, 10:00 am. Assigned agent: Priya Sharma.
```

---

## Template 2: `visa_followup_due_in_1d`

**Name (exact):** `visa_followup_due_in_1d`

**Body:**
```
Follow-up tomorrow: {{1}} ({{2}}) — {{3}} for {{4}}. Scheduled: {{5}}. Assigned agent: {{6}}.
```

**Sample values:**
```
Follow-up tomorrow: Amit Patel (+919876543210) — Student Visa for UK. Scheduled: 10 Sep 2026, 10:00 am. Assigned agent: Priya Sharma.
```

---

## Template 3: `visa_followup_due_today`

**Name (exact):** `visa_followup_due_today`

**Body:**
```
Follow-up due TODAY: {{1}} ({{2}}) — {{3}} for {{4}}. Time: {{5}}. Assigned agent: {{6}}. Please contact now.
```

**Sample values:**
```
Follow-up due TODAY: Amit Patel (+919876543210) — Student Visa for UK. Time: 10 Sep 2026, 10:00 am. Assigned agent: Priya Sharma. Please contact now.
```

---

## Template 4: `visa_followup_overdue_1d`

**Name (exact):** `visa_followup_overdue_1d`

**Body:**
```
OVERDUE by 1 day: {{1}} ({{2}}) — {{3}} for {{4}}. Was due: {{5}}. Assigned agent: {{6}}. Please follow up urgently.
```

**Sample values:**
```
OVERDUE by 1 day: Amit Patel (+919876543210) — Student Visa for UK. Was due: 10 Sep 2026, 10:00 am. Assigned agent: Priya Sharma. Please follow up urgently.
```

---

## Tips for fast approval

1. Use **Utility** category — these are operational reminders, not promotions.
2. Do **not** include URLs, emojis, or ALL CAPS except "TODAY" / "OVERDUE" as shown.
3. Template **names must match exactly** — the CRM code uses these names.
4. Submit all 4 at once; approval usually takes 1–24 hours.

---

## When each template is sent

| Template | Trigger (IST calendar day) |
|---|---|
| `visa_followup_due_in_2d` | Follow-up date is 2 days from today |
| `visa_followup_due_in_1d` | Follow-up date is tomorrow |
| `visa_followup_due_today` | Follow-up date is today |
| `visa_followup_overdue_1d` | Follow-up date was yesterday, lead still open |

**Recipients:** All **admins** in the lead's organization + **assigned agent** (if any).

**Requirements:** Lead must have `next_follow_up_at` set and WhatsApp reminders enabled (default on).
