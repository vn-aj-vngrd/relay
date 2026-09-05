# Retire payment deferral as a Play prerequisite

Payment arrangement is independent of starting Play. This supersedes the payment-gating portion of migration `0045` without modifying that already-applied migration.

- Drops only `sessions.payment_deferred`, an unnecessary setup-choice flag.
- Preserves player prices (including explicit Free), expenses, repayment splits, payment records, booking decisions, court assignments, and scores.
- An unset price remains unset, not Free. Public discovery still requires an explicit price.
- Hosts may arrange repayment before, during, or after Play through Payments; existing cancelled-game restrictions remain.
- Court booking is still required or explicitly marked No booking needed. Missing booking prompts before the three-step Players → Game options → Review wizard and is rechecked under the session lock when starting.

Deploy code that no longer selects or writes `payment_deferred` before dropping the column. Old application instances expecting the column must be retired. The prior flag cannot be restored without a backup, but it contains no financial transaction data.
