export function buildWelcomeHtml(userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:8px;overflow:hidden;">
        <tr><td style="background-color:#27262E;padding:24px 32px;">
          <h1 style="color:#E19C63;font-size:20px;margin:0;font-weight:700;">KVANT</h1>
          <p style="color:#FFFFFF;font-size:14px;margin:4px 0 0 0;">Welcome to Kvant</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 16px 0;">
            Welcome${userName ? `, ${userName}` : ""}!
          </h2>
          <p style="color:#4B5563;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
            You're now part of Kvant — your AI-powered agency toolkit.
          </p>
          <p style="color:#4B5563;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
            Here's what you can do right away:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:12px 0;border-bottom:1px solid #E5E7EB;">
              <a href="https://kvantio.vercel.app/dashboard" style="color:#E19C63;font-size:14px;font-weight:500;text-decoration:none;">Visit your dashboard &rarr;</a>
              <p style="color:#6B7280;font-size:12px;margin:4px 0 0 0;">See your AI reports, brand monitoring, and more</p>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #E5E7EB;">
              <a href="https://kvantio.vercel.app/dashboard/connections" style="color:#E19C63;font-size:14px;font-weight:500;text-decoration:none;">Connect your data &rarr;</a>
              <p style="color:#6B7280;font-size:12px;margin:4px 0 0 0;">Link GA4, Google Ads, or Meta Ads</p>
            </td></tr>
            <tr><td style="padding:12px 0;">
              <a href="https://kvantio.vercel.app/dashboard/settings/branding" style="color:#E19C63;font-size:14px;font-weight:500;text-decoration:none;">Customize your brand &rarr;</a>
              <p style="color:#6B7280;font-size:12px;margin:4px 0 0 0;">Set your agency colors and logo</p>
            </td></tr>
          </table>
          <p style="color:#6B7280;font-size:12px;line-height:1.5;margin:24px 0 0 0;">
            Need help? Reply to this email or check our documentation.
          </p>
        </td></tr>
        <tr><td style="background-color:#F9FAFB;padding:16px 32px;text-align:center;">
          <p style="color:#8BA5BE;font-size:11px;margin:0;">
            Kvant — AI-Powered Agency Toolkit &bull; <a href="https://kvantio.vercel.app" style="color:#8BA5BE;">kvantio.vercel.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
