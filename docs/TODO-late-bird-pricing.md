# Late Bird Pricing Switch

**Deadline: before 31 August 2026**

Early bird rates end on 31 August 2026. Before that date, update the following:

## 1. Registration dropdown (`src/components/conference/registration-dialog.tsx`)

Change the `<option>` labels and note from early bird to late bird prices:

| Type             | Early Bird | Late Bird |
| ---------------- | ---------- | --------- |
| Regular          | €60        | €80       |
| HGS Member       | €40        | €50       |
| Student          | €20        | €30       |
| HGS Student Member | €10      | €15       |

Also update the helper text below the dropdown that currently reads:
> Early bird rates apply until **31 August 2026**. Fees increase after this date…

## 2. Confirmation email (`src/app/api/send-email/route.ts`)

Update the `regTypeLabel` map to reflect late bird prices (e.g. `"Regular — €80"`).
