import os
import zipfile
import re
from bs4 import BeautifulSoup
import pandas as pd

doc_dir = "../../Desktop/MX"
output_file = "detailed_validation.md"

files = [
    "📍 VISITA 7 PDI 18-03.docx",
    "DNA - Resumo Executivo das Entrevistas de Diagnóstico.docx",
    "Gandini - Resumo Executivo das Entrevistas de Diagnóstico.docx",
    "MODELO PADRAO DE RELATORIOS DE VISITAS.docx",
    "VISITA 6 DNA 11-03.docx",
    "VISITA 9 09-04.docx",
    "GANDINI - PMR - PLANEJAMENTO ESTRATEGICO - 2026.pptx",
    "PMR - DNA VEICULOS - PLANEJAMENTO ESTRATEGICO.pptx",
    "_CRONOGRAMA 2026 MX ESCOLA DE NEGOCIOS .xlsx",
    "Antonio - Plano_Desenvolvimento_Individual.xlsx",
    "Dados leads 1 a 11.xlsx",
    "DRE.xlsx",
    "ESTOQUE DNA VEICULOS.xlsx",
    "AGENDA.html",
    "AULAS.html",
    "CRM.html",
    "DRE.html",
    "EVENTOS ONLINE.html",
    "EVENTOS PRESENCIAIS.html",
    "OBJETIVO_VISITA.html"
]

with open(output_file, "w", encoding="utf-8") as out:
    for f in files:
        path = os.path.join(doc_dir, f)
        out.write(f"\n# DOCUMENTO: {f}\n")
        
        if not os.path.exists(path):
            out.write("ARQUIVO NÃO ENCONTRADO\n")
            continue
            
        if f.endswith(".docx"):
            try:
                with zipfile.ZipFile(path) as docx:
                    content = docx.read('word/document.xml').decode('utf-8')
                    text = re.sub('<[^<]+>', ' ', content)
                    text = re.sub('\s+', ' ', text).strip()
                    out.write("## TEXTO COMPLETO EXTRAÍDO\n")
                    out.write(text + "\n")
            except Exception as e:
                out.write(f"Erro: {e}\n")
                
        elif f.endswith(".pptx"):
            try:
                with zipfile.ZipFile(path) as pptx:
                    slide_files = [name for name in pptx.namelist() if name.startswith('ppt/slides/slide')]
                    out.write("## TEXTO DOS SLIDES\n")
                    for slide_file in sorted(slide_files):
                        content = pptx.read(slide_file).decode('utf-8')
                        text = re.sub('<[^<]+>', ' ', content)
                        text = re.sub('\s+', ' ', text).strip()
                        out.write(f"**{slide_file}**: {text}\n")
            except Exception as e:
                out.write(f"Erro: {e}\n")
                
        elif f.endswith(".xlsx"):
            try:
                df_dict = pd.read_excel(path, sheet_name=None)
                out.write(f"## ANÁLISE ESTRUTURAL DA PLANILHA (Abas: {len(df_dict)})\n")
                for sheet_name, df in df_dict.items():
                    out.write(f"\n### ABA: {sheet_name}\n")
                    out.write(f"- Total de Linhas: {len(df)}\n")
                    out.write(f"- Colunas: {', '.join([str(c) for c in df.columns])}\n")
                    out.write("- Amostra de Dados (Primeiras 5 linhas completas):\n")
                    out.write(df.head(5).to_string() + "\n")
            except Exception as e:
                out.write(f"Erro: {e}\n")
                
        elif f.endswith(".html"):
            try:
                with open(path, "r", encoding="utf-8") as html_file:
                    soup = BeautifulSoup(html_file, 'html.parser')
                    tables = soup.find_all('table')
                    out.write(f"## ANÁLISE DE TABELAS HTML (Tabelas: {len(tables)})\n")
                    for idx, table in enumerate(tables):
                        rows = table.find_all('tr')
                        out.write(f"\n### Tabela {idx+1} (Linhas: {len(rows)})\n")
                        for r_idx, row in enumerate(rows):
                            cols = [col.get_text(strip=True) for col in row.find_all(['th', 'td'])]
                            if r_idx < 10: # Imprime as primeiras 10 linhas para ver os headers reais
                                out.write(f"L{r_idx}: " + " | ".join(cols) + "\n")
                            elif r_idx == 10:
                                out.write("... (mais linhas ocultas para não poluir) ...\n")
            except Exception as e:
                out.write(f"Erro: {e}\n")

print("Analise completa gerada.")
