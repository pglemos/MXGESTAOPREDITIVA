import { runMatinalWorkflow } from './cron-scheduler';
import { runWeeklyFeedbackWorkflow } from './weekly/feedback-engine';
import { runMonthlyCloseWorkflow } from './monthly/close-engine';
import { logAutomation } from './logger';
import cron from 'node-cron';

export function startAutomationJobs() {
    // Matinal: Daily at 10:30
    cron.schedule('30 10 * * *', async () => {
        try {
            await runMatinalWorkflow();
            await logAutomation('Matinal', 'success', {});
        } catch (e) {
            await logAutomation('Matinal', 'failed', { error: e });
        }
    });

    // Weekly: Monday at 12:30
    cron.schedule('30 12 * * 1', async () => {
        try {
            await runWeeklyFeedbackWorkflow();
            await logAutomation('WeeklyFeedback', 'success', {});
        } catch (e) {
            await logAutomation('WeeklyFeedback', 'failed', { error: e });
        }
    });

    // Monthly: Day 1 at 10:30
    cron.schedule('30 10 1 * *', async () => {
        try {
            await runMonthlyCloseWorkflow();
            await logAutomation('MonthlyClose', 'success', {});
        } catch (e) {
            await logAutomation('MonthlyClose', 'failed', { error: e });
        }
    });
}
