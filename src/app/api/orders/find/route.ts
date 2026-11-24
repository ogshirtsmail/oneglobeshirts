import { customerLink, getOrder } from "@/lib/orders";
import { notifyCustomer } from "@/lib/order-mail";
import { handle, json, readJson } from "@/lib/order-api";

export const runtime = "nodejs";

// Emails the private order link if the order number and email match.
// Always answers the same way, so it can't be used to discover orders.
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const orderNo = String(body.order_no || "").trim().toUpperCase();
    const email = String(body.email || "").trim().toLowerCase();
    const order = await getOrder(orderNo);
    if (order && order.customer_email.toLowerCase() === email) {
      await notifyCustomer(order, customerLink(order), `Your order link — ${order.order_no}`, [
        "Here's the private link to your order page.",
        "Use it to see your status, approve designs and chat with our sales team.",
      ]).catch((e) => console.error("find-order email failed", e));
    }
    return json({ ok: true });
  });
}
