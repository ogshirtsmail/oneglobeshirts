import { isAllowedAdminRequest } from "@/lib/admin-access";
import { loadBundle } from "@/lib/orders";
import { type Ctx, handle, json, staffOrder } from "@/lib/order-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: Ctx) {
  if (!(await isAllowedAdminRequest(request))) return json({ error: "not_found" }, 404);
  return handle(async () => {
    const { orderNo } = await params;
    return json(await loadBundle(await staffOrder(orderNo), "staff"));
  });
}
