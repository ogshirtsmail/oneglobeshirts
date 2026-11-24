import type { Metadata } from "next";
import AdminOrder from "@/components/orders/AdminOrder";

export const metadata: Metadata = { title: "Order (admin)", robots: { index: false, follow: false } };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[orderNo]">) {
  const { orderNo } = await params;
  return <AdminOrder orderNo={decodeURIComponent(orderNo)} />;
}
