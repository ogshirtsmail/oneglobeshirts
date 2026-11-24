import { isAllowedAdminRequest } from "@/lib/admin-access";
import { isStaffRole, uploadOrderFile } from "@/lib/orders";
import { type Ctx, handle, json, staffOrder } from "@/lib/order-api";

export const runtime = "nodejs";

// Team file upload (design proofs, sample photos, production photos, chat attachments).
export async function POST(request: Request, { params }: Ctx) {
  if (!(await isAllowedAdminRequest(request))) return json({ error: "not_found" }, 404);
  return handle(async () => {
    const { orderNo } = await params;
    const order = await staffOrder(orderNo);
    const form = await request.formData();
    const role = form.get("role");
    return json(await uploadOrderFile(order, isStaffRole(role) ? role : "owner", String(form.get("kind") || "other"), form.get("file") as File));
  });
}
