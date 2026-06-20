// Cloudflare Pages Function — POST /api/contact
// Receives the contact form, validates + basic spam protection, sends via Resend.
// Secrets (Pages project env): RESEND_API_KEY (required), TURNSTILE_SECRET (optional).

const TO = "contact@thecloudops.co.uk";
const FROM = "TheCloudOps Website <noreply@thecloudops.co.uk>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ success: false, error: "Invalid request body." }, 400);
  }

  // Honeypot: bots fill the hidden "company" field. Pretend success, drop it.
  if (data.company) return json({ success: true });

  const name = (data.name || "").toString().trim();
  const email = (data.email || "").toString().trim();
  const message = (data.message || "").toString().trim();
  const subjectIn = (data.subject || "").toString().trim();

  if (!name || !email || !message) {
    return json({ success: false, error: "Name, email, and message are required." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ success: false, error: "Please enter a valid email address." }, 400);
  }
  if (message.length > 5000 || name.length > 200) {
    return json({ success: false, error: "Submission too long." }, 400);
  }

  // Optional Cloudflare Turnstile verification (only enforced if a secret is set).
  if (env.TURNSTILE_SECRET) {
    const token = (data["cf-turnstile-response"] || "").toString();
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const verify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
      }
    )
      .then((r) => r.json())
      .catch(() => ({ success: false }));
    if (!verify.success) {
      return json({ success: false, error: "Bot verification failed. Please retry." }, 403);
    }
  }

  if (!env.RESEND_API_KEY) {
    return json({ success: false, error: "Mail service not configured." }, 503);
  }

  const subject = subjectIn ? `Contact form: ${subjectIn}` : `New contact form enquiry from ${name}`;
  const html =
    `<h2>New enquiry via thecloudops.co.uk</h2>` +
    `<p><strong>Name:</strong> ${esc(name)}</p>` +
    `<p><strong>Email:</strong> ${esc(email)}</p>` +
    (subjectIn ? `<p><strong>Subject:</strong> ${esc(subjectIn)}</p>` : "") +
    `<p><strong>Message:</strong></p><p>${esc(message).replace(/\n/g, "<br>")}</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return json({ success: false, error: "Failed to send. Please email us directly." , detail: detail.slice(0,200)}, 502);
  }

  return json({ success: true });
}
