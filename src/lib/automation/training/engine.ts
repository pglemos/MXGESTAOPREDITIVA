import { supabase } from '@/lib/supabase';

export async function trackTrainingConsumption(userId: string, trainingId: string) {
    const { error } = await supabase.from('training_progress').insert({
        user_id: userId,
        training_id: trainingId
    });
    if (error) throw error;
}

export async function getTrainingByBottleneck(bottleneckType: string) {
    const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('type', bottleneckType);
    if (error) throw error;
    return data;
}
