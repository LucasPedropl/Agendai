import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { extractHorariosDisponiveis, normalizeApiList, toApiTimeSpan } from '@/lib/apiHelpers';
import { EstablishmentCard } from '@/components/EstablishmentCard';
import {
  Search,
  Star,
  Calendar,
  ChevronRight,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  CalendarDays,
  Info,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

// --- Types & Interfaces ---

interface Estabelecimento {
  id: number;
  nome: string;
  endereco: string;
  descricao?: string;
  mediaAvalicoes?: number;
  totalAvalicoes?: number;
}

interface Servico {
  id: number;
  nome: string;
  preco: number;
  duracao: string;
  icone?: string;
}

interface Profissional {
  id: string | number;
  nome: string;
  status?: string;
}

/**
 * AgendarPage (Smart Component)
 * Fluxo de agendamento em etapas para o cliente.
 */
export default function AgendarPage() {
  // --- State ---
  const [step, setStep] = useState(1);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const toast = useToast();
  const { user } = useAuth();

  // Selection State
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<Estabelecimento | null>(null);
  const [selectedService, setSelectedService] = useState<Servico | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Profissional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Available Slots State
  const [availableDates, setAvailableDates] = useState<number[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- Effects ---
  useEffect(() => {
    loadEstabelecimentos();
  }, []);

  // --- Data Loading Handlers ---

  const loadEstabelecimentos = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi('/api/Comercios', { method: 'GET' });
      setEstabelecimentos(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Não foi possível carregar os estabelecimentos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEstabelecimento = async (est: Estabelecimento) => {
    setSelectedEstabelecimento(est);
    setIsLoading(true);
    try {
      const [servicesData, professionalsData] = await Promise.all([
        fetchApi(`/api/Servicos/Todos/${est.id}`, { method: 'GET' }),
        fetchApi(`/api/ComercioUsuarios/Profissionais-Agendar/${est.id}`, { method: 'GET' }).catch(() => [])
      ]);

      setServicos(Array.isArray(servicesData) ? servicesData : []);
      setProfissionais(Array.isArray(professionalsData) ? professionalsData : []);
      setStep(2);
    } catch (err) {
      toast.error('Erro ao carregar informações do estabelecimento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectService = (service: Servico) => {
    setSelectedService(service);
    setStep(3);
  };

  const handleSelectProfessional = async (prof: Profissional | null) => {
    setSelectedProfessional(prof);
    setIsLoading(true);
    try {
      await loadAvailableDates(currentMonth, prof);
      setStep(4);
    } catch (err) {
      toast.error('Erro ao carregar datas disponíveis.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableDates = async (date: Date, prof: Profissional | null) => {
    if (!selectedService || !selectedEstabelecimento) return;

    try {
      const queryParams = new URLSearchParams({
        ano: date.getFullYear().toString(),
        mes: (date.getMonth() + 1).toString(),
        servicoId: selectedService.id.toString(),
        profissionalId: prof?.id?.toString() || '',
        comercioId: selectedEstabelecimento.id.toString(),
      });
      const data = await fetchApi(`/api/Agenda/Agenda-Datas/?${queryParams.toString()}`, { method: 'GET' });
      setAvailableDates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar datas:', err);
    }
  };

  const handlePrevMonth = () => {
    const prevMonth = addMonths(currentMonth, -1);
    if (isBefore(startOfMonth(prevMonth), startOfMonth(new Date()))) return;
    setCurrentMonth(prevMonth);
    loadAvailableDates(prevMonth, selectedProfessional);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    setCurrentMonth(nextMonth);
    loadAvailableDates(nextMonth, selectedProfessional);
  };

  const handleSelectDate = async (date: Date) => {
    if (!selectedService || !selectedEstabelecimento) return;

    setSelectedDate(date);
    setSelectedTime(null);
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        dataEscolhida: date.toISOString(),
        servicoId: selectedService.id.toString(),
        profissionalId: selectedProfessional?.id?.toString() || '',
        comercioId: selectedEstabelecimento.id.toString(),
      });
      const data = await fetchApi(`/api/Agenda/Agenda-Horarios/?${queryParams.toString()}`, { method: 'GET' });
      setAvailableTimes(extractHorariosDisponiveis(data));
    } catch (err) {
      toast.error('Erro ao carregar horários disponíveis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTime || !selectedDate || !selectedService || !user) return;

    setIsLoading(true);
    try {
      await fetchApi('/api/Agenda', {
        method: 'POST',
        body: {
          IdProssional: selectedProfessional?.id?.toString() || '',
          IdUsuario: user.id,
          Data: selectedDate.toISOString(),
          Horario: toApiTimeSpan(selectedTime),
          IdServico: selectedService.id,
        },
      });
      setStep(5);
      toast.success('Agendamento realizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao realizar agendamento.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEstabelecimentos = estabelecimentos.filter(
    (est) =>
      est.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Helpers ---

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      <div className="flex items-center w-full max-w-2xl px-4">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${
                    step === s
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-lg'
                      : step > s
                        ? 'bg-green-500 text-white'
                        : 'bg-accent text-muted-foreground'
                  }
                `}
              >
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              <span
                className={`text-[10px] absolute -bottom-6 font-bold uppercase tracking-wider whitespace-nowrap ${
                  step === s ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {s === 1 ? 'Loja' : s === 2 ? 'Serviço' : s === 3 ? 'Profissional' : 'Data'}
              </span>
            </div>
            {s < 4 && (
              <div className="flex-1 mx-2 h-1 bg-accent rounded-full relative overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: step > s ? '100%' : '0%' }}
                  className="absolute inset-0 bg-green-500"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderNavigationButtons = () => (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 border-t border-border mt-12">
      <Button
        variant="outline"
        onClick={() => setStep(step - 1)}
        className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Voltar Etapa
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          setStep(1);
          setSelectedEstabelecimento(null);
          setSelectedService(null);
          setSelectedProfessional(null);
          setSelectedDate(null);
          setSelectedTime(null);
        }}
        className="w-full sm:w-auto h-12 px-8 rounded-xl text-muted-foreground hover:text-destructive"
      >
        Sair e Escolher outra Loja
      </Button>
    </div>
  );

  const renderEstablishmentList = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-3xl bg-primary/10 p-8 border border-primary/20">
        <h1 className="text-3xl font-extrabold mb-4">Onde vamos hoje?</h1>
        <div className="relative max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar barbearia, salão, spa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
        <Sparkles className="absolute right-0 top-0 w-48 h-48 text-primary/5 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
        ) : (
          filteredEstabelecimentos.map((est) => (
            <EstablishmentCard
              key={est.id}
              name={est.nome}
              address={est.endereco}
              rating={est.mediaAvalicoes || 0}
              reviews={est.totalAvalicoes || 0}
              onClick={() => handleSelectEstabelecimento(est)}
            />
          ))
        )}
      </div>
    </motion.div>
  );

  const renderServiceSelection = () => {
    if (!selectedEstabelecimento) return null;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl sticky top-6">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl font-bold text-primary">{selectedEstabelecimento.nome.charAt(0)}</span>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">{selectedEstabelecimento.nome}</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">{selectedEstabelecimento.endereco}</p>
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sobre</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedEstabelecimento.descricao || 'Bem-vindo ao nosso espaço de cuidado e beleza.'}
                </p>
              </div>
            </div>
          </div>

          {/* Service List */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-bold">Escolha um serviço</h3>
            <div className="grid gap-4">
              {servicos.map((serv) => (
                <button
                  key={serv.id}
                  onClick={() => handleSelectService(serv)}
                  className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/[0.02] transition-all text-left group"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      {serv.icone ? <span className="text-xl">{serv.icone}</span> : <Sparkles className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{serv.nome}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {serv.duracao}
                        </span>
                        <span className="font-bold text-foreground">
                          R$ {serv.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
        {renderNavigationButtons()}
      </motion.div>
    );
  };

  const renderProfessionalSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Quem vai te atender?</h3>
        <p className="text-muted-foreground">Selecione seu profissional preferido ou deixe conosco.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => handleSelectProfessional(null)}
          className="flex flex-col items-center p-8 bg-primary/5 border-2 border-primary/20 rounded-3xl hover:bg-primary/10 hover:border-primary transition-all group"
        >
          <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <Sparkles className="w-10 h-10" />
          </div>
          <h4 className="font-bold text-lg">Qualquer Profissional</h4>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Iremos selecionar o melhor horário disponível para você.
          </p>
        </button>

        {profissionais.map((prof) => (
          <button
            key={prof.id}
            onClick={() => handleSelectProfessional(prof)}
            className="flex flex-col items-center p-8 bg-card border border-border rounded-3xl hover:border-primary transition-all group"
          >
            <div className="w-20 h-20 bg-accent text-primary rounded-full flex items-center justify-center mb-4 text-2xl font-bold group-hover:scale-110 transition-transform">
              {prof.nome.charAt(0)}
            </div>
            <h4 className="font-bold text-lg">{prof.nome}</h4>
            <div className="flex items-center gap-1 mt-2 text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-bold">4.9</span>
            </div>
          </button>
        ))}
      </div>
      {renderNavigationButtons()}
    </motion.div>
  );

  const renderCalendarStep = () => {
    if (!selectedService) return null;
    
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-7 bg-card border border-border p-8 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-primary" />
                Selecione a Data
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  disabled={isBefore(startOfMonth(addMonths(currentMonth, -1)), startOfMonth(new Date()))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-bold min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-2">
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const isAvailable = availableDates.includes(day.getDate());
                const isPast = isBefore(day, startOfDay(new Date()));
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toString()}
                    disabled={!isAvailable || isPast}
                    onClick={() => handleSelectDate(day)}
                    className={`
                      h-12 rounded-xl flex flex-col items-center justify-center transition-all relative
                      ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10'
                          : isAvailable
                            ? 'hover:bg-primary/10 hover:text-primary text-foreground font-medium'
                            : 'text-muted-foreground/30 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="text-sm">{format(day, 'd')}</span>
                    {isAvailable && !isSelected && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Confirm */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-8 rounded-3xl shadow-sm h-full flex flex-col">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : '...'}
              </h3>

              {isLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : selectedDate ? (
                <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                  {availableTimes.length > 0 ? (
                    availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`
                          py-3 rounded-xl text-sm font-bold border transition-all
                          ${
                            selectedTime === time
                              ? 'bg-primary border-primary text-primary-foreground shadow-md'
                              : 'bg-accent/50 border-transparent hover:border-primary/50 text-foreground'
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 py-12 text-center text-muted-foreground">
                      <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p>Nenhum horário disponível para este dia.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mb-4 opacity-10" />
                  <p>Selecione uma data no calendário para ver os horários.</p>
                </div>
              )}

              <div className="mt-auto pt-8 border-t border-border space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total do agendamento</span>
                  <span className="text-xl font-extrabold">
                    R$ {selectedService.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Button
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                  disabled={!selectedTime || isLoading}
                  onClick={handleConfirmBooking}
                >
                  {isLoading ? 'Processando...' : 'Confirmar Agendamento'}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Pagamento será realizado no estabelecimento
                </p>
              </div>
            </div>
          </div>
        </div>
        {renderNavigationButtons()}
      </motion.div>
    );
  };

  const renderSuccessStep = () => {
    if (!selectedEstabelecimento || !selectedService || !selectedDate) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-20 text-center space-y-8"
      >
        <div className="relative inline-block">
          <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-500" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-green-500/20 rounded-full"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight">Agendamento Confirmado!</h2>
          <p className="text-xl text-muted-foreground">
            Tudo certo! Seu horário foi reservado com sucesso em <strong>{selectedEstabelecimento.nome}</strong>.
          </p>
        </div>

        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm text-left grid md:grid-cols-2 gap-8 relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Data e Hora</p>
                <p className="font-bold">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Serviço</p>
                <p className="font-bold">{selectedService.nome}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Profissional</p>
                <p className="font-bold">
                  {selectedProfessional?.nome || 'Qualquer um (Melhor horário)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Valor Estimado</p>
                <p className="font-bold">
                  R$ {selectedService.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <CheckCircle2 className="absolute right-[-40px] bottom-[-40px] w-64 h-64 text-green-500/5 rotate-12" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            size="lg"
            className="h-14 px-8 rounded-2xl font-bold"
            onClick={() => (window.location.href = '/app/agendamentos')}
          >
            Ver Meus Agendamentos
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 rounded-2xl font-bold"
            onClick={() => {
              setStep(1);
              setSelectedEstabelecimento(null);
              setSelectedService(null);
              setSelectedProfessional(null);
              setSelectedDate(null);
              setSelectedTime(null);
            }}
          >
            Fazer novo agendamento
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
      {step > 1 && step < 5 && renderStepIndicator()}

      <AnimatePresence mode="wait">
        {step === 1 && renderEstablishmentList()}
        {step === 2 && renderServiceSelection()}
        {step === 3 && renderProfessionalSelection()}
        {step === 4 && renderCalendarStep()}
        {step === 5 && renderSuccessStep()}
      </AnimatePresence>
    </div>
  );
}
