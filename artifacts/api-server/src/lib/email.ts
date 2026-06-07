import { Resend } from "resend";

let resend: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export async function sendCourseAssignedEmail(opts: {
  to: string;
  studentName: string;
  courseName: string;
  tenantName: string;
  loginUrl?: string;
}): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log(`[email] RESEND_API_KEY not set — skipping email to ${opts.to}`);
    return;
  }

  const { to, studentName, courseName, tenantName, loginUrl = "https://lms.erp360.org" } = opts;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1b60,#1e1b4b);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${tenantName}</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Learning Management System</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">🎓 You've been assigned a course!</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${studentName},</p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
              Great news! Your instructor has assigned you a new course. You can now access your learning materials and start studying.
            </p>
            <!-- Course card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;color:#15803d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Assigned Course</p>
                  <p style="margin:0;color:#0f172a;font-size:18px;font-weight:700;">${courseName}</p>
                </td>
              </tr>
            </table>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#4f46e5;border-radius:8px;">
                  <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Start Learning →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
              If you have any questions, contact your instructor or reply to this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">${tenantName} · Powered by OneSoft LMS</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await client.emails.send({
      from: `${tenantName} <onboarding@resend.dev>`,
      to,
      subject: `You've been assigned "${courseName}" on ${tenantName}`,
      html,
    });
    console.log(`[email] Sent course assignment email to ${to} for course "${courseName}"`);
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err);
  }
}
