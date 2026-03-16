import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useClientDashboard } from '@/hooks/useClientDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { getAgendamentos, isLoading } = useClientDashboard();
  const [activeTab, setActiveTab] = useState('Todos');
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const tabs = ['Todos', 'Pendentes', 'Confirmados', 'Concluídos', 'Cancelados'];

  useEffect(() => {
    loadAgendamentos();
  }, [user]);

  const loadAgendamentos = async () => {
    if (user?.id) {
      const data = await getAgendamentos(user.id);
      setAgendamentos(data);
    } else {
      // For demo mode
      const data = await getAgendamentos('demo-user-id');
      setAgendamentos(data);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Cancelado':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Concluído':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Confirmado</span>;
      case 'Cancelado':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelado</span>;
      case 'Concluído':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Concluído</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pendente</span>;
    }
  };

  const filteredAgendamentos = agendamentos.filter(a => {
    if (activeTab === 'Todos') return true;
    return a.status === activeTab;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          Meus Agendamentos
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie seus agendamentos</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAgendamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-lg border border-slate-200">
          <Calendar className="h-12 w-12 text-slate-300 mb-4" />
          <p>Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgendamentos.map((agendamento) => {
            const data = new Date(agendamento.dataAgendamento);
            return (
              <div key={agendamento.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{agendamento.servicoNome}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <User className="h-4 w-4" />
                      {agendamento.profissionalNome}
                    </p>
                  </div>
                  {getStatusBadge(agendamento.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>{data.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>{data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
                    Detalhes
                  </button>
                  {agendamento.status === 'Pendente' && (
                    <button className="flex-1 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
