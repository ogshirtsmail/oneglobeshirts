/**
 * The order journey, worded the same way everywhere (customer page, admin pages, emails).
 * Shared by browser and server code — no secrets here.
 */

export const STEPS = [
  { key: "quote", title: "Request a Quote", customer: "Tell us what you need. We'll send you a price.", team: "Review the request and send the quote." },
  { key: "design_own", title: "Design Your Own Shirt", customer: "Upload your own design, logos and colors.", team: "Customer is designing their own shirt." },
  { key: "design_request", title: "Request a Design", customer: "Ask our designers to create the design for you.", team: "Create the design and send the proof." },
  { key: "design_approval", title: "Approve Design", customer: "Check the design proof. Approve it or ask for changes.", team: "Send the proof and wait for approval." },
  { key: "sample_request", title: "Request a Physical Sample", customer: "Ask for a physical sample before the full order, or skip it.", team: "Wait for the customer's sample decision." },
  { key: "sample_approval", title: "Approve Physical Sample", customer: "Check the sample. Approve it or ask for changes.", team: "Make and send the sample, then wait for approval." },
  { key: "order_status", title: "Order Status", customer: "Your order is being made. Follow each stage here.", team: "Post production updates and photos." },
  { key: "shipping_details", title: "Shipping Details", customer: "Tell us where to deliver your order.", team: "Wait for the delivery address." },
  { key: "shipping_status", title: "Shipping Status", customer: "Track your shipment.", team: "Add the carrier and tracking number." },
  { key: "feedback", title: "Feedback", customer: "Tell us how we did.", team: "Wait for the customer's feedback." },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];
export const STEP_KEYS = STEPS.map((s) => s.key) as StepKey[];
export const stepTitle = (key: string) => STEPS.find((s) => s.key === key)?.title ?? key;
export const stepIndex = (key: string) => STEP_KEYS.indexOf(key as StepKey);

export const CHAT_TITLE = "Chat with Sales";

export const PRODUCTION_STAGES = [
  { key: "in_production", label: "In production" },
  { key: "printing", label: "Printing" },
  { key: "stitching", label: "Stitching" },
  { key: "quality_check", label: "Quality check" },
  { key: "ready", label: "Ready to ship" },
] as const;
export type ProductionStage = (typeof PRODUCTION_STAGES)[number]["key"];
export const productionLabel = (key: string | null | undefined) =>
  PRODUCTION_STAGES.find((s) => s.key === key)?.label ?? "Not started";

export const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Payment pending",
  deposit: "Deposit received",
  paid: "Paid in full",
};

export const STAFF_ROLES = [
  { key: "owner", label: "Owner" },
  { key: "sales", label: "Sales" },
  { key: "production", label: "Production" },
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number]["key"];
export type Actor = "customer" | StaffRole | "system";

export const ORDER_TYPES = [
  "Cricket Jersey",
  "Rugby",
  "Company Shirts",
  "Basketball Shirt",
  "Soccer",
  "School Shirts",
  "Hoodies",
  "Shorts",
  "Other",
];

export const SIZE_GROUPS = [
  { key: "Male", sizes: ["S", "M", "L", "XL", "XXL"] },
  { key: "Female", sizes: ["S", "M", "L", "XL", "XXL"] },
  { key: "Kids", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
] as const;

export const FILE_KIND_LABELS: Record<string, string> = {
  logo: "Logo",
  own_design: "Customer design",
  reference: "Reference",
  proof: "Design proof",
  sample_photo: "Sample photo",
  production_photo: "Production photo",
  chat: "Chat attachment",
  other: "File",
};

/** "Who needs to act" wording for the current step. */
export function waitingLabel(stepStatus: string, status: string) {
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return stepStatus === "waiting_customer" ? "Waiting for customer" : "With the OG team";
}

/** Shape of an order as the pages receive it (server never sends access_key to the browser except to staff). */
export type OrderView = {
  order_no: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  team_name: string | null;
  order_type: string | null;
  quantities: Record<string, number>;
  total_qty: number;
  fabric: string | null;
  needed_by: string | null;
  details: string | null;
  current_step: StepKey;
  step_status: "waiting_customer" | "waiting_team" | "done";
  status: "active" | "completed" | "cancelled";
  design_path: "own" | "request" | null;
  skip_sample: boolean;
  quote_amount: number | null;
  quote_note: string | null;
  payment_status: "unpaid" | "deposit" | "paid";
  production_stage: string | null;
  shipping_address: ShippingAddress | null;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  feedback_rating: number | null;
  feedback_text: string | null;
  unread_for_staff: number;
  unread_for_customer: number;
  last_message_at: string | null;
};

export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
};

export type OrderFileView = {
  id: string;
  created_at: string;
  uploaded_by: string;
  kind: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  url: string | null; // short-lived signed link
};

export type OrderEventView = {
  id: number;
  created_at: string;
  actor: string;
  actor_name: string | null;
  step: string;
  action: string;
  label: string;
  note: string | null;
  file_ids: string[];
};

export type OrderMessageView = {
  id: number;
  created_at: string;
  sender: string;
  sender_name: string | null;
  body: string;
  file_ids: string[];
};

export type OrderBundle = {
  order: OrderView;
  events: OrderEventView[];
  messages: OrderMessageView[];
  files: OrderFileView[];
  /** Only included for staff. */
  customerLink?: string;
};

export function trackingUrl(carrier: string | null, tracking: string | null): string | null {
  if (!tracking) return null;
  const t = encodeURIComponent(tracking.trim());
  switch ((carrier || "").toLowerCase()) {
    case "ups":
      return `https://www.ups.com/track?tracknum=${t}`;
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
    case "dhl":
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?tracking-id=${t}`;
    default:
      return null;
  }
}
