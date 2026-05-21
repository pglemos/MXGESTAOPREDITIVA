export const preRegistrationSelect = [
  'id',
  'store_id',
  'store_name_snapshot',
  'auth_user_id',
  'full_name',
  'email',
  'phone',
  'role',
  'segment',
  'store_tenure',
  'market_experience',
  'notes',
  'company_legal_name',
  'company_cnpj',
  'company_address',
  'company_administrative_phone',
  'avatar_url',
  'avatar_storage_path',
  'status',
  'submitted_at',
  'reviewed_by',
  'reviewed_at',
  'approved_by',
  'approved_at',
  'rejected_by',
  'rejected_at',
  'approval_note',
].join(', ')

export function getPreRegistrationIdFromLink(link?: string | null) {
  if (!link) return null

  try {
    const url = new URL(link, 'https://mx.local')
    return (
      url.searchParams.get('preRegistrationId') ||
      url.searchParams.get('pre_registration_id')
    )
  } catch {
    return null
  }
}
