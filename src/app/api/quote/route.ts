import nodemailer from "nodemailer";
import { site } from "@/lib/site";

export const runtime = "nodejs";

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, max) : "";
const oneLine = (s: string) => s.replace(/\s+/g, " ");

export async function POST(request: Request) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (clean(data.website, 100)) {
    return Response.json({ ok: true });
  }

  const name = oneLine(clean(data.name, 100));
  const email = clean(data.email, 200);
  const org = oneLine(clean(data.org, 150));
  const sport = oneLine(clean(data.sport, 150));
  const quantity = oneLine(clean(data.quantity, 50));
  const message = clean(data.message, 5000);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    // Port 587 (STARTTLS) rather than 465: some antivirus mail scanners break 465.
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"${site.name} website" <${user}>`,
      to: process.env.QUOTE_TO_EMAIL || site.contactEmail,
      replyTo: `"${name.replace(/"/g, "")}" <${email}>`,
      subject: `Quote request${sport ? ` - ${sport}` : ""} from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Team / organization: ${org || "-"}`,
        `Sport / apparel type: ${sport || "-"}`,
        `Approx. quantity: ${quantity || "-"}`,
        "",
        message || "(no message)",
      ].join("\n"),
    });
  } catch (err) {
    console.error("Quote email failed:", err);
    return Response.json({ error: "send_failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
