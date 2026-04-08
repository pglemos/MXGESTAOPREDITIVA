export const getMatinalEmailTemplate = (storeName: string, funnelData: any, metaInfo: any) => {
    const statusColor = metaInfo.pacing >= 1 ? '#16a34a' : '#dc2626';
    const statusText = metaInfo.pacing >= 1 ? 'META EM DIA' : 'ATENÇÃO: ABAIXO DA META';

    return `
<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; background: #f4f4f5; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <h1 style="color: #1e3a8a; margin-top: 0;">MX Performance | ${storeName}</h1>
        
        <div style="background: ${statusColor}; color: white; padding: 10px; border-radius: 6px; text-align: center; font-weight: bold; margin-bottom: 20px;">
            ${statusText} (Pacing: ${(metaInfo.pacing * 100).toFixed(0)}%)
        </div>

        <h2 style="font-size: 16px; color: #475569;">Resumo de Funil (D-1)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f8fafc;">
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Leads</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${funnelData?.leads || 0}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Agendamentos</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${funnelData?.agd_total || 0}</td>
            </tr>
            <tr style="background: #f8fafc;">
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Visitas</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${funnelData?.visitas || 0}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Vendas</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">${funnelData?.vnd_total || 0}</td>
            </tr>
        </table>

        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;"><strong>Ação sugerida:</strong> ${metaInfo.pacing < 0.9 ? 'Focar em agendamentos de carteira para recuperar gap.' : 'Manter ritmo de fechamento.'}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="https://app.mx-performance.com/dashboard" style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Dashboard Completo</a>
        </div>
    </div>
</body>
</html>
`;
};
