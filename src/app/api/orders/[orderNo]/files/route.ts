import { uploadOrderFile } from "@/lib/orders";
import { type Ctx, customerOrder, handle, json } from "@/lib/order-api";

export const runtime = "nodejs";

// Customer file upload (logos, own designs, references, chat attachments). Max 4 MB per file.
export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { orderNo } = await params;
    const order = await customerOrder(request, orderNo);
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "other");
    return json(await uploadOrderFile(order, "customer", kind, file as File));
  });
}
