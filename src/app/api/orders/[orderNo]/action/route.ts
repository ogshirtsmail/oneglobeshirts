import { customerAction, loadBundle } from "@/lib/orders";
import { type Ctx, customerOrder, handle, json, readJson } from "@/lib/order-api";

export const runtime = "nodejs";

// Customer steps: accept quote, submit/request design, approve design, sample, shipping, feedback…
export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { orderNo } = await params;
    const order = await customerOrder(request, orderNo);
    const body = await readJson(request);
    const updated = await customerAction(order, String(body.action || ""), body);
    return json(await loadBundle(updated, "customer"));
  });
}
