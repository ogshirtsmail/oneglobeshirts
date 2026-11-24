import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "./supabase";
import { OrderError, getOrder, keyMatches, type OrderRow } from "./orders";
import { isStaffRole } from "./orders";
import type { StaffRole } from "./order-steps";

/** Shared plumbing for the order API routes. */

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });

export function notReady() {
  return json({ error: "Online orders aren't switched on yet. Please use Request a Quote or email us." }, 503);
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  if (!isSupabaseConfigured()) return notReady();
  try {
    return await fn();
  } catch (err) {
    if (err instanceof OrderError) return json({ error: err.message }, err.status);
    console.error("Order API error:", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

/** Loads the order and checks the customer's private key (?key=…). */
export async function customerOrder(request: Request, orderNo: string): Promise<OrderRow> {
  const key = new URL(request.url).searchParams.get("key");
  const order = await getOrder(decodeURIComponent(orderNo));
  if (!order || !keyMatches(order, key)) throw new OrderError("Order not found. Please check your link.", 404);
  return order;
}

export async function staffOrder(orderNo: string): Promise<OrderRow> {
  const order = await getOrder(decodeURIComponent(orderNo));
  if (!order) throw new OrderError("Order not found.", 404);
  return order;
}

export function staffIdentity(body: Record<string, unknown>): { role: StaffRole; name: string } {
  const role = isStaffRole(body.role) ? body.role : "owner";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : role[0].toUpperCase() + role.slice(1);
  return { role, name };
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    throw new OrderError("Bad request.");
  }
}

export type Ctx = { params: Promise<{ orderNo: string }> };
