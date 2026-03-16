import { useState, useEffect } from 'react';
import { Calendar, Filter, Search } from 'lucide-react';
import { useClientDashboard } from '@/hooks/useClientDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientHistoryPage() {
  const { user } = useAuth();
  const { getHistorico, isLoading } = useClientDashboard();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistorico();
  }, [user]);

  const loadHistorico = async () => {
    if (user?.id) {
      const data = await getHistorico(user.id);
      setHistory(data);
    } else {
      // For demo mode
      const data = await getHistorico('demo-user-id');
      setHistory(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">Concluído</span>;
      case 'Cancelado':
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">Cancelado</span>;
      default:
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          Histórico de Serviços
        </h1>
        <p className="text-sm text-slate-500 mt-1">Todos os seus agendamentos anteriores.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <input
            type="date"
            className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option>Todos os serviços</option>
            <option>Corte</option>
            <option>Barba</option>
          </select>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-lg border border-slate-200">
          <Calendar className="h-12 w-12 text-slate-300 mb-4" />
          <p>Nenhum histórico encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => {
            const data = new Date(item.dataAgendamento);
            return (
              <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{item.servicoNome}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {data.toLocaleDateString()} - {data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  {getStatusBadge(item.status)}
                  <span className="font-bold text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
