import nodemailer from "nodemailer";
import { site } from "./site";
import { stepTitle, waitingLabel } from "./order-steps";

/**
 * Order emails go through the same Gmail account as the existing quote form
 * (SMTP_USER / SMTP_PASS). If those aren't set, emails are skipped silently and
 * everything still works on the website.
 */

type MailOrder = {
  order_no: string;
  customer_name: string;
  customer_email: string;
  team_name: string | null;
  current_step: string;
  step_status: string;
  status: string;
};

const SITE = (process.env.SITE_URL || "https://ogshirtsusa.com").replace(/\/$/, "");

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return {
    user,
    t: nodemailer.createTransport({ host: "smtp.gmail.com", port: 587, secure: false, requireTLS: true, auth: { user, pass } }),
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function html(title: string, lines: string[], button: { href: string; label: string }, order: MailOrder) {
  return `<div style="font-family:Arial,sans-serif;color:#14213d;max-width:560px">
<p style="font-size:13px;color:#5b677a;margin:0 0 4px">${esc(site.name)} · Order ${esc(order.order_no)}</p>
<h2 style="margin:0 0 12px">${esc(title)}</h2>
${lines.map((l) => `<p style="margin:0 0 10px;line-height:1.5">${esc(l).replace(/\n/g, "<br>")}</p>`).join("")}
<p style="margin:16px 0;font-size:14px"><strong>Current step:</strong> ${esc(stepTitle(order.current_step))} — ${esc(waitingLabel(order.step_status, order.status))}</p>
<p><a href="${esc(button.href)}" style="display:inline-block;background:#265ca0;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;font-weight:bold">${esc(button.label)}</a></p>
<p style="font-size:12px;color:#5b677a;margin-top:20px">You can reply in “Chat with Sales” on your order page.</p>
</div>`;
}

export async function notifyCustomer(order: MailOrder, link: string, subject: string, lines: string[]) {
  const m = transport();
  if (!m) return;
  await m.t.sendMail({
    from: `"${site.name}" <${m.user}>`,
    to: order.customer_email,
    replyTo: process.env.QUOTE_TO_EMAIL || site.contactEmail,
    subject,
    text: `${lines.join("\n\n")}\n\nCurrent step: ${stepTitle(order.current_step)}\n\nOpen your order: ${link}`,
    html: html(subject, lines, { href: link, label: "Open my order" }, order),
  });
}

export async function notifyTeam(order: MailOrder, subject: string, lines: string[]) {
  const m = transport();
  if (!m) return;
  const link = `${SITE}/admin/orders/${encodeURIComponent(order.order_no)}`;
  await m.t.sendMail({
    from: `"${site.name} orders" <${m.user}>`,
    to: process.env.ORDERS_TO_EMAIL || process.env.QUOTE_TO_EMAIL || site.contactEmail,
    replyTo: order.customer_email,
    subject,
    text: `${lines.join("\n\n")}\n\nOpen in admin: ${link}`,
    html: html(subject, lines, { href: link, label: "Open in admin" }, order),
  });
}
