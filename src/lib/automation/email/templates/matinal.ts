function pluralizeCar(value: number) {
  return value === 1 ? 'carro' : 'carros'
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const getMatinalEmailTemplate = (storeName: string, dateLabel: string, metrics: any, ranking: any[]) => {
  const currentSales = Number(metrics.currentSales ?? metrics.totalSales ?? 0)
  const teamGoal = Number(metrics.teamGoal ?? metrics.storeGoal ?? 0)
  const projection = Number(metrics.projection ?? 0)
  const gap = Number(metrics.gap ?? Math.max(teamGoal - currentSales, 0))
  const reaching = Number(metrics.reaching ?? (teamGoal > 0 ? Math.round((currentSales / teamGoal) * 1000) / 10 : 0))
  const projectionColor = projection >= teamGoal ? '#1FCB6E' : '#FF6B5B'
  const reachingColor = reaching >= 100 ? '#1FCB6E' : reaching >= 80 ? '#FFB547' : '#FF6B5B'
  const pendingSellers = Array.isArray(metrics.pendingSellers) ? metrics.pendingSellers : []
  const registrationColor = pendingSellers.length > 0 ? '#FF6B5B' : '#1FCB6E'
  const sellers = ranking.length > 0
    ? ranking.map((row) => {
      const name = row.user_name ?? row.name ?? 'Vendedor'
      const leads = Number(row.leads ?? 0)
      const agd = Number(row.agd_total ?? row.agd ?? ((row.agd_cart_today ?? 0) + (row.agd_net_today ?? 0)))
      const yesterday = Number(row.vnd_yesterday ?? row.vnd_ontem ?? row.vndYesterday ?? 0)
      const total = Number(row.vnd_total ?? row.vt ?? row.total_mes ?? 0)

      return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin:0 0 12px 0;border:1px solid #243227;border-radius:12px;overflow:hidden;background:#0A100C;">
        <tr>
          <td colspan="4" style="background:#0F1612;border-bottom:1px solid #172019;color:#E8F0EA;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:900;text-transform:uppercase;padding:13px 18px;">${escapeHtml(String(name).toUpperCase())}</td>
        </tr>
        <tr>
          <td width="25%" align="center" style="background:#0B100C;color:#5C6A60;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:900;text-transform:uppercase;padding:8px 8px;">Leads</td>
          <td width="25%" align="center" style="background:#0B100C;color:#5C6A60;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:900;text-transform:uppercase;padding:8px 8px;">Agd hoje</td>
          <td width="25%" align="center" style="background:#0B100C;color:#5C6A60;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:900;text-transform:uppercase;padding:8px 8px;">Vnd ontem</td>
          <td width="25%" align="center" style="background:#0B100C;color:#5C6A60;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:900;text-transform:uppercase;padding:8px 8px;">Total mês</td>
        </tr>
        <tr>
          <td align="center" style="background:#0A100C;color:#E8F0EA;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:24px;font-weight:900;padding:12px 8px;">${leads}</td>
          <td align="center" style="background:#0A100C;color:#E8F0EA;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:24px;font-weight:900;padding:12px 8px;">${agd}</td>
          <td align="center" style="background:#0A100C;color:#1FCB6E;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:24px;font-weight:900;padding:12px 8px;">${yesterday}</td>
          <td align="center" style="background:#0F1612;color:#1FCB6E;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:24px;font-weight:900;padding:12px 8px;">${total}</td>
        </tr>
      </table>`
    }).join('')
    : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 12px 0;background:#0A100C;border:1px solid #243227;border-radius:12px;"><tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;color:#9BA89F;font-size:14px;font-weight:700;padding:18px;">Nenhum vendedor ativo encontrado.</td></tr></table>`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MX Performance | Relatório Matinal</title>
</head>
<body style="margin:0;padding:0;background:#070A08;color:#E8F0EA;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#070A08;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 14px;background:#070A08;">
        <table role="presentation" width="860" cellspacing="0" cellpadding="0" style="width:860px;max-width:100%;border-collapse:separate;border-spacing:0;background:#0B100C;border:1px solid #243227;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#0F1612;border-bottom:1px solid #243227;font-family:Arial,Helvetica,sans-serif;padding:22px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="color:#1FCB6E;font-size:12px;line-height:16px;font-weight:900;text-transform:uppercase;">MX Performance</div>
                    <div style="color:#E8F0EA;font-size:28px;line-height:34px;font-weight:900;text-transform:uppercase;margin-top:4px;">Relatório Matinal</div>
                  </td>
                  <td align="right" style="vertical-align:middle;color:#9BA89F;font-size:13px;line-height:18px;font-weight:700;text-transform:uppercase;">Ref. ${escapeHtml(dateLabel)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#0B100C;border-bottom:1px solid #172019;font-family:Arial,Helvetica,sans-serif;padding:26px 24px;">
              <div style="color:#5C6A60;font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;">Loja monitorada</div>
              <div style="color:#E8F0EA;font-size:30px;line-height:36px;font-weight:900;text-transform:uppercase;margin-top:4px;">${escapeHtml(storeName.toUpperCase())}</div>
              <div style="margin-top:18px;border-left:4px solid ${projectionColor};background:#0A100C;border-radius:10px;padding:16px 18px;">
                <div style="color:#E8F0EA;font-size:21px;line-height:28px;font-weight:900;text-transform:uppercase;">Faltam ${gap} ${pluralizeCar(gap)} para a meta</div>
                <div style="color:#9BA89F;font-size:15px;line-height:22px;margin-top:4px;">Projeção atual de fechamento: <strong style="color:${projectionColor};">${projection} ${pluralizeCar(projection)}</strong></div>
                <div style="color:${registrationColor};font-size:13px;line-height:19px;font-weight:900;text-transform:uppercase;margin-top:10px;">${pendingSellers.length > 0 ? `Sem registro hoje: ${escapeHtml(pendingSellers.join(', ').toUpperCase())}` : 'Todos registraram hoje'}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 22px 0 22px;background:#0B100C;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:10px 0;margin:0 0 18px 0;">
                <tr>
                  <td width="25%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;"><div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Vendas</div><div style="font-size:27px;line-height:32px;font-weight:900;margin-top:4px;">${currentSales}</div></td>
                  <td width="25%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;"><div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Meta</div><div style="font-size:27px;line-height:32px;font-weight:900;margin-top:4px;">${teamGoal}</div></td>
                  <td width="25%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;"><div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Projeção</div><div style="font-size:27px;line-height:32px;font-weight:900;color:${projectionColor};margin-top:4px;">${projection}</div></td>
                  <td width="25%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;"><div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Ating.</div><div style="font-size:27px;line-height:32px;font-weight:900;color:${reachingColor};margin-top:4px;">${reaching}%</div></td>
                </tr>
              </table>
              ${sellers}
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#0B100C;padding:22px 22px 12px 22px;font-family:Arial,Helvetica,sans-serif;color:#9BA89F;font-size:14px;line-height:21px;">O anexo mantém o painel visual e a lista detalhada para filtros operacionais.</td>
          </tr>
          <tr>
            <td align="center" style="background:#0B100C;padding:0 22px 38px 22px;"><a href="#" style="display:inline-block;background:#1FCB6E;color:#062012;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:900;text-transform:uppercase;padding:15px 34px;">Enviar no WhatsApp</a></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
