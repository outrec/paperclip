# CRM/DMS Lifecycle Revenue Gap Map

Generated: 2026-05-12

## Current Data Flow

1. DP360 is the verified CRM source for Vallely lead and inventory data. Current app access is through DP360 portal credentials, while API-backed jobs require `DP360_DEALER_ID` and a DP360 token.
2. Public DP360 V2 documentation exposes token, inventory, and lead endpoints. Existing backend jobs read leads from `https://api.dp360crm.com/api/2.0/` using `/leads/{dealer_id}.json` by default, with token headers.
3. `scripts/dp360-lead-sla-refresh.mjs` normalizes active web/chat leads into the lead-response SLA KPI envelope consumed by `GET /api/cro/lead-response-sla` and the revenue levers UI.
4. `scripts/dp360-stale-lead-reengagement.mjs` materializes stale web leads at 30, 60, and 90 local-day inactivity windows, emits `lead.stale.30`, `lead.stale.60`, and `lead.stale.90`, and can publish to `OUTREC_DOMAIN_EVENT_URL`.
5. `POST /api/cro/test-form-completions` safely proves synthetic quote, finance, and service form-completion attribution events without creating real customer leads.
6. The lead-response smoke can exercise DP360 inbound lead, Twilio SMS, Twilio voice, and email autoresponder surfaces, but production mode requires explicit opt-in and configured surface URLs.
7. The revenue levers dashboard reads lifecycle revenue attribution when `/api/revenue-lever` provides `lifecycle_revenue` or `attributed_revenue`; attribution storage and campaign-level lifecycle triggers are not yet represented as durable backend contracts beyond stale-lead event emission.

## Event Coverage Matrix

Revenue estimates are directional annual gross revenue recovery ranges for prioritization. They should be replaced with measured close rate, average gross, and volume once DP360 lead history and campaign attribution are available.

| Event | Captured? | Triggers Lifecycle? | Revenue Estimate | Effort |
| --- | --- | --- | --- | --- |
| New web/chat DP360 lead created | Yes. The SLA refresh normalizes active web/chat leads from DP360 lead payloads. | Partially. It feeds SLA analytics and response monitoring, not a durable customer lifecycle campaign. | $25k-$75k by reducing slow first touches. | Low. Existing fetch/normalization path exists; needs lifecycle event sink binding. |
| Lead first-touch response / SLA breach | Yes. `last_touch_at` / related fields are normalized into p50, p90, and daily breach metrics. | No direct campaign trigger. It is currently KPI/reporting oriented. | $15k-$50k through same-day rescue of breached leads. | Low-medium. Add `lead.response_sla.breached` events and idempotency. |
| Quote request form completion | Yes for synthetic test attribution; likely captured by live site/CRM when submitted, but the repo only proves test-mode `quote_request`. | No durable lifecycle trigger found. | $40k-$120k from fast quote follow-up and quote aging sequences. | Medium. Promote tested attribution contract into live event ingestion and campaign dispatch. |
| Quote-no-response after quote request | Missing as a first-class segment. Existing stale-lead windows are too coarse for 24-72 hour quote recovery. | No. | $60k-$180k from 1-3 day quote recovery sequences. | Medium. Needs quote event/state capture, response detection, and suppression rules. |
| Finance/prequalification lead | Yes in prompt regression fixtures and synthetic finance form completion test path; not found as live lifecycle ingestion. | No durable trigger found. | $25k-$90k from financing objection follow-up. | Medium. Reuse form attribution path and route to lifecycle sink. |
| Service appointment request | Yes for synthetic service form completion; live CRM/DMS capture is not proven in repo artifacts. | No durable trigger found. | $20k-$80k from service booking recovery and RO conversion. | Medium. Needs live service form event binding and appointment status feedback. |
| Post-service follow-up / declined work | Missing. No DMS repair-order, appointment-completed, declined-service, or service-close event source found. | No. | $50k-$150k from declined work, seasonal maintenance, and repeat service reminders. | Medium-high. Requires DMS/service export or API source plus consent/suppression rules. |
| Post-test-drive / demo follow-up | Missing. No test-drive/demo appointment-completed activity trigger found; only generic contacted/appointment statuses suppress stale campaigns. | No. | $30k-$110k from demo follow-up sequences. | Medium-high. Requires DP360 activity/status mapping and completed-demo detection. |
| Abandoned cart / inventory shopper abandonment | Missing. Public inventory audit covers listing quality, but no session/cart/wishlist/detail-view abandonment event contract exists. | No. | $45k-$160k from high-intent inventory recovery. | Medium-high. Requires website event capture, identity stitching, and inventory availability suppression. |
| Stale web lead at 30/60/90 days | Yes. Stale segments and `lead.stale.*` events are generated with per-window idempotency. | Partially. Events can publish to `OUTREC_DOMAIN_EVENT_URL`; no concrete email/SMS campaign consumer is represented here. | $20k-$90k from long-tail lead reactivation. | Low-medium. Wire emitted events to lifecycle/email provider and add outcome attribution. |
| Inventory missing price/photo freshness | Yes as an audit report, not a customer event. | No. | $10k-$60k by improving conversion on active listings. | Low-medium. Convert audit deltas into ops alerts and suppress abandoned shopper sends for bad listings. |

## Highest-ROI Gaps

1. Quote-no-response should be the first backend implementation target. It is close to existing quote attribution work, has short follow-up windows, and is likely to recover active buyers before they become stale leads.
2. Abandoned inventory shopper capture should follow because current inventory audits show usable item identifiers and listing URLs, but no behavioral event contract exists for high-intent anonymous or known shoppers.
3. Post-service follow-up should be split into a source-mapping task because no repair-order or service-completion feed is currently proven. It has strong revenue potential but needs DMS/service data access before campaign logic can be reliable.

## Backend Follow-Up Issue Seeds

| Priority | Issue seed | Scope |
| --- | --- | --- |
| 1 | Backend: Implement quote-no-response lifecycle segment | Add quote request ingestion, response/no-response detection for 24/48/72 hour windows, idempotent `lead.quote.no_response.*` events, suppression for sold/closed/contacted leads, and file/HTTP sink parity with stale-lead re-engagement. |
| 2 | Backend: Add abandoned inventory shopper event contract | Define and ingest inventory detail/search/quote-start abandonment events, stitch known leads where possible, enforce inventory availability/price/photo suppression, and emit `shopper.inventory.abandoned` recovery events. |
| 3 | Backend: Map service DMS source and emit post-service follow-up events | Identify the service appointment/RO source, normalize completed-service and declined-work records, and emit idempotent post-service lifecycle events for email/SMS consumers. |

