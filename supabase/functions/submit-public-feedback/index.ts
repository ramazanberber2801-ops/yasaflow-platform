import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedCategories = new Set(["idea", "bug", "feature", "other"]);
const allowedLocales = new Set(["en", "nb", "tr"]);

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] ?? char));
}

function allowedOrigin(origin: string | null) {
  if (!origin) return "https://yasaflow.com";
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return "https://yasaflow.com";
    if (url.hostname === "yasaflow.com" || url.hostname.endsWith(".yasaflow.com") || url.hostname === "yasaflow.vercel.app") return origin;
  } catch {
    // Fall through to the canonical origin.
  }
  return "https://yasaflow.com";
}

function responseHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(req.headers.get("origin")),
    "Access-Control-Allow-Headers": "content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}

Deno.serve(async (req: Request) => {
  const headers = responseHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405, headers });

  try {
    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > 12_000) {
      return new Response(JSON.stringify({ ok: false, error: "Payload too large" }), { status: 413, headers });
    }

    const rawBody = await req.text();
    if (rawBody.length > 12_000) return new Response(JSON.stringify({ ok: false, error: "Payload too large" }), { status: 413, headers });

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid request" }), { status: 400, headers });
    }

    if (clean(body.website, 200)) return new Response(JSON.stringify({ ok: true }), { headers });

    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const category = clean(body.category, 20);
    const message = clean(body.message, 4000);
    const locale = clean(body.locale, 5);

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !allowedCategories.has(category) || message.length < 10 || !allowedLocales.has(locale)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid feedback" }), { status: 400, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceRoleKey || !resendKey) throw new Error("Missing server configuration");

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientIp = forwarded || req.headers.get("cf-connecting-ip") || "unknown";

    const { error: emailLimitError } = await admin.rpc("enforce_public_rate_limit", {
      p_event_type: "public_feedback_email",
      p_organization_id: null,
      p_subject: email,
      p_window: "1 hour",
      p_limit: 3,
    });
    const { error: ipLimitError } = await admin.rpc("enforce_public_rate_limit", {
      p_event_type: "public_feedback_ip",
      p_organization_id: null,
      p_subject: clientIp,
      p_window: "10 minutes",
      p_limit: 8,
    });
    if (emailLimitError || ipLimitError) {
      return new Response(JSON.stringify({ ok: false, error: "Too many requests" }), { status: 429, headers: { ...headers, "Retry-After": "600" } });
    }

    const { data, error } = await admin.from("public_feedback").insert({ name, email, category, message, locale, source: "website" }).select("id, created_at").single();
    if (error) throw error;

    const categoryLabels: Record<string, string> = { idea: "Idé", bug: "Feil", feature: "Funksjonsønske", other: "Annet" };
    const subject = `Ny Yasaflow-tilbakemelding: ${categoryLabels[category]}`;
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a"><h2>Ny tilbakemelding fra Yasaflow</h2><p><strong>Navn:</strong> ${escapeHtml(name)}<br><strong>E-post:</strong> ${escapeHtml(email)}<br><strong>Kategori:</strong> ${escapeHtml(categoryLabels[category])}<br><strong>Språk:</strong> ${escapeHtml(locale)}<br><strong>Tidspunkt:</strong> ${escapeHtml(data.created_at)}</p><p><strong>Melding:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p></div>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Yasaflow <noreply@yasaflow.com>", to: ["hello@yasaflow.com"], reply_to: email, subject, html }),
    });

    if (!emailResponse.ok) {
      console.error("Feedback email notification failed", await emailResponse.text());
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), { headers });
  } catch (error) {
    console.error("submit-public-feedback failed", error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ ok: false, error: "Could not submit feedback" }), { status: 500, headers });
  }
});
