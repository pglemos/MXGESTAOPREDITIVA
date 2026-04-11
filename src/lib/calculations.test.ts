import { expect, test, describe } from "bun:test";
import { 
    calcularAtingimento, 
    calcularFaltaX, 
    calcularProjecao, 
    calcularRitmo,
    isBusinessDay,
    getBusinessDaysInMonth,
    getDiasInfo,
    calcularFunil,
    gerarDiagnosticoMX,
    calcularScoreMX,
    getOperationalStatus
} from "./calculations";

describe("Business Logic: attainment & goals", () => {
    test("calcularAtingimento: should handle zero meta", () => {
        expect(calcularAtingimento(10, 0)).toBe(0);
    });

    test("calcularAtingimento: should calculate correctly", () => {
        expect(calcularAtingimento(5, 10)).toBe(50);
        expect(calcularAtingimento(1, 3)).toBe(33.3);
    });

    test("calcularFaltaX: should handle surplus", () => {
        expect(calcularFaltaX(10, 15)).toBe(0);
        expect(calcularFaltaX(10, 5)).toBe(5);
    });
});

describe("Predictive Logic: projection & rhythm", () => {
    test("calcularProjecao: should project based on elapsed days", () => {
        // 10 sales in 10 days of a 30-day month = 30 project
        expect(calcularProjecao(10, 10, 30)).toBe(30);
        // 5 sales in 10 days of a 30-day month = 15 project
        expect(calcularProjecao(5, 10, 30)).toBe(15);
    });

    test("calcularRitmo: should calculate required daily average", () => {
        // Need 10 sales in 5 days = 2.0 per day
        expect(calcularRitmo(20, 10, 5)).toBe(2);
        // Need 1 sale in 10 days = 0.1 per day
        expect(calcularRitmo(11, 10, 10)).toBe(0.1);
    });
});

describe("Temporal Logic: business days (MX Method)", () => {
    test("isBusinessDay: should exclude Sundays", () => {
        const sunday = new Date('2026-04-12T12:00:00'); // Sunday
        const monday = new Date('2026-04-13T12:00:00'); // Monday
        expect(isBusinessDay(sunday)).toBe(false);
        expect(isBusinessDay(monday)).toBe(true);
    });

    test("getBusinessDaysInMonth: should count Mon-Sat", () => {
        // April 2026 has 30 days. Starts on Wed.
        // Sundays: 5, 12, 19, 26 (4 Sundays)
        // Expected: 30 - 4 = 26 business days
        expect(getBusinessDaysInMonth(2026, 3)).toBe(26); // month is 0-indexed
    });

    test("getDiasInfo: should support calendar vs business mode", () => {
        const ref = '2026-04-10'; // Friday (10th day)
        
        // Calendar Mode: 30 total, 10 elapsed
        const cal = getDiasInfo(ref, 'calendar');
        expect(cal.total).toBe(30);
        expect(cal.decorridos).toBe(10);

        // Business Mode: 26 total (no Sundays)
        // April 2026: 5th is Sunday. 10th is Friday.
        // Elapsed business days up to 10th: 1,2,3,4, (5 skip), 6,7,8,9,10 = 9 days
        const biz = getDiasInfo(ref, 'business');
        expect(biz.total).toBe(26);
        expect(biz.decorridos).toBe(9);
    });
});

describe("Funnel & Intelligence: MX 20/60/33", () => {
    const perfectFunnel = {
        leads: 100,
        agd_total: 20,
        visitas: 12,
        vnd_total: 4,
        tx_lead_agd: 20,
        tx_agd_visita: 60,
        tx_visita_vnd: 33
    };

    test("gerarDiagnosticoMX: should return success for balanced funnel", () => {
        const diag = gerarDiagnosticoMX(perfectFunnel);
        expect(diag.gargalo).toBeNull();
    });

    test("gerarDiagnosticoMX: should identify lead bottleneck", () => {
        const badLead = { ...perfectFunnel, tx_lead_agd: 10 };
        const diag = gerarDiagnosticoMX(badLead);
        expect(diag.gargalo).toBe('LEAD_AGD');
    });

    test("gerarDiagnosticoMX: should identify showroom bottleneck", () => {
        const badShowroom = { ...perfectFunnel, tx_visita_vnd: 20 };
        const diag = gerarDiagnosticoMX(badShowroom);
        expect(diag.gargalo).toBe('VISITA_VND');
    });
});

describe("Performance Indicators: MX Score", () => {
    test("calcularScoreMX: should reward consistency and conversion", () => {
        const funnel = { leads: 100, agd_total: 20, visitas: 12, vnd_total: 4, tx_lead_agd: 20, tx_agd_visita: 60, tx_visita_vnd: 33 };
        
        // Perfect seller: 10 sales, meta 10, perfect funnel, 10 checkins in 10 days
        const score = calcularScoreMX(10, 10, funnel, 10, 10);
        // Attainment 100% = 1000 pts
        // 3 bonuses = 150 + 150 + 200 = 500 pts
        // Multiplier 1.2x (consistency)
        // Total = (1000 + 500) * 1.2 = 1800
        expect(score).toBe(1800);
    });

    test("calcularScoreMX: should punish indiscipline", () => {
        const funnel = { leads: 100, agd_total: 20, visitas: 12, vnd_total: 4, tx_lead_agd: 20, tx_agd_visita: 60, tx_visita_vnd: 33 };
        // Same seller, but only 5 checkins in 10 days (50% discipline)
        const score = calcularScoreMX(10, 10, funnel, 5, 10);
        // (1000 + 500) * 0.5 = 750
        expect(score).toBe(750);
    });
});

describe("Operational Status: Labeling", () => {
    test("getOperationalStatus: should flag indiscipline first", () => {
        expect(getOperationalStatus(100, 70).label).toBe('INDISCIPLINA');
    });

    test("getOperationalStatus: should award excellence", () => {
        expect(getOperationalStatus(110, 100).label).toBe('EXCELÊNCIA');
    });
});
