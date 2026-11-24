import { loadBundle } from "@/lib/orders";
import { type Ctx, customerOrder, handle, json } from "@/lib/order-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { orderNo } = await params;
    const order = await customerOrder(request, orderNo);
    return json(await loadBundle(order, "customer"));
  });
}
