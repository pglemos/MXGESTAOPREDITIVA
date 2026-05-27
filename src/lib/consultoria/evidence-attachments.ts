import { supabase } from '@/lib/supabase'

const EVIDENCE_BUCKET = 'evidencias-consultoria'
const SIGNED_URL_TTL_SECONDS = 60 * 5

export type EvidenceAttachmentLink = {
  storage_path: string
  filename: string
}

export async function createEvidenceSignedUrl(file: EvidenceAttachmentLink, download = false) {
  const options = download ? { download: file.filename || true } : undefined
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS, options)

  if (error) throw error
  if (!data?.signedUrl) throw new Error('Não foi possível gerar o link do anexo.')

  return data.signedUrl
}

export async function openEvidenceAttachment(file: EvidenceAttachmentLink) {
  const target = window.open('', '_blank', 'noopener,noreferrer')
  try {
    const signedUrl = await createEvidenceSignedUrl(file)
    if (target) {
      target.location.href = signedUrl
    } else {
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    }
  } catch (error) {
    target?.close()
    throw error
  }
}

export async function downloadEvidenceAttachment(file: EvidenceAttachmentLink) {
  const signedUrl = await createEvidenceSignedUrl(file, true)
  const anchor = document.createElement('a')
  anchor.href = signedUrl
  anchor.download = file.filename
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
