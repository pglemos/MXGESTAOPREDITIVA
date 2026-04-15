import os
import zipfile
import re
from bs4 import BeautifulSoup
import pandas as pd

doc_dir = "../../Desktop/MX"
output_file = "all_docs_extracted.txt"

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
    "estoque.xls",
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
        out.write(f"\n{'='*50}\nFILE: {f}\n{'='*50}\n")
        
        if not os.path.exists(path):
            out.write("FILE NOT FOUND\n")
            continue
            
        if f.endswith(".docx"):
            try:
                with zipfile.ZipFile(path) as docx:
                    content = docx.read('word/document.xml').decode('utf-8')
                    text = re.sub('<[^<]+>', ' ', content)
                    text = re.sub('\s+', ' ', text).strip()
                    out.write(text + "\n")
            except Exception as e:
                out.write(f"Error: {e}\n")
                
        elif f.endswith(".pptx"):
            try:
                with zipfile.ZipFile(path) as pptx:
                    slide_files = [name for name in pptx.namelist() if name.startswith('ppt/slides/slide')]
                    for slide_file in sorted(slide_files):
                        content = pptx.read(slide_file).decode('utf-8')
                        text = re.sub('<[^<]+>', ' ', content)
                        text = re.sub('\s+', ' ', text).strip()
                        out.write(f"--- {slide_file} ---\n{text}\n")
            except Exception as e:
                out.write(f"Error: {e}\n")
                
        elif f.endswith(".xlsx") or f.endswith(".xls"):
            try:
                df = pd.read_excel(path, sheet_name=None)
                for sheet_name, sheet_df in df.items():
                    out.write(f"--- Sheet: {sheet_name} ---\n")
                    out.write(sheet_df.to_string(index=False)[:2000] + "\n... (truncated if too long)\n")
            except Exception as e:
                out.write(f"Error: {e}\n")
                
        elif f.endswith(".html"):
            try:
                with open(path, "r", encoding="utf-8") as html_file:
                    soup = BeautifulSoup(html_file, 'html.parser')
                    out.write(soup.get_text(separator=' ', strip=True)[:5000] + "\n... (truncated if too long)\n")
            except Exception as e:
                out.write(f"Error: {e}\n")

print("Done parsing.")
