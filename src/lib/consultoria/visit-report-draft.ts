type VisitDraftTask = {
  task: string
  completed: boolean
}

type FormatVisitDraftInput = {
  draft: string
  clientName?: string | null
  visitNumber: number
  objective?: string | null
  visitDate?: string | null
  completedTasks?: string[]
  pendingTasks?: string[]
  checklist?: VisitDraftTask[]
  feedbackClient?: string
  nextCycleGoal?: string
}

const MAX_ITEMS_PER_SECTION = 4

const cleanText = (value: string) =>
  value
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const cleanItem = (value: string) =>
  cleanText(value)
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/^[✅⚠️🎯📌📊]\s*/, '')
    .trim()

const splitDraftIntoItems = (draft: string) => {
  const normalized = cleanText(draft)
  if (!normalized) return []

  const isStructuralLine = (line: string) =>
    /^\*?(resumo da visita|visita \d+|data|o que foi alinhado|pontos de atencao|pontos de atenção|proximos passos|próximos passos|devolutiva ao cliente|foco do proximo ciclo|foco do próximo ciclo)\*?:?/i.test(line)

  const lineItems = normalized
    .split('\n')
    .map(cleanItem)
    .filter(item => !isStructuralLine(item))
    .filter(Boolean)

  if (lineItems.length > 1) return lineItems

  return normalized
    .split(/(?<=[.!?])\s+/)
    .map(cleanItem)
    .filter(Boolean)
}

const parseFormattedSections = (draft: string) => {
  const sections = {
    done: [] as string[],
    attention: [] as string[],
    actions: [] as string[],
  }

  let current: keyof typeof sections | null = null

  for (const rawLine of cleanText(draft).split('\n')) {
    const line = cleanText(rawLine).replace(/^\*|\*$/g, '')

    if (/^o que foi alinhado/i.test(line)) {
      current = 'done'
      continue
    }

    if (/^pontos de aten(c|ç)ao/i.test(line)) {
      current = 'attention'
      continue
    }

    if (/^pr(o|ó)ximos passos/i.test(line)) {
      current = 'actions'
      continue
    }

    if (/^(resumo da visita|visita \d+|data|devolutiva ao cliente|foco do pr(o|ó)ximo ciclo)/i.test(line)) {
      current = null
      continue
    }

    if (!current || !line) continue
    sections[current].push(cleanItem(line))
  }

  return sections
}

const uniqueLimited = (items: string[], limit = MAX_ITEMS_PER_SECTION) => {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of items) {
    const cleaned = cleanItem(item)
    const key = cleaned.toLocaleLowerCase('pt-BR')
    if (!cleaned || seen.has(key)) continue
    seen.add(key)
    result.push(cleaned)
    if (result.length >= limit) break
  }

  return result
}

const isActionItem = (item: string) =>
  /(\bacao\b|\bação\b|proximo|próximo|pendente|falta|precisa|implementar|acompanhar|corrigir|ajustar|enviar|validar|definir)/i.test(item)

const isAttentionItem = (item: string) =>
  /(atencao|atenção|risco|gargalo|problema|queda|baixo|baixa|dificuldade|alerta|ponto critico|ponto crítico)/i.test(item)

const isDoneItem = (item: string) =>
  /(feito|realizado|concluido|concluído|validado|alinhado|avaliado|implantado|definido|revisado|treinado)/i.test(item)

const formatDate = (date?: string | null) => {
  if (!date) return ''
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('pt-BR')
}

const taskFallback = (input: FormatVisitDraftInput) => {
  const completedTasks = input.completedTasks?.length
    ? input.completedTasks
    : input.checklist?.filter(task => task.completed).map(task => task.task) || []

  const pendingTasks = input.pendingTasks?.length
    ? input.pendingTasks
    : input.checklist?.filter(task => !task.completed).map(task => task.task) || []

  return {
    done: uniqueLimited(completedTasks),
    actions: uniqueLimited(pendingTasks),
  }
}

const appendSection = (lines: string[], title: string, items: string[]) => {
  if (!items.length) return

  lines.push(`*${title}*`)
  for (const item of items) lines.push(`- ${item}`)
  lines.push('')
}

export const formatVisitDraftForGroup = (input: FormatVisitDraftInput) => {
  const draftItems = splitDraftIntoItems(input.draft)
  const formattedSections = parseFormattedSections(input.draft)
  const hasFormattedSections = Object.values(formattedSections).some(section => section.length > 0)
  const fallback = taskFallback(input)

  const doneFromDraft = uniqueLimited(draftItems.filter(item => isDoneItem(item) && !isActionItem(item)))
  const attentionFromDraft = uniqueLimited(draftItems.filter(isAttentionItem))
  const actionFromDraft = uniqueLimited(draftItems.filter(item => isActionItem(item) && !isDoneItem(item)))

  const uncategorized = uniqueLimited(
    draftItems.filter(item =>
      !doneFromDraft.includes(item) &&
      !attentionFromDraft.includes(item) &&
      !actionFromDraft.includes(item)
    ),
    3
  )

  const done = hasFormattedSections
    ? uniqueLimited(formattedSections.done)
    : doneFromDraft.length ? doneFromDraft : uniqueLimited([...uncategorized, ...fallback.done])
  const attention = hasFormattedSections ? uniqueLimited(formattedSections.attention) : attentionFromDraft
  const actions = hasFormattedSections
    ? uniqueLimited(formattedSections.actions)
    : actionFromDraft.length ? actionFromDraft : fallback.actions
  const nextCycleGoal = cleanText(input.nextCycleGoal || '')
  const feedbackClient = cleanText(input.feedbackClient || '')
  const date = formatDate(input.visitDate)

  const lines = [
    `*Resumo da visita - ${input.clientName || 'Cliente'}*`,
    `Visita ${input.visitNumber}${input.objective ? `: ${input.objective}` : ''}`,
  ]

  if (date) lines.push(`Data: ${date}`)
  lines.push('')

  appendSection(lines, 'O que foi alinhado', done)
  appendSection(lines, 'Pontos de atencao', attention)
  appendSection(lines, 'Proximos passos', actions)

  if (feedbackClient) {
    appendSection(lines, 'Devolutiva ao cliente', uniqueLimited([feedbackClient], 1))
  }

  if (nextCycleGoal) {
    appendSection(lines, 'Foco do proximo ciclo', uniqueLimited([nextCycleGoal], 1))
  }

  const result = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  if (result.split('\n').length > 3) return result

  return [
    ...lines,
    '*Resumo*',
    '- Rascunho ainda sem detalhes suficientes. Registre o que foi feito, pendencias e proximos passos antes de enviar ao grupo.',
  ].join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
