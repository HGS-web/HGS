import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "HGS Conference 2026 <noreply@hellenic-geographical-society.com>"
const SUPPORT_EMAIL = "ekarkani@geol.uoa.gr"

const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("HGS Conference 2026 – Change Request / Issue")}&body=${encodeURIComponent("Type of request: [ Registration Change / Abstract Change / Payment Issue / Other ]\n\nEmail used for registration:\n\nDescription of change or issue:\n\nAdditional comments:\n\n")}`

function esc(str: string | undefined | null): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const BANNER = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;">
    <tr>
      <td style="padding:20px 24px;font-family:Arial,Helvetica,sans-serif;">
        <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">
          13th International Conference of the Hellenic Geographical Society
        </h1>
        <p style="margin:4px 0 0;color:#aaaaaa;font-size:13px;font-family:Arial,Helvetica,sans-serif;">
          27&#8211;28 November 2026 &middot; Athens, Greece
        </p>
      </td>
    </tr>
  </table>
`

const FOOTER = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
    <tr>
      <td style="padding:14px 16px;background:#f9fafb;font-size:13px;font-family:Arial,Helvetica,sans-serif;color:#374151;line-height:1.6;">
        If you need to make changes to your registration, abstract, or payment,
        please <a href="${SUPPORT_MAILTO}" style="color:#1a1a1a;font-weight:600;">contact us</a>.
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
    <tr>
      <td style="padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
        Hellenic Geographical Society &middot; hellenic-geographical-society.com
      </td>
    </tr>
  </table>
`

function wrap(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;">
          <tr><td>${BANNER}</td></tr>
          <tr>
            <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;">
              ${content}
              ${FOOTER}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const regTypeLabel: Record<string, string> = {
  regular:     "Regular (Early Bird €60 / Late €80)",
  hgs_member:  "HGS Member (Early Bird €40 / Late €50)",
  student:     "Student (Early Bird €20 / Late €30)",
  hgs_student: "HGS Student Member (Early Bird €10 / Late €15)",
}

const dietaryLabel: Record<string, string> = {
  none: "None", vegetarian: "Vegetarian", vegan: "Vegan",
  kosher: "Kosher", gluten_free: "Gluten-free", other: "Other",
}

function row(label: string, value: string, shaded = false) {
  const bg = shaded ? "background:#f9fafb;" : ""
  return `<tr style="${bg}">
    <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;width:40%;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${esc(label)}</td>
    <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;word-break:break-word;font-family:Arial,Helvetica,sans-serif;">${esc(value)}</td>
  </tr>`
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: true }, { status: 200 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = await req.json()
  const { type, email } = data

  if (!email || !type) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  let subject: string
  let html: string

  if (type === "verify") {
    subject = "Email Verification – HGS Conference 2026"
    html = wrap(`
      <h2 style="margin:0 0 8px;font-size:16px;color:#111827;font-family:Arial,Helvetica,sans-serif;">Email Verification</h2>
      <p style="color:#374151;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        This email confirms that <strong>${esc(email)}</strong> is the address you entered
        for the 13th International Conference of the Hellenic Geographical Society.
      </p>
      <p style="color:#374151;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        If you received this, your email is correct. Return to the registration form to complete your submission.
      </p>
      <p style="color:#9ca3af;font-size:13px;font-family:Arial,Helvetica,sans-serif;">
        If you did not request this, you can safely ignore it.
      </p>
    `)
  } else if (type === "registration") {
    subject = "Registration Confirmed – HGS Conference 2026"
    html = wrap(`
      <h2 style="margin:0 0 8px;font-size:16px;color:#111827;font-family:Arial,Helvetica,sans-serif;">Hi ${esc(data.first_name)},</h2>
      <p style="color:#374151;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Thank you for registering for the <strong>13th International Conference of the Hellenic Geographical Society</strong>.
        Your registration has been recorded.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;table-layout:fixed;">
        ${row("Name", `${data.first_name} ${data.last_name}`, true)}
        ${row("Email", data.email)}
        ${row("Affiliation", data.affiliation, true)}
        ${row("Country", data.country)}
        ${row("Registration type", regTypeLabel[data.registration_type] ?? data.registration_type, true)}
        ${data.abstract_intent !== "none" ? row("Abstract intent", data.abstract_intent === "oral" ? "Oral presentation" : "Poster presentation") : ""}
        ${row("Dietary", data.dietary === "other" ? (data.dietary_other ?? "") : (dietaryLabel[data.dietary] ?? "None"), data.abstract_intent !== "none")}
        ${data.special_requirements ? row("Special requirements", data.special_requirements) : ""}
      </table>
      <p style="color:#374151;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Bank transfer details for payment will be communicated separately.
        Abstract submission deadline: <strong>1 May 2026</strong>.
      </p>
    `)
  } else if (type === "abstract") {
    subject = "Abstract Received – HGS Conference 2026"
    html = wrap(`
      <h2 style="margin:0 0 8px;font-size:16px;color:#111827;font-family:Arial,Helvetica,sans-serif;">Hi ${esc(data.first_name)},</h2>
      <p style="color:#374151;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        We have received your abstract for the <strong>13th International Conference of the Hellenic Geographical Society</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;table-layout:fixed;">
        ${row("Name", `${data.first_name} ${data.last_name}`, true)}
        ${row("Email", data.email)}
        ${row("Title", data.title, true)}
        ${data.co_authors ? row("Co-authors", data.co_authors) : ""}
        ${row("Session", data.session_title ? `#${data.session_id} – ${data.session_title}` : `Session ${data.session_id}`, !!data.co_authors)}
        ${row("Presentation", data.presentation_type === "oral" ? "Oral presentation" : "Poster presentation", !data.co_authors)}
      </table>
      <p style="color:#374151;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Author notifications will be sent by <strong>1 July 2026</strong>.
      </p>
    `)
  } else if (type === "receipt") {
    subject = "Payment Receipt Received – HGS Conference 2026"
    html = wrap(`
      <p style="color:#374151;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        We have received your payment receipt. Your registration will be confirmed within a few business days.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;table-layout:fixed;">
        ${row("Email", data.email, true)}
        ${row("Receipt type", data.receipt_type === "hgs_membership" ? "HGS Membership Payment" : "Conference Payment")}
        ${data.notes ? row("Notes", data.notes, true) : ""}
      </table>
    `)
  } else {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 })
  }

  try {
    await resend.emails.send({ from: FROM, to: email, subject, html })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
