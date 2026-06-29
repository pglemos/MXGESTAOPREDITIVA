const now = new Date()
const today = now.toISOString().slice(0, 10)
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const isoAt = (date, time) => `${date}T${time}:00.000Z`

const state = {
  UserProfile: [
    {
      id: 'profile-lucas',
      full_name: 'Lucas Mendes',
      phone: '(11) 99876-5432',
      dealership: 'Auto Premium',
      brand: 'Toyota',
      role: 'Vendedor',
      experience_years: 3,
      work_start: '08:00',
      work_end: '18:00',
      monthly_goal: 12,
      commission_per_unit: 600,
      avg_sales_year: 8,
      salary_goal: 8000,
      education: 'Administração',
      job_interest: 'Não',
      created_date: isoAt(today, '08:00'),
      updated_date: isoAt(today, '08:00'),
    },
  ],
  Client: [
    {
      id: 'client-carlos',
      name: 'Carlos Alexandre',
      phone: '(31) 98888-2905',
      source: 'Internet',
      vehicle_interest: 'TUCSO, GL 2.0 2077',
      sale_status: 'Em Negociação',
      sale_completed: false,
      appointment_datetime: isoAt(today, '15:00'),
      negotiated_value: 59900,
      financing: 'Não se aplica',
      trade_in: 'Sim',
      created_date: isoAt(yesterday, '20:48'),
      updated_date: isoAt(yesterday, '20:48'),
    },
    {
      id: 'client-chagas',
      name: 'Carlos Chagas',
      phone: '(11) 98888-2016',
      source: 'Internet',
      vehicle_interest: 'ONIX LT 1.0 2016',
      sale_status: 'Em Negociação',
      sale_completed: false,
      appointment_datetime: isoAt(yesterday, '14:30'),
      created_date: isoAt(yesterday, '14:30'),
      updated_date: isoAt(yesterday, '14:30'),
    },
    {
      id: 'client-roberto',
      name: 'Roberto Marinho',
      phone: '(11) 97777-2019',
      source: 'Internet',
      vehicle_interest: 'HB20 1.0 2019',
      sale_status: 'Em Negociação',
      sale_completed: false,
      appointment_datetime: isoAt(yesterday, '09:00'),
      created_date: isoAt(yesterday, '09:00'),
      updated_date: isoAt(yesterday, '09:00'),
    },
    {
      id: 'client-teste',
      name: 'teste',
      phone: '(11) 90000-0000',
      source: 'Carteira',
      vehicle_interest: 'teste',
      sale_status: 'Em Negociação',
      sale_completed: false,
      appointment_datetime: isoAt(twoDaysAgo, '16:19'),
      created_date: isoAt(twoDaysAgo, '16:19'),
      updated_date: isoAt(twoDaysAgo, '16:19'),
    },
  ],
  Appointment: [
    { id: 'appt-carlos', client_id: 'client-carlos', date: today, datetime: isoAt(today, '15:00'), status: 'scheduled' },
  ],
  DailyClose: [
    { id: 'daily-1', date: today, sales_count: 0, created_date: isoAt(today, '17:00') },
    { id: 'daily-2', date: yesterday, sales_count: 1, created_date: isoAt(yesterday, '17:00') },
  ],
  PDI: [
    { id: 'pdi-1', title: 'Método Vendedor Profissional', status: 'active', created_date: isoAt(today, '08:00') },
  ],
  Feedback: [],
  Training: [],
  RoutineActivityTemplate: [],
  ExecutionOpportunity: [
    {
      id: 'exec-carlos',
      cliente_nome: 'Carlos Alexandre',
      cliente_id: 'client-carlos',
      veiculo: 'TUCSO, GL 2.0 2077',
      descricao: 'Interesse em TUCSO, GL 2.0 2077',
      tipo: 'Atendimento',
      canal: 'Internet',
      horario: '15:00',
      status: 'pendente',
      data: today,
      prioridade: 'Alta',
      created_date: isoAt(today, '09:00'),
      updated_date: isoAt(today, '09:00'),
    },
  ],
  CarteiraCliente: [
    {
      id: 'carteira-maria',
      nome: 'Maria Santos',
      whatsapp: '11987654321',
      canal_origem: 'Instagram',
      veiculo_interesse: 'HB20 Comfort 2024',
      temperatura: 'Morno',
      prioridade: 'Média',
      momento: 'Cliente morno em aquecimento',
      proxima_acao: 'Entender prazo e barreiras',
      ativo: true,
      interesse_troca: true,
      interesse_financiamento: true,
      created_date: isoAt(yesterday, '10:00'),
      updated_date: isoAt(yesterday, '10:00'),
    },
    {
      id: 'carteira-fernanda',
      nome: 'Fernanda Costa',
      whatsapp: '11988887777',
      canal_origem: 'Internet',
      veiculo_interesse: 'Argo Drive 2024',
      temperatura: 'Morno',
      prioridade: 'Média',
      momento: 'Visita realizada',
      proxima_acao: 'Entender prazo e barreiras',
      ativo: true,
      created_date: isoAt(yesterday, '10:30'),
      updated_date: isoAt(yesterday, '10:30'),
    },
    {
      id: 'carteira-joao',
      nome: 'João Pereira',
      whatsapp: '11977776666',
      canal_origem: 'Internet',
      veiculo_interesse: 'Corolla XEI 2023',
      temperatura: 'Quente',
      prioridade: 'Alta',
      momento: 'Cliente quente sem visita',
      proxima_acao: 'Agendar visita',
      ativo: true,
      created_date: isoAt(yesterday, '11:00'),
      updated_date: isoAt(yesterday, '11:00'),
    },
    {
      id: 'carteira-carlos',
      nome: 'Carlos Oliveira',
      whatsapp: '11966665555',
      canal_origem: 'Carteira',
      veiculo_interesse: 'Civic EXL 2022',
      temperatura: 'Quente',
      prioridade: 'Alta',
      momento: 'Proposta enviada',
      proxima_acao: 'Agendar visita',
      ativo: true,
      created_date: isoAt(yesterday, '11:30'),
      updated_date: isoAt(yesterday, '11:30'),
    },
    {
      id: 'carteira-ana',
      nome: 'Ana Lima',
      whatsapp: '11955554444',
      canal_origem: 'Showroom',
      veiculo_interesse: 'Polo GTS 2023',
      temperatura: 'Frio',
      prioridade: 'Baixa',
      momento: 'Cliente frio em nutrição',
      proxima_acao: 'Nutrir ou programar reativação',
      ativo: true,
      created_date: isoAt(yesterday, '12:00'),
      updated_date: isoAt(yesterday, '12:00'),
    },
    {
      id: 'carteira-roberto',
      nome: 'Roberto Alves',
      whatsapp: '11944443333',
      canal_origem: 'Indicação',
      veiculo_interesse: 'Hilux CD SRX 2024',
      temperatura: 'Quente',
      prioridade: 'Alta',
      momento: 'Visita agendada',
      proxima_acao: 'Confirmar visita',
      ativo: true,
      created_date: isoAt(yesterday, '12:30'),
      updated_date: isoAt(yesterday, '12:30'),
    },
    {
      id: 'carteira-lucas',
      nome: 'Lucas Mendes',
      whatsapp: '11933332222',
      canal_origem: 'Carteira',
      veiculo_interesse: 'Onix LTZ 2023',
      temperatura: 'Quente',
      prioridade: 'Alta',
      momento: 'Em negociação',
      proxima_acao: 'Fechar próximos passos',
      ativo: true,
      created_date: isoAt(yesterday, '13:00'),
      updated_date: isoAt(yesterday, '13:00'),
    },
  ],
  CarteiraHistorico: [],
  CarteiraMissao: [],
}

const clone = (value) => JSON.parse(JSON.stringify(value))

function sortItems(items, sort) {
  if (!sort) return items
  const desc = String(sort).startsWith('-')
  const key = String(sort).replace(/^-/, '')
  return [...items].sort((a, b) => {
    const av = a[key] || ''
    const bv = b[key] || ''
    return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
  })
}

function matches(item, query = {}) {
  return Object.entries(query).every(([key, value]) => value === undefined || item[key] === value)
}

function entity(name) {
  return {
    async list(sort, limit) {
      const items = sortItems(state[name] || [], sort)
      return clone(typeof limit === 'number' ? items.slice(0, limit) : items)
    },
    async get(id) {
      return clone((state[name] || []).find((item) => item.id === id) || null)
    },
    async filter(query = {}, sort, limit) {
      const items = sortItems((state[name] || []).filter((item) => matches(item, query)), sort)
      return clone(typeof limit === 'number' ? items.slice(0, limit) : items)
    },
    async create(data) {
      const item = {
        id: `${name.toLowerCase()}-${Date.now()}`,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data,
      }
      state[name] = [item, ...(state[name] || [])]
      return clone(item)
    },
    async update(id, patch) {
      state[name] = (state[name] || []).map((item) =>
        item.id === id ? { ...item, ...patch, updated_date: new Date().toISOString() } : item,
      )
      return clone((state[name] || []).find((item) => item.id === id) || null)
    },
    async delete(id) {
      state[name] = (state[name] || []).filter((item) => item.id !== id)
      return true
    },
  }
}

export const base44 = {
  auth: {
    async me() {
      return { id: 'vendedor-demo', email: 'vendedor@mxgestaopreditiva.com.br', full_name: 'Lucas Mendes' }
    },
    async logout() {
      return true
    },
  },
  entities: Object.fromEntries(Object.keys(state).map((name) => [name, entity(name)])),
  analytics: {
    track() {
      return true
    },
  },
}
