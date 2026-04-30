import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { createRequire } from 'module'
import type { WorkBook } from 'xlsx'

loadEnv()

type Cell = string | number | boolean | Date | null
type Row = Cell[]

const require = createRequire(import.meta.url)
const XLSX = require('xlsx') as typeof import('xlsx')

type AdminUser = {
  id: string
  name: string
  email: string
}

type SourceClient = {
  sourceKey: string
  name: string
  productName: string | null
  modality: string | null
  consultantName: string | null
  target: string | null
  notes: string | null
  payload: Record<string, unknown>
}

type SourceVisit = {
  sourceKey: string
  sourceVisitCode: string
  visitNumber: number
  clientName: string
  productName: string | null
  scheduledAt: string | null
  durationHours: number
  modality: string
  consultantName: string | null
  auxiliaryConsultantName: string | null
  target: string | null
  objective: string | null
  googleEventId: string | null
  rowNumber: number
  payload: Record<string, unknown>
}

type SourceScheduleEvent = {
  sourceKey: string
  sourceSheet: string
  eventType: 'aula' | 'evento_online' | 'evento_presencial'
  title: string
  topic: string | null
  startsAt: string | null
  durationHours: number
  modality: string
  location: string | null
  targetAudience: string | null
  audienceGoal: number | null
  responsibleName: string | null
  ticketPriceText: string | null
  googleEventId: string | null
  rowNumber: number
  payload: Record<string, unknown>
}

type SourceObjective = {
  visitNumber: number
  objective: string
  duration: string | null
  target: string | null
  checklist: string[]
  evidence: string | null
  reportModel: string | null
  salesMoment: string | null
  payload: Record<string, unknown>
}

const DEFAULT_XLSX_PATH = '/Users/pedroguilherme/Downloads/_CRONOGRAMA 2026 MX ESCOLA DE NEGOCIOS .xlsx'
const SOURCE_NAME = 'cronograma-2026-mx-escola-de-negocios'

function argValue(name: string) {
  const prefix = `${name}=`
  const arg = process.argv.find((item) => item.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : null
}

const shouldApply = process.argv.includes('--apply')
const replaceSource = process.argv.includes('--replace-source')
const filePath = argValue('--file') || DEFAULT_XLSX_PATH

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function clean(value: Cell | undefined) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function nullable(value: Cell | undefined) {
  const text = clean(value)
  return text ? text : null
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizePersonName(value: string | null) {
  return value ? normalizeText(value.replace(/^consultor\s+/i, '')) : ''
}

function toNumber(value: Cell | undefined, fallback = 0) {
  const text = clean(value).replace(/[^\d,-.]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseVisitNumber(value: Cell | undefined) {
  const text = clean(value)
  const parsed = Number(text)
  return {
    sourceVisitCode: text || '0',
    visitNumber: Number.isInteger(parsed) ? parsed : 0,
  }
}

function parseDateBR(value: Cell | undefined) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  const text = clean(value)
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
}

function parseTimeParts(value: Cell | undefined) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { hours: value.getHours(), minutes: value.getMinutes() }
  }
  const text = clean(value)
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  return { hours: Number(match[1]), minutes: Number(match[2]) }
}

function combineDateTime(dateValue: Cell | undefined, timeValue: Cell | undefined) {
  const date = parseDateBR(dateValue)
  const time = parseTimeParts(timeValue) || { hours: 9, minutes: 0 }
  if (!date) return null
  date.setHours(time.hours, time.minutes, 0, 0)
  return date.toISOString()
}

function splitChecklist(value: Cell | undefined) {
  const text = clean(value)
  if (!text) return []
  return text
    .split(/\n|(?:^|\s)\d+\.\s+/)
    .map((item) => item.replace(/^\d+\.\s*/, '').replace(/;$/, '').trim())
    .filter(Boolean)
}

function rowsFromSheet(workbook: WorkBook, sheetName: string): Row[] {
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false }) as Row[]
}

function nonEmpty(row: Row) {
  return row.some((cell) => clean(cell) !== '')
}

function parseWorkbook(path: string) {
  const workbook = XLSX.readFile(path, { cellDates: true })
  const agendaRows = rowsFromSheet(workbook, 'AGENDA')
  const crmRows = rowsFromSheet(workbook, 'CRM')
  const objectiveRows = rowsFromSheet(workbook, 'OBJETIVO_VISITA')
  const onlineRows = rowsFromSheet(workbook, 'EVENTOS ONLINE')
  const presencialRows = rowsFromSheet(workbook, 'EVENTOS PRESENCIAIS')
  const aulasRows = rowsFromSheet(workbook, 'AULAS')

  const clients = new Map<string, SourceClient>()
  const visits: SourceVisit[] = []
  const events: SourceScheduleEvent[] = []
  const objectives: SourceObjective[] = []

  for (const [index, row] of crmRows.slice(1).entries()) {
    if (!nonEmpty(row)) continue
    const name = clean(row[1])
    if (!name) continue
    const key = `cronograma-2026:client:${normalizeText(name)}`
    clients.set(key, {
      sourceKey: key,
      name,
      productName: nullable(row[2]),
      consultantName: nullable(row[3]),
      modality: nullable(row[4]),
      target: nullable(row[5]),
      notes: nullable(row[6]),
      payload: { sheet: 'CRM', rowNumber: index + 2, row },
    })
  }

  for (const [index, row] of agendaRows.slice(5).entries()) {
    if (!nonEmpty(row)) continue
    const clientName = clean(row[1])
    if (!clientName) continue
    const rowNumber = index + 6
    const { sourceVisitCode, visitNumber } = parseVisitNumber(row[0])
    const scheduledAt = combineDateTime(row[3], row[4])
    const googleEventId = nullable(row[12])
    const sourceKey = `cronograma-2026:visit:${rowNumber}:${googleEventId || normalizeText(clientName)}`
    const productName = nullable(row[2])
    const modality = nullable(row[6]) || 'Presencial'
    visits.push({
      sourceKey,
      sourceVisitCode,
      visitNumber,
      clientName,
      productName,
      scheduledAt,
      durationHours: toNumber(row[5], 3) || 3,
      modality,
      consultantName: nullable(row[7]),
      auxiliaryConsultantName: nullable(row[8]),
      target: nullable(row[9]),
      objective: nullable(row[10]),
      googleEventId,
      rowNumber,
      payload: { sheet: 'AGENDA', rowNumber, row },
    })

    const clientKey = `cronograma-2026:client:${normalizeText(clientName)}`
    if (!clients.has(clientKey)) {
      clients.set(clientKey, {
        sourceKey: clientKey,
        name: clientName,
        productName,
        modality,
        consultantName: nullable(row[7]),
        target: nullable(row[9]),
        notes: nullable(row[10]),
        payload: { sheet: 'AGENDA', rowNumber, row },
      })
    }
  }

  for (const [index, row] of objectiveRows.slice(2).entries()) {
    if (!nonEmpty(row)) continue
    const visitNumber = toNumber(row[0], 0)
    const objective = clean(row[1])
    if (!visitNumber || !objective) continue
    objectives.push({
      visitNumber,
      objective,
      duration: nullable(row[2]),
      target: nullable(row[3]),
      checklist: splitChecklist(row[4]),
      evidence: nullable(row[5]),
      reportModel: nullable(row[6]),
      salesMoment: nullable(row[7]),
      payload: { sheet: 'OBJETIVO_VISITA', rowNumber: index + 3, row },
    })
  }

  function parseEvents(sheetName: string, sourceRows: Row[], eventType: SourceScheduleEvent['eventType']) {
    for (const [index, row] of sourceRows.slice(4).entries()) {
      if (!nonEmpty(row)) continue
      const rowNumber = index + 5
      const title = clean(eventType === 'aula' ? row[3] : row[3])
      if (!title) continue
      const googleEventId = nullable(eventType === 'aula' ? row[9] : row[9])
      const sourceKey = `cronograma-2026:${eventType}:${rowNumber}:${googleEventId || normalizeText(title)}`
      const location = nullable(eventType === 'aula' ? row[5] : row[4])
      events.push({
        sourceKey,
        sourceSheet: sheetName,
        eventType,
        title,
        topic: eventType === 'aula' ? nullable(row[4]) : null,
        startsAt: combineDateTime(row[0], eventType === 'aula' ? row[2] : row[1]),
        durationHours: eventType === 'aula' ? 2 : (toNumber(row[2], 1) || 1),
        modality: eventType === 'evento_presencial' ? 'Presencial' : 'Online',
        location,
        targetAudience: nullable(eventType === 'aula' ? row[6] : row[5]),
        audienceGoal: eventType === 'aula' ? null : toNumber(row[6], 0) || null,
        responsibleName: nullable(eventType === 'aula' ? row[7] : row[7]),
        ticketPriceText: eventType === 'aula' ? null : nullable(row[8]),
        googleEventId,
        rowNumber,
        payload: { sheet: sheetName, rowNumber, row },
      })
    }
  }

  parseEvents('EVENTOS ONLINE', onlineRows, 'evento_online')
  parseEvents('EVENTOS PRESENCIAIS', presencialRows, 'evento_presencial')
  parseEvents('AULAS', aulasRows, 'aula')

  return {
    clients: Array.from(clients.values()),
    visits,
    objectives,
    events,
  }
}

async function getAdminUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('users')
    .select('id,name,email')
    .eq('role', 'admin')
    .eq('active', true)
    .order('name')
  if (error) throw new Error(error.message)
  return (data || []) as AdminUser[]
}

function userByName(users: AdminUser[], name: string | null) {
  const normalized = normalizePersonName(name)
  if (!normalized) return null
  return users.find((user) => normalizePersonName(user.name) === normalized)
    || users.find((user) => normalizePersonName(user.name).includes(normalized) || normalized.includes(normalizePersonName(user.name)))
    || null
}

async function main() {
  const parsed = parseWorkbook(filePath)
  const summary = {
    clients: parsed.clients.length,
    visits: parsed.visits.length,
    visitsWithDate: parsed.visits.filter((visit) => visit.scheduledAt).length,
    visitsSkippedNoDate: parsed.visits.filter((visit) => !visit.scheduledAt).length,
    objectives: parsed.objectives.length,
    scheduleEvents: parsed.events.length,
    scheduleEventsWithDate: parsed.events.filter((event) => event.startsAt).length,
    apply: shouldApply,
    replaceSource,
  }

  console.log(JSON.stringify(summary, null, 2))

  if (!shouldApply) {
    console.log('Dry run only. Use --apply to write to Supabase.')
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabase = createClient(
    supabaseUrl || requiredEnv('VITE_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const admins = await getAdminUsers(supabase)
  const importer = admins.find((user) => normalizeText(user.name).includes('orion')) || admins[0]
  if (!importer) throw new Error('No active admin user found to own imported rows.')

  if (replaceSource) {
    await supabase.from('consulting_visits').delete().like('source_import_key', 'cronograma-2026:visit:%')
    await supabase.from('consulting_schedule_events').delete().like('source_import_key', 'cronograma-2026:%')
    await supabase
      .from('consulting_import_batches')
      .update({ status: 'failed', finished_at: new Date().toISOString() })
      .eq('source_name', SOURCE_NAME)
      .eq('status', 'running')
  }

  const { data: batch, error: batchError } = await supabase
    .from('consulting_import_batches')
    .insert({
      source_name: SOURCE_NAME,
      source_path: filePath,
      status: 'running',
      summary,
      created_by: importer.id,
    })
    .select('id')
    .single()
  if (batchError || !batch) throw new Error(batchError?.message || 'Failed to create import batch')

  const batchId = batch.id as string
  const importedClients = new Map<string, string>()
  const existingClientsRes = await supabase.from('consulting_clients').select('id,name,source_import_key')
  if (existingClientsRes.error) throw new Error(existingClientsRes.error.message)
  const existingClients = (existingClientsRes.data || []) as Array<{ id: string; name: string; source_import_key: string | null }>

  for (const client of parsed.clients) {
    const match = existingClients.find((item) => item.source_import_key === client.sourceKey)
      || existingClients.find((item) => normalizeText(item.name) === normalizeText(client.name))
    const payload = {
      name: client.name,
      slug: normalizeText(client.name),
      product_name: client.productName,
      modality: client.modality || 'Presencial',
      notes: client.notes,
      status: 'ativo',
      created_by: importer.id,
      source_import_key: client.sourceKey,
      source_payload: client.payload,
    }
    if (match) {
      const { error } = await supabase.from('consulting_clients').update(payload).eq('id', match.id)
      if (error) throw new Error(`Client update failed ${client.name}: ${error.message}`)
      importedClients.set(client.name, match.id)
    } else {
      const { data, error } = await supabase.from('consulting_clients').insert(payload).select('id').single()
      if (error || !data) throw new Error(`Client insert failed ${client.name}: ${error?.message || 'missing row'}`)
      importedClients.set(client.name, data.id as string)
    }
  }

  for (const objective of parsed.objectives) {
    for (const programKey of ['pmr_7']) {
      const { error } = await supabase
        .from('consulting_visit_template_steps')
        .upsert({
          program_key: programKey,
          visit_number: objective.visitNumber,
          objective: objective.objective,
          target: objective.target,
          duration: objective.duration,
          evidence_required: objective.evidence,
          checklist_template: objective.checklist.map((task) => ({ task, completed: false })),
          active: true,
        }, { onConflict: 'program_key,visit_number' })
      if (error) throw new Error(`Objective upsert failed visit ${objective.visitNumber}: ${error.message}`)
    }
  }

  let importedVisits = 0
  let skippedVisits = 0
  for (const visit of parsed.visits) {
    const clientId = importedClients.get(visit.clientName)
    const consultant = userByName(admins, visit.consultantName)
    const auxiliary = userByName(admins, visit.auxiliaryConsultantName)
    if (!clientId || !visit.scheduledAt) {
      skippedVisits += 1
      await supabase.from('consulting_import_rows').insert({
        batch_id: batchId,
        source_sheet: 'AGENDA',
        row_number: visit.rowNumber,
        entity_type: 'consulting_visit',
        source_import_key: visit.sourceKey,
        status: 'skipped',
        message: !clientId ? 'Cliente nao localizado' : 'Linha sem data/hora de visita',
        payload: visit.payload,
      })
      continue
    }

    const { error } = await supabase.from('consulting_visits').upsert({
      client_id: clientId,
      visit_number: visit.visitNumber,
      source_visit_code: visit.sourceVisitCode,
      scheduled_at: visit.scheduledAt,
      duration_hours: visit.durationHours,
      modality: visit.modality,
      status: 'agendada',
      consultant_id: consultant?.id || null,
      auxiliary_consultant_id: auxiliary?.id || null,
      objective: visit.objective,
      google_event_id: visit.googleEventId,
      source_import_key: visit.sourceKey,
      source_payload: visit.payload,
    }, { onConflict: 'source_import_key' })
    if (error) throw new Error(`Visit upsert failed row ${visit.rowNumber}: ${error.message}`)
    importedVisits += 1

    for (const assignment of [
      consultant ? { user_id: consultant.id, assignment_role: 'responsavel' } : null,
      auxiliary ? { user_id: auxiliary.id, assignment_role: 'auxiliar' } : null,
    ].filter(Boolean) as Array<{ user_id: string; assignment_role: string }>) {
      await supabase.from('consulting_assignments').upsert({
        client_id: clientId,
        user_id: assignment.user_id,
        assignment_role: assignment.assignment_role,
        active: true,
      }, { onConflict: 'client_id,user_id' })
    }
  }

  let importedEvents = 0
  let skippedEvents = 0
  for (const event of parsed.events) {
    const responsible = userByName(admins, event.responsibleName)
    if (!event.startsAt) {
      skippedEvents += 1
      await supabase.from('consulting_import_rows').insert({
        batch_id: batchId,
        source_sheet: event.sourceSheet,
        row_number: event.rowNumber,
        entity_type: 'consulting_schedule_event',
        source_import_key: event.sourceKey,
        status: 'skipped',
        message: 'Linha sem data/hora de evento',
        payload: event.payload,
      })
      continue
    }

    const { error } = await supabase.from('consulting_schedule_events').upsert({
      event_type: event.eventType,
      title: event.title,
      topic: event.topic,
      starts_at: event.startsAt,
      duration_hours: event.durationHours,
      modality: event.modality,
      location: event.location,
      target_audience: event.targetAudience,
      audience_goal: event.audienceGoal,
      responsible_user_id: responsible?.id || null,
      responsible_name: event.responsibleName,
      ticket_price_text: event.ticketPriceText,
      google_event_id: event.googleEventId,
      source_sheet: event.sourceSheet,
      source_import_key: event.sourceKey,
      source_payload: event.payload,
      created_by: importer.id,
      status: 'agendado',
    }, { onConflict: 'source_import_key' })
    if (error) throw new Error(`Event upsert failed row ${event.rowNumber}: ${error.message}`)
    importedEvents += 1
  }

  const finalSummary = {
    ...summary,
    importedClients: importedClients.size,
    importedVisits,
    skippedVisits,
    importedEvents,
    skippedEvents,
  }

  const { error: finishError } = await supabase
    .from('consulting_import_batches')
    .update({ status: 'completed', finished_at: new Date().toISOString(), summary: finalSummary })
    .eq('id', batchId)
  if (finishError) throw new Error(finishError.message)

  console.log(JSON.stringify(finalSummary, null, 2))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
