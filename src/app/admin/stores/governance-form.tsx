"use client";

import { useState } from 'react';
import { updateStoreGovernance } from '@/lib/api/stores';

export default function StoreGovernanceForm({ storeId, initialData }: { storeId: string, initialData: any }) {
    const [meta, setMeta] = useState(initialData.meta);
    const [delivery, setDelivery] = useState(initialData.delivery);

    const handleSubmit = async () => {
        await updateStoreGovernance(storeId, meta, delivery);
        alert('Configurações salvas!');
    };

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Governança da Loja</h2>
            <input 
                type="number" 
                value={meta.monthly_goal} 
                onChange={(e) => setMeta({...meta, monthly_goal: Number(e.target.value)})}
                placeholder="Meta Mensal"
                className="block border p-2"
            />
            <button onClick={handleSubmit} className="bg-blue-600 text-white p-2 rounded">
                Salvar Configurações
            </button>
        </div>
    );
}
