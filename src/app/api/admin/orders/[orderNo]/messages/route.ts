import { isAllowedAdminRequest } from "@/lib/admin-access";
import { addMessage, getOrder, loadBundle } from "@/lib/orders";
import { type Ctx, handle, json, readJson, staffIdentity, staffOrder } from "@/lib/order-api";

export const runtime = "nodejs";

// Chat with Sales — team side.
export async function POST(request: Request, { params }: Ctx) {
  if (!(await isAllowedAdminRequest(request))) return json({ error: "not_found" }, 404);
  return handle(async () => {
    const { orderNo } = await params;
    const order = await staffOrder(orderNo);
    const body = await readJson(request);
    const { role, name } = staffIdentity(body);
    await addMessage(order, role, name, body.body, body.file_ids);
    return json(await loadBundle((await getOrder(order.order_no)) ?? order, "staff"));
  });
}
