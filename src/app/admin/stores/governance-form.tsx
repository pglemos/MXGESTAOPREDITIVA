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
        <div className="p-mx-md space-y-mx-sm">
            <h2 className="text-xl font-bold">Governança da Loja</h2>
            <input 
                type="number" 
                value={meta.monthly_goal} 
                onChange={(e) => setMeta({...meta, monthly_goal: Number(e.target.value)})}
                placeholder="Meta Mensal"
                className="block border p-mx-xs"
            />
            <button onClick={handleSubmit} className="bg-brand-primary text-white p-mx-xs rounded">
                Salvar Configurações
            </button>
        </div>
    );
}
