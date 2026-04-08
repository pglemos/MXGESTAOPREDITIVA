"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PDIWizard({ sellerId, storeId }: { sellerId: string, storeId: string }) {
    const [step, setStep] = useState(1);
    const [pdiId, setPdiId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        comp_prospeccao: 6, comp_abordagem: 6, comp_demonstracao: 6, comp_fechamento: 6,
        action_1: '', action_2: '', action_3: '', action_4: '', action_5: ''
    });

    const steps = [
        { title: "Metas (7 min)", key: 'metas' },
        { title: "Mapeamento (10 min)", key: 'mapeamento' },
        { title: "Ações (11 min)", key: 'acoes' },
        { title: "Próximo Passo", key: 'feedback' },
        { title: "Encerramento", key: 'fim' }
    ];

    const saveStep = async () => {
        const { data, error } = await supabase.from('pdis').upsert({
            id: pdiId || undefined,
            seller_id: sellerId,
            store_id: storeId,
            ...formData,
            status: 'em_andamento'
        }).select().single();
        if (data) setPdiId(data.id);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-lg border">
            <div className="flex justify-between mb-8 border-b pb-4">
                {steps.map((s, i) => (
                    <div key={s.key} className={`text-xs ${i + 1 === step ? 'font-bold text-blue-600' : 'text-gray-400'}`}>
                        {i + 1}. {s.title}
                    </div>
                ))}
            </div>

            <div className="min-h-[300px]">
                {step === 2 && (
                    <div className="grid grid-cols-2 gap-4">
                        {(['comp_prospeccao', 'comp_abordagem', 'comp_demonstracao', 'comp_fechamento'] as const).map(comp => (
                            <div key={comp} className="flex flex-col">
                                <label className="capitalize text-sm font-medium">{comp.replace('comp_', '')}</label>
                                <input type="number" min="6" max="10" 
                                    className="border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                    value={formData[comp]}
                                    onChange={(e) => setFormData({...formData, [comp]: parseInt(e.target.value)})} 
                                />
                            </div>
                        ))}
                    </div>
                )}
                {step === 5 && (
                    <div className="text-center py-10">
                        <h2 className="text-2xl font-bold">PDI concluído com sucesso!</h2>
                        <p className="text-gray-600 mt-2">Aperte a mão do seu colaborador e clique abaixo para imprimir o relatório.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t">
                <button 
                    disabled={step === 1} 
                    onClick={() => setStep(step - 1)} 
                    className="px-4 py-2 text-gray-600 disabled:opacity-50"
                >Voltar</button>
                <button 
                    onClick={async () => { await saveStep(); step < 5 ? setStep(step + 1) : window.print(); }} 
                    className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors"
                >
                    {step === 5 ? 'Finalizar e Imprimir' : 'Próximo Passo'}
                </button>
            </div>
        </div>
    );
}
