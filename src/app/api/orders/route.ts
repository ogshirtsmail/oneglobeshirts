import { createOrder } from "@/lib/orders";
import { handle, json, readJson } from "@/lib/order-api";
import { isAllowedAdminRequest } from "@/lib/admin-access";
import { ordersArePublic } from "@/lib/supabase";

export const runtime = "nodejs";

// Step 1 — Request a Quote: creates the order and returns the customer's private link.
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    if (typeof body.website === "string" && body.website.trim()) return json({ ok: true }); // honeypot
    if (!ordersArePublic() && !(await isAllowedAdminRequest(request))) {
      return json({ error: "Online ordering isn't open yet. Please use our quote form." }, 403);
    }
    const order = await createOrder(body);
    return json({
      order_no: order.order_no,
      path: `/orders/${encodeURIComponent(order.order_no)}?key=${encodeURIComponent(order.access_key)}`,
    });
  });
}
