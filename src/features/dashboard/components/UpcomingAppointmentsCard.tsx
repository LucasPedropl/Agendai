import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import type { UpcomingAppointment } from '@/hooks/useDashboardQueries';

interface UpcomingAppointmentsCardProps {
  appointments: UpcomingAppointment[];
  isProfissional: boolean;
}

export function UpcomingAppointmentsCard({
  appointments,
  isProfissional,
}: UpcomingAppointmentsCardProps) {
  const navigate = useNavigate();
  const basePath = isProfissional ? '/profissional' : '/estabelecimento';

  return (
    <Card className="col-span-1 lg:col-span-3 overflow-hidden border border-border bg-card shadow-sm flex flex-col justify-between">
      <div>
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {isProfissional ? 'Próximos atendimentos do estabelecimento' : 'Próximos Clientes'}
              </CardTitle>
              {isProfissional && (
                // GET /api/Agenda/Comercio/{id} não diz qual profissional atende.
                <p className="mt-1 text-xs text-muted-foreground">Inclui os horários de toda a equipe.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate(`${basePath}/agenda`)}
              className="text-xs font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              Ver Agenda
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm font-medium italic">Nenhum agendamento próximo.</p>
              <p className="text-xs opacity-70 mt-1">
                Novos agendamentos aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((agendamento) => (
                <div
                  key={agendamento.id}
                  onClick={() => navigate(`${basePath}/agenda`)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-muted/10 hover:bg-accent/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-background border border-border group-hover:border-primary/40 transition-colors shadow-xs">
                      <span className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">
                        {agendamento.isToday ? 'Hoje' : 'Início'}
                      </span>
                      <span className="text-sm font-bold text-foreground leading-none">
                        {agendamento.horario}
                      </span>
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="text-sm font-bold text-foreground truncate">
                        {agendamento.cliente}
                      </p>
                      <p className="text-xs text-muted-foreground truncate italic">
                        {agendamento.servico}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <p className="text-sm font-black text-foreground">
                      R${' '}
                      {agendamento.valor.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <StatusBadge
                      label={agendamento.status}
                      variant={getStatusVariant(agendamento.status)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <div className="p-4 sm:p-6 pt-0 mt-4">
        <button
          type="button"
          onClick={() => navigate(`${basePath}/agenda`)}
          className="w-full py-2.5 border border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground uppercase tracking-wider hover:bg-accent/40 hover:text-foreground transition-all flex items-center justify-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Acessar Calendário Completo
        </button>
      </div>
    </Card>
  );
}
