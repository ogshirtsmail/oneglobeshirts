import { addMessage, getOrder, loadBundle } from "@/lib/orders";
import { type Ctx, customerOrder, handle, json, readJson } from "@/lib/order-api";

export const runtime = "nodejs";

// Chat with Sales — customer side.
export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { orderNo } = await params;
    const order = await customerOrder(request, orderNo);
    const body = await readJson(request);
    await addMessage(order, "customer", order.customer_name, body.body, body.file_ids);
    return json(await loadBundle((await getOrder(order.order_no)) ?? order, "customer"));
  });
}
