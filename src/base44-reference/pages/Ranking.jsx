import React from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Trophy, Lock } from "lucide-react";

export default function Ranking() {
  return (
    <div className="space-y-8">
      <PageHeader title="Ranking" subtitle="Classificação de performance dos vendedores" />
      
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-[#DFE0E1] text-center">
        <div className="w-16 h-16 rounded-2xl bg-mx-amber-light flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-mx-amber" />
        </div>
        <h3 className="text-lg font-bold text-mx-navy mb-2">Ranking em Breve</h3>
        <p className="text-sm text-[#526B7A] max-w-md mx-auto">
          O ranking será habilitado quando houver múltiplos vendedores cadastrados na plataforma. 
          Continue registrando suas atividades para melhorar sua posição.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {[1, 2, 3].map(pos => (
            <div key={pos} className={`w-20 rounded-2xl p-4 text-center ${pos === 1 ? "bg-mx-amber-light" : "bg-[#F7F8F8]"}`}>
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${pos === 1 ? "bg-mx-amber text-white" : "bg-[#DFE0E1] text-[#526B7A]"}`}>
                <Lock className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-[#526B7A]">#{pos}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}