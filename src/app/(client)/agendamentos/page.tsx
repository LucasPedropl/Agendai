import { useState } from 'react';
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
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClienteAgendamentos } from '@/hooks/useClienteQueries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { formatBRL } from '@/lib/utils';

interface Agendamento {
  id: number;
  dataAgendamento: string;
  servicoNome: string;
  profissionalNome?: string;
  status?: 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado' | string;
  estabelecimentoNome?: string;
  valor?: number;
  horaAgendamento?: string;
  horario?: string;
  idProfissional?: string;
  idServico?: number;
}

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : undefined;
  const { data: agendamentos = [], isPending: isLoading } = useClienteAgendamentos<Agendamento>(userId);
  const [activeTab, setActiveTab] = useState('Todos');
  const tabs = ['Todos', 'Pendentes', 'Confirmados', 'Concluídos', 'Cancelados'];
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  
  // Reagendamento state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState<number | null>(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

  const agendamentosList = agendamentos;

  const handleCancelAgendamento = async () => {
    if (!selectedAgendamentoId) return;
    try {
      await fetchApi(`/api/Agenda/Cancelar/${selectedAgendamentoId}`, { method: 'DELETE' });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.clienteAgendamentos(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.clienteHistorico(userId) });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelModalOpen(false);
      setSelectedAgendamentoId(null);
      setSelectedAgendamento(null);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgendamentoId || !rescheduleDate || !rescheduleTime) return;
    
    setIsRescheduling(true);
    try {
      const payload: Record<string, unknown> = {
        data: new Date(rescheduleDate).toISOString(),
        horario: rescheduleTime.length === 5 ? `${rescheduleTime}:00` : rescheduleTime
      };
      if (selectedAgendamento?.idProfissional) {
        payload.idProfissional = selectedAgendamento.idProfissional;
      }
      if (selectedAgendamento?.idServico) {
        payload.idServico = selectedAgendamento.idServico;
      }
      
      await fetchApi(`/api/Agenda/Reagendar/${selectedAgendamentoId}`, { 
        method: 'PUT',
        body: payload
      });
      
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.clienteAgendamentos(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.clienteHistorico(userId) });
      }
      setRescheduleModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRescheduling(false);
      setSelectedAgendamentoId(null);
      setSelectedAgendamento(null);
      setRescheduleDate('');
      setRescheduleTime('');
    }
  };

  const getStatusConfig = (status?: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmado':
        return {
          label: 'Confirmado',
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'bg-green-500/10 text-green-600 border-green-500/20',
          dot: 'bg-green-500'
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          icon: <XCircle className="h-4 w-4" />,
          color: 'bg-red-500/10 text-red-600 border-red-500/20',
          dot: 'bg-red-500'
        };
      case 'concluído':
      case 'concluido':
      case 'finalizado':
        return {
          label: 'Concluído',
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          dot: 'bg-blue-500'
        };
      case 'pendente':
        return {
          label: 'Pendente',
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          dot: 'bg-amber-500'
        };
      default:
        return {
          label: status || 'Confirmado',
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'bg-green-500/10 text-green-600 border-green-500/20',
          dot: 'bg-green-500'
        };
    }
  };

  const filteredAgendamentos = agendamentosList.filter(a => {
    const rawStatus = (a.status || 'Confirmado').toLowerCase();
    if (activeTab === 'Pendentes' && rawStatus !== 'pendente') return false;
    if (activeTab === 'Confirmados' && rawStatus !== 'confirmado') return false;
    if (activeTab === 'Concluídos' && rawStatus !== 'concluído' && rawStatus !== 'concluido' && rawStatus !== 'finalizado') return false;
    if (activeTab === 'Cancelados' && rawStatus !== 'cancelado') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const servico = (a.servicoNome || '').toLowerCase();
      const prof = (a.profissionalNome || '').toLowerCase();
      const estab = (a.estabelecimentoNome || '').toLowerCase();
      return servico.includes(term) || prof.includes(term) || estab.includes(term);
    }
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              const isValidDate = !isNaN(data.getTime());
              const config = getStatusConfig(agendamento.status);
              const profNome = agendamento.profissionalNome || 'Profissional';
              const rawHora = agendamento.horaAgendamento || agendamento.horario;
              const formattedTime = rawHora 
                ? String(rawHora).slice(0, 5) 
                // A API do cliente não devolve a hora (AgendaView sem HoraAgendamento).
                : (isValidDate && format(data, "HH:mm") !== "00:00" ? format(data, "HH:mm") : "Não informada");
              const isPendenteOuConfirmado = config.label === 'Pendente' || config.label === 'Confirmado';
              
              return (
                <motion.div
                  layout
                  key={agendamento.id}
                  className="group bg-card border border-border rounded-[2rem] p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="space-y-6">
                    {/* Status & Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${config.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </div>
                    </div>

                    {/* Service Info */}
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {agendamento.servicoNome}
                      </h3>
                      {agendamento.estabelecimentoNome && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {agendamento.estabelecimentoNome}
                        </p>
                      )}
                    </div>

                    {/* Date & Time Box */}
                    <div className="grid grid-cols-2 gap-3 bg-accent/30 p-4 rounded-2xl border border-border/50">
                      <div className="flex flex-col items-center justify-center border-r border-border/50">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Data</span>
                        <span className="text-sm font-bold">{isValidDate ? format(data, "dd/MM/yyyy") : '--/--/----'}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Hora</span>
                        <span className="text-sm font-bold">{formattedTime}</span>
                      </div>
                    </div>

                    {/* Professional */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                          {profNome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Profissional</p>
                          <p className="text-sm font-bold">{profNome}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Valor</p>
                        <p className="text-sm font-extrabold text-foreground">
                          {agendamento.valor ? formatBRL(Number(agendamento.valor)) : 'A consultar'}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-4 border-t border-border/50 flex gap-3">
                      {isPendenteOuConfirmado && (
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-xl h-10 font-bold text-xs hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                          onClick={() => {
                            setSelectedAgendamentoId(agendamento.id);
                            setSelectedAgendamento(agendamento);
                            setRescheduleDate(agendamento.dataAgendamento?.split('T')[0] || '');
                            setRescheduleTime(rawHora ? String(rawHora).slice(0, 5) : '');
                            setRescheduleModalOpen(true);
                          }}
                        >
                          Reagendar
                        </Button>
                      )}
                      {isPendenteOuConfirmado && (
                        <Button 
                          variant="ghost" 
                          className="flex-1 rounded-xl h-10 font-bold text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedAgendamentoId(agendamento.id);
                            setSelectedAgendamento(agendamento);
                            setCancelModalOpen(true);
                          }}
                        >
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

      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedAgendamentoId(null);
        }}
        onConfirm={handleCancelAgendamento}
        title="Cancelar Agendamento"
        description="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
        variant="destructive"
      />

      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedAgendamentoId(null);
        }}
        title="Reagendar Serviço"
      >
        <form onSubmit={handleReschedule} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Escolha a nova data e horário para o seu agendamento.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Nova Data</label>
              <Input 
                type="date" 
                required 
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Novo Horário</label>
              <Input 
                type="time" 
                required 
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setRescheduleModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isRescheduling}>
              {isRescheduling ? 'Salvando...' : 'Confirmar Reagendamento'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
