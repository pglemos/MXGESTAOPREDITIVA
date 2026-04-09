import { DailyCheckin, RankingEntry } from '@/types/database';
import { calcularFunil, MX_BENCHMARKS } from '@/lib/calculations';
import ExcelJS from 'exceljs';

export async function generateMorningReportXlsx(storeName: string, dateLabel: string, ranking: RankingEntry[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Painel Visual');
    
    // Configurações de Estilo
    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };

    // 1. Título do Relatório
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `RELATÓRIO MATINAL — ${storeName.toUpperCase()}`;
    titleCell.style = { ...headerStyle, font: { ...headerStyle.font, size: 14 } };
    worksheet.getRow(1).height = 40;

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Referência: ${dateLabel}`;
    worksheet.getCell('A2').style = { alignment: { horizontal: 'center' }, font: { bold: true, color: { argb: '64748B' } } };

    // 2. Cabeçalho da Tabela de Ranking
    const tableHeaderRow = 4;
    const columns = ['Especialista', 'Leads', 'Agendamentos', 'Visitas', 'Vendas', 'Atingimento (%)'];
    columns.forEach((col, i) => {
        const cell = worksheet.getCell(tableHeaderRow, i + 1);
        cell.value = col;
        cell.style = headerStyle;
    });
    worksheet.getRow(tableHeaderRow).height = 30;

    // 3. Dados do Ranking
    ranking.forEach((r, idx) => {
        const rowIdx = tableHeaderRow + 1 + idx;
        worksheet.getCell(rowIdx, 1).value = r.user_name;
        worksheet.getCell(rowIdx, 2).value = r.leads || 0;
        worksheet.getCell(rowIdx, 3).value = r.agd_total || 0;
        worksheet.getCell(rowIdx, 4).value = r.visitas || 0;
        worksheet.getCell(rowIdx, 5).value = r.vnd_total || 0;
        worksheet.getCell(rowIdx, 6).value = (r.atingimento || 0) / 100;
        worksheet.getCell(rowIdx, 6).numFmt = '0.0%';

        // Alternar cores de linha
        if (idx % 2 === 0) {
            for (let i = 1; i <= 6; i++) {
                worksheet.getCell(rowIdx, i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
            }
        }
    });

    // 4. Rodapé / Totais
    const footerRowIdx = tableHeaderRow + ranking.length + 2;
    worksheet.mergeCells(`A${footerRowIdx}:A${footerRowIdx + 1}`);
    worksheet.getCell(`A${footerRowIdx}`).value = 'TOTAIS DA UNIDADE';
    worksheet.getCell(`A${footerRowIdx}`).style = headerStyle;

    const totals = {
        leads: ranking.reduce((s, r) => s + (r.leads || 0), 0),
        agd: ranking.reduce((s, r) => s + (r.agd_total || 0), 0),
        vis: ranking.reduce((s, r) => s + (r.visitas || 0), 0),
        vnd: ranking.reduce((s, r) => s + (r.vnd_total || 0), 0),
    };

    worksheet.getCell(footerRowIdx, 2).value = totals.leads;
    worksheet.getCell(footerRowIdx, 3).value = totals.agd;
    worksheet.getCell(footerRowIdx, 4).value = totals.vis;
    worksheet.getCell(footerRowIdx, 5).value = totals.vnd;

    // Ajustar larguras
    worksheet.columns.forEach(col => { col.width = 20; });

    return await workbook.xlsx.writeBuffer() as any;
}

export async function generateFeedbackXlsx(sellerName: string, data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Feedback Individual');

    // Estilos MX
    const titleStyle: Partial<ExcelJS.Style> = { font: { bold: true, color: { argb: 'FFFFFF' }, size: 14 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '134F5C' } }, alignment: { horizontal: 'center' } };
    const subTitleStyle: Partial<ExcelJS.Style> = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1C232' } } };

    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = `RESUMO DO VENDEDOR: ${sellerName.toUpperCase()}`;
    worksheet.getCell('A1').style = titleStyle;

    // Números Reais
    worksheet.getRow(3).values = ['Leads Recebidos', 'Agendamentos Feitos', 'Visitas Realizadas', 'Vendas Fechadas', 'Sua Meta Semanal'];
    worksheet.getRow(4).values = [data.leads, data.agend, data.visitas, data.vendas, data.meta];
    
    // Estilizar cabeçalho de números
    for (let i = 1; i <= 5; i++) {
        worksheet.getCell(3, i).style = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } }, alignment: { horizontal: 'center' } };
        worksheet.getCell(4, i).style = { alignment: { horizontal: 'center' } };
    }

    // Real vs Ideal
    worksheet.mergeCells('A6:E6');
    worksheet.getCell('A6').value = 'ANÁLISE DE APROVEITAMENTO (REAL vs IDEAL)';
    worksheet.getCell('A6').style = subTitleStyle;

    const idealAgend = Math.round(data.leads * (MX_BENCHMARKS.lead_agd / 100));
    const idealVisitas = Math.round(data.agend * (MX_BENCHMARKS.agd_visita / 100));
    const idealVendas = Math.round(data.visitas * (MX_BENCHMARKS.visita_vnd / 100));

    const funnelAnalysis = [
        ['Etapa do Processo', 'Seu Resultado', 'O Ideal Seria', 'Status'],
        ['De Leads para Agendamentos', data.agend, idealAgend, data.agend >= idealAgend ? 'BOM' : 'ABAIXO'],
        ['De Agendamentos para Visitas', data.visitas, idealVisitas, data.visitas >= idealVisitas ? 'BOM' : 'ABAIXO'],
        ['De Visitas para Vendas', data.vendas, idealVendas, data.vendas >= idealVendas ? 'BOM' : 'ABAIXO']
    ];

    funnelAnalysis.forEach((row, i) => {
        worksheet.getRow(7 + i).values = row;
        if (i === 0) {
            for (let j = 1; j <= 4; j++) worksheet.getCell(7, j).style = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } } };
        }
    });

    // Diagnóstico
    worksheet.mergeCells('A12:A13');
    worksheet.getCell('A12').value = 'DIAGNÓSTICO:';
    worksheet.getCell('A12').style = { font: { bold: true } };
    worksheet.mergeCells('B12:E13');
    worksheet.getCell('B12').value = data.gargalo;
    worksheet.getCell('B12').style = { font: { bold: true, color: { argb: 'FF0000' } }, alignment: { wrapText: true } };

    worksheet.columns.forEach(col => col.width = 25);

    return await workbook.xlsx.writeBuffer() as any;
}
