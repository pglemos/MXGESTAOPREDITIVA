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
  const projectionColor = projection >= teamGoal ? '#22c55e' : '#ff3b3b'
  const reachingColor = reaching >= 100 ? '#22c55e' : reaching >= 80 ? '#ffe100' : '#ff3b3b'
  const pendingSellers = Array.isArray(metrics.pendingSellers) ? metrics.pendingSellers : []
  const sellers = ranking.length > 0
    ? ranking.map((row) => {
      const name = row.user_name ?? row.name ?? 'Vendedor'
      const leads = Number(row.leads ?? 0)
      const agd = Number(row.agd_total ?? row.agd ?? ((row.agd_cart_today ?? 0) + (row.agd_net_today ?? 0)))
      const yesterday = Number(row.vnd_yesterday ?? row.vnd_ontem ?? row.vndYesterday ?? 0)
      const total = Number(row.vnd_total ?? row.vt ?? row.total_mes ?? 0)

      return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin:0 0 12px 0;border:1px solid #c9d0d6;border-radius:6px;overflow:hidden;background:#ffffff;">
        <tr>
          <td colspan="4" style="background:#225a86;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;font-weight:800;text-transform:uppercase;padding:8px 18px;">${escapeHtml(String(name).toUpperCase())}</td>
        </tr>
        <tr>
          <td width="25%" align="center" style="background:#ededed;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:800;text-transform:uppercase;padding:6px 8px;">LEADS</td>
          <td width="25%" align="center" style="background:#ededed;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:800;text-transform:uppercase;padding:6px 8px;">AGD (HOJE)</td>
          <td width="25%" align="center" style="background:#ededed;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:800;text-transform:uppercase;padding:6px 8px;">VND (ONTEM)</td>
          <td width="25%" align="center" style="background:#ededed;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:900;text-transform:uppercase;padding:6px 8px;">TOTAL (MÊS)</td>
        </tr>
        <tr>
          <td align="center" style="background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:800;padding:10px 8px;">${leads}</td>
          <td align="center" style="background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:800;padding:10px 8px;">${agd}</td>
          <td align="center" style="background:#ffffff;color:#082b66;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:900;padding:10px 8px;">${yesterday}</td>
          <td align="center" style="background:#dcecf8;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:900;padding:10px 8px;">${total}</td>
        </tr>
      </table>`
    }).join('')
    : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 12px 0;background:#ffffff;border:1px solid #e5e7eb;"><tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;color:#666666;font-size:14px;font-weight:700;padding:18px;">Nenhum vendedor ativo encontrado.</td></tr></table>`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Relatório Matinal</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;color:#111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f2f2f2;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table role="presentation" width="860" cellspacing="0" cellpadding="0" style="width:860px;max-width:100%;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #d5d9de;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="background:#082b66;color:#ffffff;font-family:Arial,Helvetica,sans-serif;padding:28px 24px;">
              <div style="font-size:28px;line-height:34px;font-weight:900;text-transform:uppercase;">📊 RELATÓRIO MATINAL</div>
              <div style="font-size:18px;line-height:24px;margin-top:8px;">${escapeHtml(storeName.toUpperCase())} | Ref: ${escapeHtml(dateLabel)}</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#fffef1;border-bottom:1px solid #e7e7d8;font-family:Arial,Helvetica,sans-serif;padding:24px 18px;">
              <div style="font-size:22px;line-height:28px;color:#3d3d3d;font-weight:900;text-transform:uppercase;">🔎 FALTA POUCO: ${gap} ${pluralizeCar(gap)}</div>
              <div style="font-size:17px;line-height:24px;color:#111111;font-weight:900;text-transform:uppercase;margin-top:8px;">🔮 PROJEÇÃO ATUAL: FECHAR COM ${projection} ${pluralizeCar(projection)}</div>
              ${pendingSellers.length > 0 ? `<div style="font-size:15px;line-height:21px;color:#ff0000;font-weight:500;text-transform:uppercase;margin-top:10px;">⚠️ SEM REGISTRO HOJE: ${escapeHtml(pendingSellers.join(', ').toUpperCase())}</div>` : `<div style="font-size:15px;line-height:21px;color:#15803d;font-weight:700;text-transform:uppercase;margin-top:10px;">✅ TODOS REGISTRARAM HOJE</div>`}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 22px 0 22px;background:#ffffff;">${sellers}</td>
          </tr>
          <tr>
            <td style="padding:0 22px 0 22px;background:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#303030;margin:0;">
                <tr>
                  <td width="25%" align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:20px 8px;"><div style="font-size:18px;line-height:22px;text-transform:uppercase;">VENDAS</div><div style="font-size:24px;line-height:28px;font-weight:900;">${currentSales}</div></td>
                  <td width="25%" align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:20px 8px;"><div style="font-size:18px;line-height:22px;text-transform:uppercase;">META</div><div style="font-size:24px;line-height:28px;font-weight:900;">${teamGoal}</div></td>
                  <td width="25%" align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:20px 8px;"><div style="font-size:18px;line-height:22px;text-transform:uppercase;">PROJEÇÃO</div><div style="font-size:24px;line-height:28px;font-weight:900;color:${projectionColor};">${projection}</div></td>
                  <td width="25%" align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:20px 8px;"><div style="font-size:18px;line-height:22px;text-transform:uppercase;">ATING</div><div style="font-size:24px;line-height:28px;font-weight:900;color:${reachingColor};">${reaching}%</div></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#ffffff;padding:26px 22px 12px 22px;font-family:Arial,Helvetica,sans-serif;color:#666666;font-size:16px;line-height:22px;font-style:italic;">*O arquivo anexo contém duas abas: O Painel Visual e a <strong>Lista de Vendas Detalhada</strong> onde você pode aplicar filtros.</td>
          </tr>
          <tr>
            <td align="center" style="background:#ffffff;padding:0 22px 40px 22px;"><a href="#" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;border-radius:28px;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;font-weight:900;text-transform:uppercase;padding:17px 42px;">📲 ENVIAR NO WHATSAPP</a></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
