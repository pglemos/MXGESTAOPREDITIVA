"use client";

import { useEffect, useState } from 'react';
import { getManagerRoutineData, getRankingSnapshot } from '@/lib/api/manager';

export default function ManagerCommandCenter({ storeId }: { storeId: string }) {
    const [routine, setRoutine] = useState<any>(null);
    const [ranking, setRanking] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const date = new Date().toISOString().split('T')[0];
            const [r, rank] = await Promise.all([
                getManagerRoutineData(storeId, date),
                getRankingSnapshot(storeId)
            ]);
            setRoutine(r);
            setRanking(rank || []);
        };
        load();
    }, [storeId]);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Command Center do Gerente</h1>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded">
                    <h3 className="font-semibold">Status do Dia</h3>
                    <p>{routine?.status || 'Aguardando Lançamentos...'}</p>
                </div>
            </div>
            <div className="mt-4">
                <h3 className="font-bold mb-2">Ranking em Tempo Real</h3>
                <ul>
                    {ranking.map((seller, i) => (
                        <li key={i}>{seller.user_name} - {seller.vnd_total}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
