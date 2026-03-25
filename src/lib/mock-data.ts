export const mockKPIs = {
    leads: { current: 142, trend: 12, previous: 126 },
    sla: { current: '4m', trend: -2, previous: '6m' },
    agendamentos: { current: 48, trend: 8, previous: 40 },
    visitas: { current: 32, trend: 5, previous: 27 },
    vendas: { current: 18, trend: 15, previous: 15 },
    noshow: { current: 12, trend: -3, previous: 15 },
    projecao: {
        conservador: 32,
        provavel: 36,
        agressivo: 41,
        meta: 40,
    },
}

export type LeadStage =
    | 'Novo'
    | 'Contato'
    | 'Agendamento'
    | 'Visita'
    | 'Proposta'
    | 'Negociação'
    | 'Venda'
    | 'Perdido'

export interface Lead {
    id: string
    name: string
    car: string
    stage: LeadStage
    slaMinutes: number
    source: string
    value: number
    score: number
    lastAction?: string
    lossReason?: string
    stagnantDays?: number
}

export const mockLeads: Lead[] = [
    {
        id: 'L-101',
        name: 'Carlos Silva',
        car: 'Porsche 911',
        stage: 'Novo',
        slaMinutes: 1,
        source: 'Meta Ads',
        value: 850000,
        score: 92,
    },
    {
        id: 'L-102',
        name: 'Ana Oliveira',
        car: 'BMW X5',
        stage: 'Novo',
        slaMinutes: 15,
        source: 'RD Station',
        value: 420000,
        score: 85,
    },
    {
        id: 'L-103',
        name: 'Roberto Carlos',
        car: 'Audi Q3',
        stage: 'Contato',
        slaMinutes: 45,
        source: 'WhatsApp',
        value: 280000,
        score: 60,
        stagnantDays: 3,
    },
    {
        id: 'L-104',
        name: 'Juliana Costa',
        car: 'Mercedes C300',
        stage: 'Agendamento',
        slaMinutes: 120,
        source: 'Site',
        value: 350000,
        score: 78,
    },
    {
        id: 'L-105',
        name: 'Fernando Lima',
        car: 'Volvo XC60',
        stage: 'Visita',
        slaMinutes: 300,
        source: 'Indicação',
        value: 390000,
        score: 88,
    },
    {
        id: 'L-106',
        name: 'Mariana Souza',
        car: 'Land Rover Evoque',
        stage: 'Proposta',
        slaMinutes: 1440,
        source: 'Meta Ads',
        value: 380000,
        score: 95,
        stagnantDays: 4,
    },
    {
        id: 'L-107',
        name: 'João Mendes',
        car: 'Tesla Model Y',
        stage: 'Negociação',
        slaMinutes: 2880,
        source: 'Webmotors',
        value: 450000,
        score: 99,
    },
]

export const mockInventory = [
    {
        id: 'STK-001',
        model: 'Porsche 911 Carrera S',
        year: 2023,
        plate: 'BRA-1A23',
        aging: 12,
        cost: 780000,
        price: 850000,
        margin: 8.2,
        status: 'Normal',
        marketPrice: 840000,
        suggestedPrice: 845000,
        competitivenessScore: 92,
        agencyId: 'a1',
    },
    {
        id: 'STK-002',
        model: 'BMW M3 Competition',
        year: 2022,
        plate: 'BMW-3M33',
        aging: 45,
        cost: 550000,
        price: 620000,
        margin: 11.2,
        status: 'Atenção',
        marketPrice: 600000,
        suggestedPrice: 590000,
        competitivenessScore: 78,
        agencyId: 'a1',
    },
    {
        id: 'STK-003',
        model: 'Audi RS6 Avant',
        year: 2024,
        plate: 'RSX-6A66',
        aging: 75,
        cost: 950000,
        price: 1050000,
        margin: 9.5,
        status: 'Crítico',
        marketPrice: 1020000,
        suggestedPrice: 1010000,
        competitivenessScore: 65,
        agencyId: 'a2',
    },
    {
        id: 'STK-004',
        model: 'Mercedes-Benz GLE 400d',
        year: 2021,
        plate: 'MER-4G44',
        aging: 8,
        cost: 620000,
        price: 680000,
        margin: 8.8,
        status: 'Normal',
        marketPrice: 685000,
        suggestedPrice: 685000,
        competitivenessScore: 95,
        agencyId: 'a1',
    },
    {
        id: 'STK-005',
        model: 'Volvo XC90 Recharge',
        year: 2023,
        plate: 'VOL-9X99',
        aging: 92,
        cost: 480000,
        price: 520000,
        margin: 7.6,
        status: 'Crítico',
        marketPrice: 500000,
        suggestedPrice: 495000,
        competitivenessScore: 60,
        agencyId: 'a2',
    },
]

export const mockTeam = [
    {
        id: 'T-01',
        name: 'João Vendedor',
        role: 'Closer',
        conversion: 18.5,
        execution: 92,
        sales: 8,
        avatar: 'male&seed=1',
    },
    {
        id: 'T-02',
        name: 'Maria Souza',
        role: 'Closer',
        conversion: 22.1,
        execution: 98,
        sales: 12,
        avatar: 'female&seed=2',
    },
    {
        id: 'T-03',
        name: 'Pedro Alves',
        role: 'SDR',
        conversion: 12.0,
        execution: 85,
        sales: 4,
        avatar: 'male&seed=3',
    },
    {
        id: 'T-04',
        name: 'Lucia Gomes',
        role: 'Closer',
        conversion: 15.3,
        execution: 88,
        sales: 6,
        avatar: 'female&seed=4',
    },
]

export const chartData = [
    { day: '01', vendas: 1, leads: 12 },
    { day: '05', vendas: 3, leads: 25 },
    { day: '10', vendas: 7, leads: 48 },
    { day: '15', vendas: 12, leads: 85 },
    { day: '20', vendas: 15, leads: 110 },
    { day: '25', vendas: 18, leads: 142 },
]

export const mockIntegrations = [
    {
        id: 'INT-1',
        name: 'Meta Ads',
        status: 'Sucesso',
        lastSync: 'há 10 min',
        leadsToday: 45,
        error: null,
    },
    {
        id: 'INT-2',
        name: 'RD Station',
        status: 'Erro',
        lastSync: 'há 2 horas',
        leadsToday: 12,
        error: 'Limite de Requisições Excedido (429)',
    },
    {
        id: 'INT-3',
        name: 'Webmotors',
        status: 'Sucesso',
        lastSync: 'há 5 min',
        leadsToday: 8,
        error: null,
    },
]

export const reportLucratividade = [
    { model: 'Porsche 911', profit: 70000 },
    { model: 'BMW M3', profit: 45000 },
    { model: 'Audi RS6', profit: 80000 },
    { model: 'Mercedes GLE', profit: 55000 },
    { model: 'Volvo XC90', profit: 40000 },
]

export const reportCiclo = [
    { month: 'Jan', dias: 45 },
    { month: 'Fev', dias: 42 },
    { month: 'Mar', dias: 38 },
    { month: 'Abr', dias: 40 },
    { month: 'Mai', dias: 35 },
    { month: 'Jun', dias: 30 },
]

export const reportDescontos = [
    {
        seller: 'João Vendedor',
        totalSales: 12,
        avgDiscount: '4.5%',
        marginImpact: '-2.1%',
    },
    {
        seller: 'Maria Souza',
        totalSales: 15,
        avgDiscount: '2.0%',
        marginImpact: '-0.8%',
    },
    {
        seller: 'Pedro Alves',
        totalSales: 8,
        avgDiscount: '5.2%',
        marginImpact: '-3.5%',
    },
    {
        seller: 'Lucia Gomes',
        totalSales: 10,
        avgDiscount: '3.1%',
        marginImpact: '-1.5%',
    },
]

export const mockNotifications = [
    {
        id: 'N1',
        title: 'Novo Lead Recebido',
        description: 'Carlos Silva (Porsche 911) via Meta Ads',
        time: 'Há 5 min',
        unread: true,
        type: 'lead',
    },
    {
        id: 'N2',
        title: 'Sugestão de Reajuste de Preço',
        description: 'BMW M3 Competition está 5% acima do mercado',
        time: 'Há 1 hora',
        unread: true,
        type: 'price',
    },
    {
        id: 'N3',
        title: 'Veículo atingiu Aging Crítico',
        description: 'Volvo XC90 Recharge passou de 90 dias em estoque',
        time: 'Há 2 horas',
        unread: true,
        type: 'stock',
    },
]

export const mockTasks = [
    {
        id: 'T1',
        title: 'Ligar para lead quente Porsche',
        description: 'Confirmar interesse e sugerir test-drive ainda hoje.',
        dueDate: new Date().toISOString(),
        priority: 'Alta',
        leadId: 'L-101',
        status: 'Pendente',
    },
    {
        id: 'T2',
        title: 'Reforcar proposta BMW X5',
        description: 'Enviar comparativo e reforcar condicao comercial.',
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        priority: 'Média',
        leadId: 'L-102',
        status: 'Atrasada',
    },
    {
        id: 'T3',
        title: 'Agendar retorno Audi Q3',
        description: 'Tentar novo contato no periodo da tarde.',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: 'Baixa',
        leadId: 'L-103',
        status: 'Concluída',
    },
]

export const mockCommissionRules = [
    {
        id: 'R1',
        sellerId: 'T-01',
        vehicleType: 'SUV',
        marginMin: 8,
        marginMax: 12,
        percentage: 1.8,
    },
    {
        id: 'R2',
        vehicleType: 'Sedan',
        marginMin: 6,
        marginMax: 10,
        percentage: 1.4,
    },
]

export const mockGoals = [
    { id: 'G1', type: 'Equipe', amount: 25 },
    { id: 'G2', type: 'Individual', targetId: 'T-01', amount: 8 },
    { id: 'G3', type: 'Individual', targetId: 'T-02', amount: 10 },
    { id: 'G4', type: 'Individual', targetId: 'T-03', amount: 5 },
]

export const mockAgencies = [
    { id: 'a1', name: 'Matriz SP' },
    { id: 'a2', name: 'Filial RJ' },
]

export const mockFinance = {
    entradas: 1250000,
    saidas: 850000,
    saldoProjetado: 400000,
}

export const mockCommissions = [
    {
        id: 'C1',
        seller: 'João Vendedor',
        sellerId: 'T-01',
        car: 'Porsche 911 Carrera S',
        date: '12/03/2026',
        margin: '8.2%',
        comission: 15000,
    },
    {
        id: 'C2',
        seller: 'Maria Souza',
        sellerId: 'T-02',
        car: 'BMW M3 Competition',
        date: '15/03/2026',
        margin: '11.2%',
        comission: 18500,
    },
    {
        id: 'C3',
        seller: 'Pedro Alves',
        sellerId: 'T-03',
        car: 'Mercedes-Benz GLE 400d',
        date: '18/03/2026',
        margin: '8.8%',
        comission: 12000,
    },
]

export const mockSalesPerformanceData = [
    {
        id: 'SP1',
        model: 'Porsche 911',
        dias: 15,
        margin: 10,
        giro: 'Alto',
        profitability: 'Alta',
    },
    {
        id: 'SP2',
        model: 'BMW M3',
        dias: 45,
        margin: 11.2,
        giro: 'Médio',
        profitability: 'Alta',
    },
    {
        id: 'SP3',
        model: 'Audi RS6',
        dias: 75,
        margin: 9.5,
        giro: 'Baixo',
        profitability: 'Média',
    },
    {
        id: 'SP4',
        model: 'Volvo XC90',
        dias: 92,
        margin: 7.6,
        giro: 'Baixo',
        profitability: 'Baixa',
    },
    {
        id: 'SP5',
        model: 'Mercedes GLE',
        dias: 20,
        margin: 8.8,
        giro: 'Alto',
        profitability: 'Alta',
    },
]

export type LeadsKanbanStage =
    | 'Novo'
    | 'Contato Inicial'
    | 'Visita/Test Drive'
    | 'Proposta'
    | 'Fechado'

export interface LeadKanban {
    id: string
    name: string
    car: string
    source: string
    stage: LeadsKanbanStage
}

export const mockLeadsKanban: LeadKanban[] = [
    {
        id: 'LK1',
        name: 'Marcos Almeida',
        car: 'Jeep Compass',
        source: 'Webmotors',
        stage: 'Novo',
    },
    {
        id: 'LK2',
        name: 'Fernanda Lima',
        car: 'Audi Q5',
        source: 'Site',
        stage: 'Contato Inicial',
    },
    {
        id: 'LK3',
        name: 'Rodrigo Nunes',
        car: 'BMW X3',
        source: 'WhatsApp',
        stage: 'Visita/Test Drive',
    },
    {
        id: 'LK4',
        name: 'Aline Costa',
        car: 'Volvo XC60',
        source: 'Meta Ads',
        stage: 'Proposta',
    },
    {
        id: 'LK5',
        name: 'Carlos Silva',
        car: 'Porsche 911',
        source: 'Indicação',
        stage: 'Fechado',
    },
]

export const mockAuditLogs = [
    {
        id: 'AL1',
        user: 'Alex Gerente',
        action: 'Alteração de Regra de Comissão',
        detail: 'Modificou a regra de SUV de 10% para 12%.',
        date: 'Hoje, 09:30',
    },
    {
        id: 'AL2',
        user: 'João Vendedor',
        action: 'Avanço de Lead Bloqueado',
        detail:
            'Tentou mover Lead L-101 de Contato para Venda pulando etapas (Chained Funnel).',
        date: 'Ontem, 16:45',
    },
    {
        id: 'AL3',
        user: 'Maria Souza',
        action: 'Check-in Manual',
        detail: 'Check-in via QR Code para o lead L-105.',
        date: 'Ontem, 14:20',
    },
    {
        id: 'AL4',
        user: 'Sistema',
        action: 'Alerta de Estagnação',
        detail: 'Lead L-106 estagnado há mais de 72h em Proposta.',
        date: 'Ontem, 08:00',
    },
]

export const mockYearlySales = [
    { month: 'Jan', sales: 1200000, margin: 950000 },
    { month: 'Fev', sales: 1450000, margin: 1100000 },
    { month: 'Mar', sales: 1800000, margin: 1400000 },
    { month: 'Abr', sales: 1600000, margin: 1250000 },
    { month: 'Mai', sales: 2100000, margin: 1650000 },
    { month: 'Jun', sales: 1900000, margin: 1500000 },
]

export const mockCategorySales = [
    { category: 'SUV Luxury', value: 4500000 },
    { category: 'Sports', value: 3800000 },
    { category: 'Sedan Premium', value: 2900000 },
    { category: 'Electric', value: 1800000 },
]

export const adminSystemPerformance = [
    { month: 'Set', revenue: 14500000, leads: 3400, activeAgencies: 18 },
    { month: 'Out', revenue: 16800000, leads: 4100, activeAgencies: 20 },
    { month: 'Nov', revenue: 21500000, leads: 5200, activeAgencies: 22 },
    { month: 'Dez', revenue: 28400000, leads: 6800, activeAgencies: 25 },
    { month: 'Jan', revenue: 22100000, leads: 5800, activeAgencies: 25 },
    { month: 'Fev', revenue: 26500000, leads: 6200, activeAgencies: 28 },
]

export const adminAgencyRanks = [
    { id: 'A1', name: 'Matriz SP', revenue: 8500000, growth: 12.5, score: 98 },
    { id: 'A2', name: 'Filial RJ', revenue: 6200000, growth: 8.2, score: 91 },
    { id: 'A3', name: 'Curitiba Premium', revenue: 4800000, growth: 15.4, score: 88 },
    { id: 'A4', name: 'BH Motors', revenue: 3900000, growth: -2.1, score: 82 },
    { id: 'A5', name: 'Brasília Lux', revenue: 3100000, growth: 5.5, score: 79 },
]
