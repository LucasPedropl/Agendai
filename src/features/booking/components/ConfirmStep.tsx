import { useState } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BookingOutletContext } from './BookingLayout';
import { fetchApi } from '@/lib/api';
import { toApiTimeSpan } from '@/lib/apiHelpers';
import { isSlotInPast } from '@/lib/agendaSlots';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Calendar,
  Sparkles,
  User,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ConfirmStep() {
  const { comercioId, estabelecimento, servicos, profissionais, isLoading } =
    useOutletContext<BookingOutletContext>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const servicoId = searchParams.get('servico');
  const profParam = searchParams.get('profissional') || 'qualquer';
  const dataStr = searchParams.get('data');
  const horario = searchParams.get('horario');

  // Converte data segura
  let bookingDate: Date | null = null;
  if (dataStr) {
    const [y, m, d] = dataStr.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      bookingDate = new Date(y, m - 1, d, 12, 0, 0);
    }
  }

  const selectedService = servicos.find((s) => String(s.id) === servicoId) || null;
  const selectedProfessional =
    profParam !== 'qualquer'
      ? profissionais.find((p) => String(p.id) === profParam) || null
      : null;

  // Se parâmetros estiverem ausentes e os dados já foram carregados, redireciona para a etapa anterior
  if (!isLoading && (!selectedService || !bookingDate || !horario)) {
    navigate(`/app/estabelecimento/${comercioId}/horario?servico=${servicoId || ''}`, {
      replace: true,
    });
    return null;
  }

  const handleConfirmBooking = async () => {
    if (!bookingDate || !horario || !selectedService || !user) return;

    // Guarda contra data/hora no passado no momento exato do envio
    if (isSlotInPast(bookingDate, horario, new Date())) {
      toast.error('O horário selecionado já passou. Por favor, escolha outro horário.');
      navigate(
        `/app/estabelecimento/${comercioId}/horario?servico=${selectedService.id}&profissional=${profParam}`
      );
      return;
    }

    const professionalId = selectedProfessional
      ? String(selectedProfessional.id)
      : profParam !== 'qualquer'
        ? profParam
        : profissionais[0]?.id?.toString() || '';

    if (!professionalId) {
      toast.error('Nenhum profissional disponível para este horário.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi('/api/Agenda', {
        method: 'POST',
        skipToast: true,
        body: {
          idProfissional: professionalId,
          idProssional: professionalId,
          idUsuario: String(user.id),
          data: bookingDate.toISOString(),
          horario: toApiTimeSpan(horario),
          idServico: selectedService.id,
        },
      });

      setIsConfirmed(true);
      toast.success('Agendamento realizado com sucesso!');
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err, 'Não foi possível realizar o agendamento.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !selectedService || !bookingDate || !horario) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 mx-auto rounded-xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    );
  }

  // Visual de sucesso após confirmação
  if (isConfirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-12 text-center space-y-8"
      >
        <div className="relative inline-block">
          <div className="w-28 h-28 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0, 0.8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-green-500/20 rounded-full"
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Agendamento Confirmado!
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Tudo certo! Seu horário foi reservado em <strong>{estabelecimento?.nome}</strong>.
          </p>
        </div>

        {/* Resumo do agendamento confirmado */}
        <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm text-left grid sm:grid-cols-2 gap-6 relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Data e Hora</p>
                <p className="font-bold text-sm sm:text-base">
                  {format(bookingDate, "dd 'de' MMMM", { locale: ptBR })} às {horario}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Serviço</p>
                <p className="font-bold text-sm sm:text-base">{selectedService.nome}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Profissional</p>
                <p className="font-bold text-sm sm:text-base">
                  {selectedProfessional?.nome || 'Melhor horário disponível'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Valor Estimado</p>
                <p className="font-bold text-sm sm:text-base">
                  R$ {selectedService.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            size="lg"
            className="h-14 px-8 rounded-2xl font-bold"
            onClick={() => navigate('/app/agendamentos')}
          >
            Ver Meus Agendamentos
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 rounded-2xl font-bold"
            onClick={() => navigate('/app')}
          >
            Fazer outro agendamento
          </Button>
        </div>
      </motion.div>
    );
  }

  // Visual de Revisão e Confirmação
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold">Confirmar Agendamento</h3>
        <p className="text-muted-foreground text-sm sm:text-base">
          Revise os detalhes abaixo antes de confirmar sua reserva.
        </p>
      </div>

      <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-lg sm:text-xl truncate">
              {estabelecimento?.nome || 'Estabelecimento'}
            </h4>
            <p className="text-xs text-muted-foreground truncate">{estabelecimento?.endereco}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-accent/40 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Data e Horário
            </span>
            <p className="font-bold text-sm sm:text-base">
              {format(bookingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-primary font-semibold">às {horario}</p>
          </div>

          <div className="p-4 bg-accent/40 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Serviço Selecionado
            </span>
            <p className="font-bold text-sm sm:text-base truncate">{selectedService.nome}</p>
            <p className="text-xs text-muted-foreground">Duração: {selectedService.duracao}</p>
          </div>

          <div className="p-4 bg-accent/40 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> Profissional
            </span>
            <p className="font-bold text-sm sm:text-base truncate">
              {selectedProfessional?.nome || 'Qualquer um (Melhor horário)'}
            </p>
            <p className="text-xs text-muted-foreground">Atendimento confirmado</p>
          </div>

          <div className="p-4 bg-accent/40 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-primary" /> Valor Estimado
            </span>
            <p className="font-extrabold text-base sm:text-lg text-primary">
              R$ {selectedService.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" /> Pagar no local
            </p>
          </div>
        </div>

        <Button
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
          disabled={isSubmitting}
          onClick={handleConfirmBooking}
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
        </Button>
      </div>

      {/* Botões de Navegação */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/app/estabelecimento/${comercioId}/horario?servico=${selectedService.id}&profissional=${profParam}`
            )
          }
          className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar e Alterar Horário
        </Button>
        <Link to="/app">
          <Button
            variant="ghost"
            className="w-full sm:w-auto h-12 px-8 rounded-xl text-muted-foreground hover:text-destructive"
          >
            Sair e Cancelar
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
