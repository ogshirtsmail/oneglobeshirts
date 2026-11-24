import { isAllowedAdminRequest } from "@/lib/admin-access";
import { loadBundle, staffAction } from "@/lib/orders";
import { type Ctx, handle, json, readJson, staffIdentity, staffOrder } from "@/lib/order-api";

export const runtime = "nodejs";

// Team steps: send quote, send design proof, sample sent, production updates, shipped, payment…
export async function POST(request: Request, { params }: Ctx) {
  if (!(await isAllowedAdminRequest(request))) return json({ error: "not_found" }, 404);
  return handle(async () => {
    const { orderNo } = await params;
    const order = await staffOrder(orderNo);
    const body = await readJson(request);
    const { role, name } = staffIdentity(body);
    const updated = await staffAction(order, role, name, String(body.action || ""), body);
    return json(await loadBundle(updated, "staff"));
  });
}
