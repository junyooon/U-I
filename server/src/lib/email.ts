import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface DriftingContact {
  name: string
  daysSince: number | null
  category: string
}

export async function sendWeeklyDigest(
  toEmail: string,
  userName: string,
  contacts: DriftingContact[],
) {
  if (!process.env.RESEND_API_KEY) return

  const rows = contacts.map(c => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:#e5e7eb;font-size:14px;">${c.name}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:#6b7280;font-size:14px;">${c.category}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:#9ca3af;font-size:14px;text-align:right;">
        ${c.daysSince !== null ? `${c.daysSince}d ago` : 'Never'}
      </td>
    </tr>
  `).join('')

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: toEmail,
    subject: `U&I — ${contacts.length} connection${contacts.length !== 1 ? 's' : ''} drifting this week`,
    html: `<!DOCTYPE html>
<html>
<body style="background:#0a0f1e;margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="color:#fff;font-size:22px;margin:0 0 4px;">U&amp;I</h1>
    <p style="color:#6b7280;font-size:13px;margin:0 0 32px;">Your world of connections</p>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;line-height:1.6;">
      Hey ${userName} — here are the people you haven't connected with in a while.
    </p>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="padding:8px 0;color:#4b5563;font-size:11px;font-weight:600;letter-spacing:1px;text-align:left;text-transform:uppercase;">Name</th>
          <th style="padding:8px 0;color:#4b5563;font-size:11px;font-weight:600;letter-spacing:1px;text-align:left;text-transform:uppercase;">Circle</th>
          <th style="padding:8px 0;color:#4b5563;font-size:11px;font-weight:600;letter-spacing:1px;text-align:right;text-transform:uppercase;">Last contact</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#374151;font-size:12px;margin:32px 0 0;line-height:1.6;">
      You're receiving this because you enabled weekly digests in U&amp;I.
    </p>
  </div>
</body>
</html>`,
  })
}
