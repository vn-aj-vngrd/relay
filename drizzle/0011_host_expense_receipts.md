# 0011 Host expense receipts

## Purpose

Adds `expenses.receipt_storage_path` so a host who paid a venue or shared expense upfront can attach one receipt. The receipt supports the repayment context; it is not player payment proof.

## Storage and authorization

- Receipt images use the existing private `booking-screenshots` bucket.
- Objects are stored under `<session-id>/expense-<uuid>.<extension>`.
- Only the authenticated session host can create an expense and upload its receipt.
- Session payment pages create short-lived signed URLs for authorized participants.
- Deleting a session removes its stored expense receipts.

## Historical data

The column is nullable. Existing expenses remain valid and display without a receipt.

## Apply

```bash
pnpm db:migrate
```

Apply this migration before deploying code that reads `receipt_storage_path`.
