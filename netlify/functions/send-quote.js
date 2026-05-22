// Netlify Function: send-quote
// Sends quote PDF via Resend to customer + admin

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, body: 'Email service not configured' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { to, subject, html, pdfBase64, quoteId, adminEmail } = body;

  if (!to || !subject || !html) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const attachments = pdfBase64
    ? [{ filename: `dtfstudio-quote-${quoteId}.pdf`, content: pdfBase64 }]
    : [];

  // Send to customer
  const customerResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'DTF Studio Helsinki <hello@dtfstudio.fi>',
      to: [to],
      subject,
      html,
      attachments,
    }),
  });

  if (!customerResp.ok) {
    const err = await customerResp.text();
    console.error('Resend customer error:', err);
    return { statusCode: 502, body: `Email send failed: ${err}` };
  }

  const customerData = await customerResp.json();

  // Send admin alert
  if (adminEmail && adminEmail !== to) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DTF Studio Helsinki <hello@dtfstudio.fi>',
        to: [adminEmail],
        subject: `[Admin] Uusi tarjouspyyntö #${quoteId} — ${to}`,
        html: `<p>Uusi tarjouspyyntö vastaanotettu asiakkaalta <strong>${to}</strong>.</p><p>Tarjous: <strong>#${quoteId}</strong></p>`,
        attachments,
      }),
    }).catch(e => console.error('Admin email error:', e));
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: customerData.id, ok: true }),
  };
};
