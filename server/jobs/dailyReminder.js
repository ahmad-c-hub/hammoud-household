const cron = require('node-cron');
const pool = require('../db');
const { sendEmail } = require('../services/emailService');

function reminderHtml(name) {
  const spendUrl = (process.env.APP_URL || '').replace(/\/$/, '') + '/spend';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:#4f46e5;padding:28px 36px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">Hammoud Household Finance</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1e293b;">Hi ${name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
              You haven't logged any spending for today. Don't forget to keep your household finances up to date.
            </p>
            <a href="${spendUrl}"
               style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">
              Log Spending Now
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              This is an automated reminder from Hammoud Household Finance.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendDailyReminders() {
  const today = new Date().toISOString().slice(0, 10);

  const { rows: users } = await pool.query(
    `SELECT id, name, email FROM users WHERE can_spend = true AND email IS NOT NULL`
  );

  const { rows: todayEntries } = await pool.query(
    `SELECT DISTINCT user_id FROM spend_entries WHERE date = $1`,
    [today]
  );
  const spentToday = new Set(todayEntries.map(r => r.user_id));

  let sent = 0;
  for (const user of users) {
    if (spentToday.has(user.id)) continue;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reminder: Log your spending for today',
        html: reminderHtml(user.name),
      });
      sent++;
    } catch {
      // already logged inside sendEmail
    }
  }

  console.log(`Daily reminders: ${sent} sent for ${today}`);
  return sent;
}

// 9 PM Beirut time = 18:00 UTC (UTC+3)
cron.schedule('0 18 * * *', () => {
  sendDailyReminders().catch(err => console.error('Daily reminder job failed:', err.message));
});

module.exports = { sendDailyReminders };
