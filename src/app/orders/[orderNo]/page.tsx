import type { Metadata } from "next";
import CustomerOrder from "@/components/orders/CustomerOrder";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[orderNo]">) {
  const { orderNo } = await params;
  const sp = await searchParams;
  const key = typeof sp.key === "string" ? sp.key : "";
  return <CustomerOrder orderNo={decodeURIComponent(orderNo)} accessKey={key} />;
}
