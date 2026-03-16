import { useState } from 'react';
import { DollarSign, TrendingUp, Calendar as CalendarIcon, CreditCard } from 'lucide-react';

export default function ClientFinancasPage() {
  const [transactions] = useState([
    {
      id: '1',
      servico: 'Corte de Cabelo',
      data: '20/09/2025',
      valor: 'R$ 50,00',
      status: 'Pago',
    },
    {
      id: '2',
      servico: 'Barba Terapia',
      data: '15/09/2025',
      valor: 'R$ 35,00',
      status: 'Pago',
    },
    {
      id: '3',
      servico: 'Combo (Corte + Barba)',
      data: '05/09/2025',
      valor: 'R$ 70,00',
      status: 'Pago',
    },
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-blue-600" />
          Minhas Finanças
        </h1>
        <p className="text-sm text-slate-500 mt-1">Acompanhe seus gastos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Gasto</p>
              <p className="text-2xl font-bold text-slate-900">R$ 450,00</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Serviços Realizados</p>
              <p className="text-2xl font-bold text-slate-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <CalendarIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Próximo Vencimento</p>
              <p className="text-2xl font-bold text-slate-900">25/10/2025</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Histórico de Transações</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="p-6 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{transaction.servico}</p>
                <p className="text-sm text-slate-500">{transaction.data}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-900">{transaction.valor}</span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
