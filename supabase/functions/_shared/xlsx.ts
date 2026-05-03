import JSZip from "https://esm.sh/jszip@3.10.1";
import { escapeXml } from "./format.ts";

type CellValue = string | number | boolean | null | undefined;

export type XlsxCell = {
  value: CellValue;
  style?: XlsxStyleKey;
};

export type XlsxRow = {
  cells: Array<XlsxCell | CellValue>;
  height?: number;
};

export type XlsxWorksheet = {
  name: string;
  columns?: number[];
  rows: XlsxRow[];
  merges?: string[];
  autoFilter?: string;
  freezeRow?: number;
};

export type XlsxStyleKey =
  | "title"
  | "subtitle"
  | "header"
  | "section"
  | "metricLabel"
  | "metricValue"
  | "greenMetric"
  | "statusGreen"
  | "statusAmber"
  | "statusRed"
  | "body"
  | "bodyCenter"
  | "bodyWrap"
  | "muted"
  | "danger"
  | "footnote";

const STYLE_IDS: Record<XlsxStyleKey, number> = {
  title: 1,
  subtitle: 2,
  header: 3,
  section: 4,
  metricLabel: 5,
  metricValue: 6,
  greenMetric: 7,
  statusGreen: 8,
  statusAmber: 9,
  statusRed: 10,
  body: 11,
  bodyCenter: 12,
  bodyWrap: 13,
  muted: 14,
  danger: 15,
  footnote: 16,
};

export function xlsxCell(value: CellValue, style: XlsxStyleKey = "body"): XlsxCell {
  return { value, style };
}

export function sanitizeSheetName(name: string, used = new Set<string>()) {
  const base = (name || "Planilha")
    .replace(/[\\/?*[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31) || "Planilha";
  let candidate = base;
  let counter = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${counter}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function buildXlsxBase64(inputSheets: XlsxWorksheet[]) {
  const usedSheetNames = new Set<string>();
  const sheets = inputSheets.map((sheet) => ({
    ...sheet,
    name: sanitizeSheetName(sheet.name, usedSheetNames),
  }));
  const zip = new JSZip();

  zip.file("[Content_Types].xml", contentTypesXml(sheets.length));
  zip.folder("_rels")?.file(".rels", rootRelsXml());
  zip.folder("docProps")?.file("core.xml", coreXml());
  zip.folder("docProps")?.file("app.xml", appXml(sheets.map((sheet) => sheet.name)));

  const xl = zip.folder("xl");
  xl?.file("workbook.xml", workbookXml(sheets));
  xl?.file("styles.xml", stylesXml());
  xl?.folder("_rels")?.file("workbook.xml.rels", workbookRelsXml(sheets.length));
  const worksheets = xl?.folder("worksheets");
  sheets.forEach((sheet, index) => {
    worksheets?.file(`sheet${index + 1}.xml`, worksheetXml(sheet));
  });

  return zip.generateAsync({
    type: "base64",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

function contentTypesXml(sheetCount: number) {
  const sheetOverrides = Array.from({ length: sheetCount }, (_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${sheetOverrides}
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function workbookRelsXml(sheetCount: number) {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function workbookXml(sheets: Array<{ name: string }>) {
  const sheetXml = sheets.map((sheet, index) =>
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView activeTab="0"/></bookViews>
  <sheets>${sheetXml}</sheets>
</workbook>`;
}

function coreXml() {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>MX Performance</dc:creator>
  <cp:lastModifiedBy>MX Performance</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function appXml(sheetNames: string[]) {
  const names = sheetNames.map((name) => `<vt:lpstr>${escapeXml(name)}</vt:lpstr>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>MX Performance</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${sheetNames.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${sheetNames.length}" baseType="lpstr">${names}</vt:vector></TitlesOfParts>
</Properties>`;
}

function worksheetXml(sheet: XlsxWorksheet) {
  const maxCols = Math.max(...sheet.rows.map((row) => row.cells.length), sheet.columns?.length || 1);
  const maxRows = Math.max(sheet.rows.length, 1);
  const dimension = `A1:${columnName(maxCols)}${maxRows}`;
  const cols = sheet.columns?.length
    ? `<cols>${sheet.columns.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const views = sheet.freezeRow
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sheet.freezeRow}" topLeftCell="A${sheet.freezeRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  const rows = sheet.rows.map((row, rowIndex) => rowXml(row, rowIndex + 1)).join("");
  const merges = sheet.merges?.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";
  const autoFilter = sheet.autoFilter ? `<autoFilter ref="${sheet.autoFilter}"/>` : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${dimension}"/>
  ${views}
  ${cols}
  <sheetData>${rows}</sheetData>
  ${autoFilter}
  ${merges}
</worksheet>`;
}

function rowXml(row: XlsxRow, rowNumber: number) {
  const height = row.height ? ` ht="${row.height}" customHeight="1"` : "";
  const cells = row.cells.map((rawCell, colIndex) => cellXml(normalizeCell(rawCell), rowNumber, colIndex + 1)).join("");
  return `<row r="${rowNumber}"${height}>${cells}</row>`;
}

function normalizeCell(rawCell: XlsxCell | CellValue): XlsxCell {
  if (rawCell && typeof rawCell === "object" && "value" in rawCell) return rawCell;
  return { value: rawCell, style: "body" };
}

function cellXml(cell: XlsxCell, rowNumber: number, colNumber: number) {
  const ref = `${columnName(colNumber)}${rowNumber}`;
  const style = cell.style ? ` s="${STYLE_IDS[cell.style]}"` : "";
  if (cell.value === null || cell.value === undefined || cell.value === "") {
    return `<c r="${ref}"${style}/>`;
  }
  if (typeof cell.value === "number") {
    return `<c r="${ref}"${style}><v>${Number.isFinite(cell.value) ? cell.value : 0}</v></c>`;
  }
  if (typeof cell.value === "boolean") {
    return `<c r="${ref}"${style} t="b"><v>${cell.value ? 1 : 0}</v></c>`;
  }
  return `<c r="${ref}"${style} t="inlineStr"><is><t>${escapeXml(String(cell.value))}</t></is></c>`;
}

function columnName(index: number) {
  let name = "";
  let value = index;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="9">
    <font><sz val="11"/><color rgb="FF0B100C"/><name val="Calibri"/></font>
    <font><b/><sz val="18"/><color rgb="FFE8F0EA"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF9BA89F"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFE8F0EA"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FF062012"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FF1FCB6E"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FFFFB547"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FFFF6B5B"/><name val="Calibri"/></font>
    <font><i/><sz val="11"/><color rgb="FF0B100C"/><name val="Calibri"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0B100C"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F1612"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF172019"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1FCB6E"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFB547"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFF6B5B"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FF243227"/></left><right style="thin"><color rgb="FF243227"/></right><top style="thin"><color rgb="FF243227"/></top><bottom style="thin"><color rgb="FF243227"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="17">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="7" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="7" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}
