import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Calendar, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/page-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { useComercioId } from '@/hooks/useComercioId';
import { cn } from '@/lib/utils';

interface HistoricoItem {
  dataAgendamento: string;
  servicoNome: string;
  usuarioNome: string;
  status: string;
  horaAgendamento?: string;
}

export default function AdminHistoryPage() {
  const { comercioId, isLoading: isLoadingComercio } = useComercioId();
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<HistoricoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistorico = useCallback(async () => {
    if (!comercioId) return;
    setIsLoading(true);
    try {
      const statusParam = activeTab === 'concluidos' ? 'Concluido' : activeTab === 'cancelados' ? 'Cancelado' : '';
      const query = new URLSearchParams({ periodo: 'mes' });
      if (statusParam) query.set('status', statusParam);
      const data = await fetchApi(
        `/api/Agenda/Comercio-Historico/${comercioId}?${query.toString()}`,
        { skipToast: true } as RequestInit
      );
      setItems(normalizeApiList<HistoricoItem>(data, ['Histórico Vazio']));
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [comercioId, activeTab]);

  useEffect(() => { loadHistorico(); }, [loadHistorico]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return item.servicoNome?.toLowerCase().includes(term) || item.usuarioNome?.toLowerCase().includes(term);
  });

  const concluidos = items.filter((i) => i.status?.toLowerCase().includes('finaliz')).length;
  const cancelados = items.filter((i) => i.status?.toLowerCase().includes('cancel')).length;

  const stats = [
    { label: 'Concluídos', value: concluidos, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Cancelados', value: cancelados, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Total no período', value: items.length, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const tabs = [
    { id: 'todos', label: 'Todos', count: items.length },
    { id: 'concluidos', label: 'Concluídos', count: concluidos },
    { id: 'cancelados', label: 'Cancelados', count: cancelados },
  ] as const;

  if (isLoadingComercio) return <PageLoader label="Carregando histórico..." />;

  return (
    <div className="space-y-8">
      <PageHeader title="Histórico de Agendamentos" description="Visualize agendamentos passados do estabelecimento." />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
            </div>
            <div className={cn('p-3 rounded-2xl', stat.bg, stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex p-1 bg-muted rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agendamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <PageLoader fullPage={false} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum agendamento no histórico"
          description="Os agendamentos concluídos ou cancelados aparecerão aqui."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <Card key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-primary/20 transition-colors">
              <div>
                <p className="font-semibold text-foreground">{item.servicoNome}</p>
                <p className="text-sm text-muted-foreground">{item.usuarioNome}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(item.dataAgendamento).toLocaleDateString('pt-BR')}
                {item.horaAgendamento ? ` às ${String(item.horaAgendamento).slice(0, 5)}` : ''}
              </div>
              <StatusBadge label={item.status} variant={getStatusVariant(item.status)} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
