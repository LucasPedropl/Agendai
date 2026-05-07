import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight,
  Filter,
  Search,
  MoreVertical,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { useClientDashboard } from '@/hooks/useClientDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Agendamento {
  id: number;
  dataAgendamento: string;
  servicoNome: string;
  profissionalNome: string;
  status: 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado';
  estabelecimentoNome?: string;
  valor?: number;
}

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { getAgendamentos, isLoading } = useClientDashboard();
  const [activeTab, setActiveTab] = useState('Todos');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const tabs = ['Todos', 'Pendentes', 'Confirmados', 'Concluídos', 'Cancelados'];

  useEffect(() => {
    loadAgendamentos();
  }, [user]);

  const loadAgendamentos = async () => {
    if (user?.id) {
      const data = await getAgendamentos(user.id);
      setAgendamentos(Array.isArray(data) ? data : []);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'bg-green-500/10 text-green-600 border-green-500/20',
          dot: 'bg-green-500'
        };
      case 'Cancelado':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'bg-red-500/10 text-red-600 border-red-500/20',
          dot: 'bg-red-500'
        };
      case 'Concluído':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          dot: 'bg-blue-500'
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          dot: 'bg-amber-500'
        };
    }
  };

  const filteredAgendamentos = agendamentos.filter(a => {
    if (activeTab === 'Todos') return true;
    if (activeTab === 'Pendentes') return a.status === 'Pendente';
    if (activeTab === 'Confirmados') return a.status === 'Confirmado';
    if (activeTab === 'Concluídos') return a.status === 'Concluído';
    if (activeTab === 'Cancelados') return a.status === 'Cancelado';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-700 p-10 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <CalendarDays className="h-10 w-10 text-white/80" />
              Próximos Agendamentos
            </h1>
            <p className="text-indigo-100 text-lg">Mantenha-se organizado e nunca perca um horário.</p>
          </div>
          <Button 
            className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-8 h-12 rounded-2xl shadow-lg transition-all hover:scale-105"
            onClick={() => window.location.href = '/app'}
          >
            Novo Agendamento
          </Button>
        </div>
        <Sparkles className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white/10 -rotate-12" />
      </div>

      {/* Tabs / Filter Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex p-1.5 bg-accent/50 rounded-2xl border border-border overflow-x-auto no-scrollbar max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                ${activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar serviço..."
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Grid Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-[2rem]" />
            ))}
          </motion.div>
        ) : filteredAgendamentos.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Tudo limpo por aqui!</h3>
            <p className="text-muted-foreground mt-2 max-w-xs">Você não tem agendamentos {activeTab === 'Todos' ? '' : activeTab.toLowerCase()} no momento.</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAgendamentos.map((agendamento) => {
              const data = new Date(agendamento.dataAgendamento);
              const config = getStatusConfig(agendamento.status);
              
              return (
                <motion.div
                  layout
                  key={agendamento.id}
                  className="group bg-card border border-border rounded-[2rem] p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Status & Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${config.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {agendamento.status}
                      </div>
                    </div>

                    {/* Service Info */}
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {agendamento.servicoNome}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {agendamento.estabelecimentoNome || 'Estabelecimento Local'}
                      </p>
                    </div>

                    {/* Date & Time Box */}
                    <div className="grid grid-cols-2 gap-3 bg-accent/30 p-4 rounded-2xl border border-border/50">
                      <div className="flex flex-col items-center justify-center border-r border-border/50">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Data</span>
                        <span className="text-sm font-bold">{format(data, "dd/MM/yyyy")}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Hora</span>
                        <span className="text-sm font-bold">{format(data, "HH:mm")}</span>
                      </div>
                    </div>

                    {/* Professional */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                          {agendamento.profissionalNome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Profissional</p>
                          <p className="text-sm font-bold">{agendamento.profissionalNome}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Valor</p>
                        <p className="text-sm font-extrabold text-foreground">
                          {agendamento.valor ? `R$ ${agendamento.valor.toFixed(2)}` : 'A consultar'}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-4 border-t border-border/50 flex gap-3">
                      <Button variant="outline" className="flex-1 rounded-xl h-10 font-bold text-xs">
                        Detalhes
                      </Button>
                      {agendamento.status === 'Pendente' && (
                        <Button variant="ghost" className="flex-1 rounded-xl h-10 font-bold text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
