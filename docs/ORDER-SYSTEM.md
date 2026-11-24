# Order system — setup notes

Customer journey: **Request a Quote → Design Your Own Shirt / Request a Design → Approve Design →
Request a Physical Sample → Approve Physical Sample → Order Status → Shipping Details →
Shipping Status → Feedback**, with **Chat with Sales** at every step.

| Page | Who | What |
|---|---|---|
| `/orders/new` | Customers | Request a Quote (step 1) |
| `/orders/<order no>?key=…` | Customer with the private link | Order page: steps, actions, chat, history |
| `/orders/find` | Customers | Re-send the private link by email |
| `/admin/orders` | Admin IPs only | All orders, filters, unread chat |
| `/admin/orders/<order no>` | Admin IPs only | Act on each step as Owner / Sales / Production |

## Database (Supabase)
- Project: **og-orders** (`ukoxloxoqkyckorgzfyh`, us-east-1), organization "ogshirtsmail's Org"
- Schema: `supabase/migrations/0001_order_workflow.sql` (tables `orders`, `order_events`,
  `order_messages`, `order_files`; RLS on with no policies; private bucket `order-files`)
- The website talks to Supabase only from server code with the secret key.

## Vercel environment variables
| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://ukoxloxoqkyckorgzfyh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (`sb_secret_…`) — Project Settings → API Keys |
| `SMTP_USER` / `SMTP_PASS` | Gmail address + app password (already used by the quote form) — order emails |
| `ORDERS_TO_EMAIL` (optional) | Where team notifications go (default: QUOTE_TO_EMAIL / site email) |
| `SITE_URL` (optional) | Defaults to `https://ogshirtsusa.com` (used in email links) |

**After changing environment variables:** redeploy the **latest** deployment
(Vercel → Deployments → the top one → ⋯ → Redeploy). Redeploying an older deployment
puts the old version of the site back live.
