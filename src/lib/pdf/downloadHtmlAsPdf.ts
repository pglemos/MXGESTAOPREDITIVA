import html2pdf from 'html2pdf.js'

type Html2PdfOptions = {
  margin?: number | [number, number, number, number]
  filename: string
  image?: { type?: 'jpeg' | 'png' | 'webp'; quality?: number }
  html2canvas?: Record<string, unknown>
  jsPDF?: { unit?: string; format?: string | [number, number]; orientation?: 'landscape' | 'portrait' }
}

const HTML_RENDER_TIMEOUT_MS = 18000

function clickBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('PDF HTML render timed out')), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId)
  }
}

async function createTextFallbackPdf(element: HTMLElement, filename: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const title = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
  const rawText = (element.innerText || element.textContent || title)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text(title, 14, 18)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  const lines = pdf.splitTextToSize(rawText, 182)
  let y = 30
  for (const line of lines) {
    if (y > 282) {
      pdf.addPage()
      y = 18
    }
    pdf.text(line, 14, y)
    y += 4.5
  }

  return pdf.output('blob')
}

export async function downloadHtmlAsPdf(element: HTMLElement, options: Html2PdfOptions) {
  const htmlRender = html2pdf()
    .set(options)
    .from(element)
    .toPdf()
    .outputPdf('blob') as Promise<Blob>

  htmlRender.catch(() => undefined)

  let blob: Blob
  try {
    blob = await withTimeout(htmlRender, HTML_RENDER_TIMEOUT_MS)
  } catch {
    blob = await createTextFallbackPdf(element, options.filename)
  }

  clickBlobDownload(blob, options.filename)
}
