import { isAllowedAdminRequest } from "@/lib/admin-access";
import { listOrdersForStaff } from "@/lib/orders";
import { handle, json } from "@/lib/order-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAllowedAdminRequest(request))) return json({ error: "not_found" }, 404);
  return handle(async () => {
    const sp = new URL(request.url).searchParams;
    const orders = await listOrdersForStaff({
      step: sp.get("step") || undefined,
      status: sp.get("status") || undefined,
      q: sp.get("q") || undefined,
    });
    return json({ orders });
  });
}
