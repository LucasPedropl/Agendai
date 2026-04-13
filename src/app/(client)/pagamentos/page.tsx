'use client';

import { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';

export default function ClientPagamentosPage() {
  const [cards, setCards] = useState<any[]>([]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-blue-600" />
          Formas de Pagamento
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie seus cartões e métodos de pagamento.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Cartões Salvos</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {cards.length === 0 ? (
            <div className="text-center text-slate-500 py-4">
              Nenhum cartão salvo.
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-600 text-xs">
                    {card.brand}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{card.number}</p>
                    <p className="text-sm text-slate-500">Expira em {card.expiry}</p>
                  </div>
                </div>
                <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors">
                  Remover
                </button>
              </div>
            ))
          )}

          <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 font-medium flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-400 transition-colors">
            <Plus className="h-5 w-5" />
            Adicionar Novo Cartão
          </button>
        </div>
      </div>
    </div>
  );
}
