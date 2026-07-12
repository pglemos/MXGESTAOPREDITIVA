type Html2PdfOptions = {
  margin?: number | [number, number, number, number]
  filename: string
  image?: { type?: 'jpeg' | 'png' | 'webp'; quality?: number }
  html2canvas?: Record<string, unknown>
  jsPDF?: {
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc'
    format?: string | [number, number]
    orientation?: 'landscape' | 'portrait'
  }
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

function normalizeMargins(margin: Html2PdfOptions['margin']): [number, number, number, number] {
  if (Array.isArray(margin)) return margin
  const value = margin ?? 10
  return [value, value, value, value]
}

async function createVisualPdf(element: HTMLElement, options: Html2PdfOptions): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const [marginTop, marginRight, marginBottom, marginLeft] = normalizeMargins(options.margin)
  const orientation = options.jsPDF?.orientation ?? 'portrait'
  const format = options.jsPDF?.format ?? 'a4'
  const unit = options.jsPDF?.unit ?? 'mm'
  const pdf = new jsPDF({ unit, format, orientation })
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    ...options.html2canvas,
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - marginLeft - marginRight
  const contentHeight = pageHeight - marginTop - marginBottom
  const renderedHeight = (canvas.height * contentWidth) / canvas.width
  const imageType = options.image?.type ?? 'jpeg'
  const imageFormat = imageType.toUpperCase()
  const imageData = canvas.toDataURL(`image/${imageType}`, options.image?.quality ?? 0.95)
  const pageCount = Math.max(1, Math.ceil(renderedHeight / contentHeight))

  for (let page = 0; page < pageCount; page += 1) {
    if (page > 0) pdf.addPage(format, orientation)
    pdf.addImage(
      imageData,
      imageFormat,
      marginLeft,
      marginTop - (page * contentHeight),
      contentWidth,
      renderedHeight,
      undefined,
      'FAST',
    )
  }

  return pdf.output('blob')
}

export async function downloadHtmlAsPdf(element: HTMLElement, options: Html2PdfOptions) {
  let blob: Blob
  try {
    blob = await withTimeout(createVisualPdf(element, options), HTML_RENDER_TIMEOUT_MS)
  } catch {
    blob = await createTextFallbackPdf(element, options.filename)
  }

  clickBlobDownload(blob, options.filename)
}
