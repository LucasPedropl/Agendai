import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BookingOutletContext } from './BookingLayout';
import { fetchApi } from '@/lib/api';
import { extractHorariosDisponiveis } from '@/lib/apiHelpers';
import { mergeProfessionalSlots, ProfessionalSlots, isSlotInPast } from '@/lib/agendaSlots';
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'motion/react';
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

export function CalendarStep() {
  const { comercioId, servicos, profissionais, isLoading } =
    useOutletContext<BookingOutletContext>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const servicoId = searchParams.get('servico');
  const profParam = searchParams.get('profissional') || 'qualquer';

  // Validação: serviço deve existir
  const selectedService = servicos.find((s) => String(s.id) === servicoId) || null;
  const isQualquer = profParam === 'qualquer';
  const selectedProfessional = isQualquer
    ? null
    : profissionais.find((p) => String(p.id) === profParam) || null;

  useEffect(() => {
    if (!isLoading && (!servicoId || !selectedService)) {
      navigate(`/app/estabelecimento/${comercioId}`, { replace: true });
    }
  }, [isLoading, servicoId, selectedService, comercioId, navigate]);

  // Estados locais da etapa
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<number[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [professionalByTime, setProfessionalByTime] = useState<Record<string, string>>({});
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Carrega datas disponíveis ao montar ou mudar o mês/profissional
  useEffect(() => {
    if (!selectedService) return;

    let isMounted = true;
    setIsLoadingDates(true);
    setAvailableDates([]);

    const queryParams = new URLSearchParams({
      ano: currentMonth.getFullYear().toString(),
      mes: (currentMonth.getMonth() + 1).toString(),
      servicoId: selectedService.id.toString(),
      profissionalId: selectedProfessional?.id?.toString() || '',
      comercioId: comercioId.toString(),
    });

    fetchApi(`/api/Agenda/Agenda-Datas/?${queryParams.toString()}`, {
      method: 'GET',
      skipToast: true,
      notFoundAsEmpty: true,
    })
      .then((data) => {
        if (!isMounted) return;
        setAvailableDates(Array.isArray(data) ? (data as number[]) : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setAvailableDates([]);
        toast.error('Não foi possível carregar as datas disponíveis.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingDates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMonth, selectedService, selectedProfessional, comercioId]);

  const handlePrevMonth = () => {
    const prevMonth = addMonths(currentMonth, -1);
    if (isBefore(startOfMonth(prevMonth), startOfMonth(new Date()))) return;
    setCurrentMonth(prevMonth);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    setCurrentMonth(nextMonth);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
  };

  const handleSelectDate = async (date: Date) => {
    if (!selectedService) return;

    // Bloqueio de data passada
    if (isBefore(startOfDay(date), startOfDay(new Date()))) {
      toast.error('Não é possível selecionar uma data no passado.');
      return;
    }

    setSelectedDate(date);
    setSelectedTime(null);
    setIsLoadingTimes(true);

    try {
      const professionalIds: string[] = selectedProfessional
        ? [selectedProfessional.id.toString()]
        : profissionais.map((p) => p.id.toString());

      if (professionalIds.length === 0) {
        setAvailableTimes([]);
        setProfessionalByTime({});
        return;
      }

      const results = await Promise.allSettled(
        professionalIds.map(async (profId) => {
          const q = new URLSearchParams({
            dataEscolhida: date.toISOString(),
            servicoId: selectedService.id.toString(),
            profissionalId: profId,
            comercioId: comercioId.toString(),
          });
          const data = await fetchApi(`/api/Agenda/Agenda-Horarios/?${q.toString()}`, {
            method: 'GET',
            skipToast: true,
          });
          const times = extractHorariosDisponiveis(data);
          return { professionalId: profId, times };
        })
      );

      const successfulSlots: ProfessionalSlots[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled') {
          successfulSlots.push(res.value);
        }
      }

      if (successfulSlots.length === 0) {
        setAvailableTimes([]);
        setProfessionalByTime({});
        toast.error('Não foi possível carregar os horários para este dia.');
      } else {
        const merged = mergeProfessionalSlots(successfulSlots);
        setAvailableTimes(merged.times);
        setProfessionalByTime(merged.professionalByTime);
      }
    } catch {
      setAvailableTimes([]);
      setProfessionalByTime({});
      toast.error('Erro ao carregar horários disponíveis.');
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const handleProceedToConfirm = () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    // Validação de segurança: re-verifica se o horário selecionado já passou
    if (isSlotInPast(selectedDate, selectedTime, new Date())) {
      toast.error('O horário selecionado já passou. Por favor, escolha outro horário.');
      setSelectedTime(null);
      return;
    }

    const dateFormatted = format(selectedDate, 'yyyy-MM-dd');
    const finalProfId = isQualquer
      ? professionalByTime[selectedTime] || 'qualquer'
      : profParam;

    navigate(
      `/app/estabelecimento/${comercioId}/confirmar?servico=${selectedService.id}&profissional=${finalProfId}&data=${dateFormatted}&horario=${selectedTime}`
    );
  };

  if (isLoading || !selectedService) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Skeleton className="h-96 lg:col-span-7 rounded-3xl" />
        <Skeleton className="h-96 lg:col-span-5 rounded-3xl" />
      </div>
    );
  }

  const daysInMonth = eachDayOfInterval({
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
        {/* Calendário */}
        <div className="lg:col-span-7 bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm">
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
                className="h-9 w-9 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-bold min-w-[130px] text-center capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                className="h-9 w-9 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isLoadingDates ? (
            <div className="grid grid-cols-7 gap-2 py-8">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-bold text-muted-foreground uppercase py-2"
                >
                  {d}
                </div>
              ))}
              {daysInMonth.map((day) => {
                const isAvailable = availableDates.includes(day.getDate());
                const isPast = isBefore(day, startOfDay(new Date()));
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                return (
                  <button
                    key={day.toString()}
                    type="button"
                    disabled={!isAvailable || isPast}
                    onClick={() => handleSelectDate(day)}
                    className={`
                      h-12 rounded-xl flex flex-col items-center justify-center transition-all relative
                      ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10 font-bold'
                          : isAvailable && !isPast
                            ? 'hover:bg-primary/10 hover:text-primary text-foreground font-medium cursor-pointer'
                            : 'text-muted-foreground/30 cursor-not-allowed bg-transparent'
                      }
                    `}
                  >
                    <span className="text-sm">{format(day, 'd')}</span>
                    {isAvailable && !isPast && !isSelected && (
                      <div className="w-1 h-1 bg-primary rounded-full mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!isLoadingDates && availableDates.length === 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground p-4 bg-accent/30 rounded-2xl">
              <Info className="w-4 h-4 shrink-0 text-primary" />
              <p className="text-xs">
                Não há datas disponíveis em {format(currentMonth, 'MMMM', { locale: ptBR })}. Tente o próximo mês.
              </p>
            </div>
          )}
        </div>

        {/* Seleção de Horários & Resumo */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm h-full flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : '...'}
            </h3>

            {isLoadingTimes ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : selectedDate ? (
              <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {availableTimes.length > 0 ? (
                  availableTimes.map((time) => {
                    // Bloqueio de horário no passado para a data de hoje no horário local
                    const isPast = isSlotInPast(selectedDate, time, new Date());
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isPast}
                        onClick={() => setSelectedTime(time)}
                        title={isPast ? 'Horário indisponível (já passou)' : undefined}
                        className={`
                          py-3 rounded-xl text-sm font-bold border transition-all
                          ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground shadow-md'
                              : isPast
                                ? 'opacity-30 cursor-not-allowed line-through bg-muted/20 border-transparent text-muted-foreground'
                                : 'bg-accent/50 border-transparent hover:border-primary/50 text-foreground cursor-pointer'
                          }
                        `}
                      >
                        {time}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-3 py-12 text-center text-muted-foreground">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhum horário disponível para este dia.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <CalendarIcon className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm">Selecione uma data no calendário para ver os horários disponíveis.</p>
              </div>
            )}

            <div className="mt-auto pt-8 border-t border-border space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total do agendamento</span>
                <span className="text-xl font-extrabold text-foreground">
                  R$ {selectedService.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Button
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                disabled={!selectedTime || isLoadingTimes}
                onClick={handleProceedToConfirm}
              >
                Avançar para Confirmação
              </Button>
              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Pagamento será realizado no estabelecimento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Navegação */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 border-t border-border mt-12">
        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/app/estabelecimento/${comercioId}/profissional?servico=${selectedService.id}`
            )
          }
          className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar aos Profissionais
        </Button>
        <Link to="/app">
          <Button
            variant="ghost"
            className="w-full sm:w-auto h-12 px-8 rounded-xl text-muted-foreground hover:text-destructive"
          >
            Sair e Escolher outra Loja
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
