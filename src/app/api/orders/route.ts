import { createOrder } from "@/lib/orders";
import { handle, json, readJson } from "@/lib/order-api";

export const runtime = "nodejs";

// Step 1 — Request a Quote: creates the order and returns the customer's private link.
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    if (typeof body.website === "string" && body.website.trim()) return json({ ok: true }); // honeypot
    const order = await createOrder(body);
    return json({
      order_no: order.order_no,
      path: `/orders/${encodeURIComponent(order.order_no)}?key=${encodeURIComponent(order.access_key)}`,
    });
  });
}
