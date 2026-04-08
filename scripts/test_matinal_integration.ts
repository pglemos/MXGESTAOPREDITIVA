import { runMatinalWorkflow } from '../src/lib/automation/cron-scheduler';
import { supabase } from '../src/lib/supabase';

async function test() {
    console.log('Testando a integração do Matinal...');
    try {
        // Simular a chamada de uma loja
        await runMatinalWorkflow();
        console.log('Workflow executado com sucesso.');
    } catch (e) {
        console.error('Falha na execução:', e);
    }
}
test();
