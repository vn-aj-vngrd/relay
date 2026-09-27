# Agent request metrics

Apply `0064_agent_request_metrics.sql` before deploying Agent cost, latency, and
error reporting. The table contains only numeric request metadata and fixed
status/error labels. It has no account ID, prompt, answer, tool input/output,
provider error body, or model reasoning. Row-level security is enabled and
Data API roles have no table privileges. The server's direct database connection
writes completed provider attempts; the admin page reads 30-day aggregates.

Cost is the OpenRouter-reported USD amount when supplied for each completed
model step. Missing provider cost stays `NULL`, so the dashboard must show
coverage and never treat missing data as free usage. If this migration is
missing, generation still works and metric writes fail closed without exposing
response data; the admin metrics panel reports unavailable until it is applied.
