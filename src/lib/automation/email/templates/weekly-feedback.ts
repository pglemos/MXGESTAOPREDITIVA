function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const getWeeklyFeedbackEmailTemplate = (storeName: string, dateRange: string, feedbackData: any[]) => {
  const blocks = feedbackData.map((feedback) => {
    const name = feedback.seller_name ?? feedback.name ?? 'Vendedor'
    const text = feedback.whatsapp_text ?? feedback.feedbackText ?? feedback.message ?? ''

    return `
      <tr>
        <td style="padding:0 0 28px 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f7f7f7;border-left:6px solid #14555f;">
            <tr>
              <td style="font-family:Arial,Helvetica,sans-serif;color:#111111;padding:22px 28px;">
                <div style="font-size:20px;line-height:26px;font-weight:900;text-transform:uppercase;margin:0 0 18px 0;">${escapeHtml(String(name).toUpperCase())}</div>
                <div style="font-size:16px;line-height:22px;color:#3f3f3f;white-space:pre-line;">${escapeHtml(text)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Feedback Semanal</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#ffffff;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:34px 18px;">
        <table role="presentation" width="980" cellspacing="0" cellpadding="0" style="width:980px;max-width:100%;border-collapse:collapse;background:#ffffff;">
          <tr>
            <td style="font-family:Arial,Helvetica,sans-serif;color:#103f49;padding:0 0 22px 0;">
              <div style="font-size:28px;line-height:36px;font-weight:900;">📊 Feedback Semanal: ${escapeHtml(storeName.toUpperCase())}</div>
            </td>
          </tr>
          <tr>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:24px;color:#111111;padding:0 0 24px 0;">
              <strong>Período:</strong> ${escapeHtml(dateRange)}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 26px 0;">
              <a href="#" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;border-radius:7px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:24px;font-weight:900;text-transform:uppercase;padding:18px 42px;">📂 ABRIR RELATÓRIO COMPLETO</a>
            </td>
          </tr>
          <tr>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:28px;color:#111111;font-weight:900;padding:0 0 18px 0;">
              📝 Sugestões de Mensagem (Copiar e Colar)
            </td>
          </tr>
          ${blocks}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
