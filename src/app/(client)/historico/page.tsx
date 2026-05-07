import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  XCircle,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { useClientDashboard } from '@/hooks/useClientDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryItem {
  id?: number;
  dataAgendamento: string;
  servicoNome: string;
  profissionalNome?: string;
  estabelecimentoNome?: string;
  status: 'Concluído' | 'Cancelado' | string;
  valor: number;
}

export default function ClientHistoryPage() {
  const { user } = useAuth();
  const { getHistorico, isLoading } = useClientDashboard();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistorico();
  }, [user]);

  const loadHistorico = async () => {
    if (user?.id) {
      const data = await getHistorico(user.id);
      setHistory(Array.isArray(data) ? data : []);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3" />
            Concluído
          </div>
        );
      case 'Cancelado':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider">
            <XCircle className="h-3 w-3" />
            Cancelado
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-[10px] font-bold uppercase tracking-wider">
            {status}
          </div>
        );
    }
  };

  const filteredHistory = history.filter(item => 
    item.servicoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.estabelecimentoNome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Histórico de Serviços
          </h1>
          <p className="text-muted-foreground">Relembre seus atendimentos e avalie sua experiência.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl h-10 gap-2 text-xs font-bold">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por serviço ou estabelecimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="md:col-span-3">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="date"
                className="w-full pl-11 pr-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <Button className="w-full h-11 rounded-2xl gap-2 font-bold">
              <Filter className="h-4 w-4" /> Filtrar Resultados
            </Button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))
        ) : filteredHistory.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-accent/10 rounded-[2.5rem] border-2 border-dashed border-border">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto shadow-sm">
              <History className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground">Parece que você ainda não tem atendimentos concluídos.</p>
            </div>
            <Button variant="link" className="font-bold text-primary" onClick={() => window.location.href = '/app'}>
              Agende seu primeiro serviço agora
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item, index) => {
              const data = new Date(item.dataAgendamento);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card border border-border rounded-3xl p-5 hover:border-primary/30 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary border border-primary/20">
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{format(data, "MMM", { locale: ptBR })}</span>
                        <span className="text-xl font-extrabold leading-none">{format(data, "dd")}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                          {item.servicoNome}
                        </h3>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(data, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            {item.estabelecimentoNome || 'Estabelecimento'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-border/50">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Status</p>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Valor Pago</p>
                        <p className="text-xl font-extrabold text-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                        </p>
                      </div>

                      <button className="h-10 w-10 rounded-xl bg-accent/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {!isLoading && history.length > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Total Gasto</p>
              <p className="text-3xl font-black text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  history.reduce((acc, curr) => acc + (curr.valor || 0), 0)
                )}
              </p>
            </div>
            <div className="w-px h-10 bg-primary/20 hidden md:block" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Total de Serviços</p>
              <p className="text-3xl font-black text-primary">{history.length}</p>
            </div>
          </div>
          <Button className="h-12 px-8 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20">
            Fazer Novo Agendamento <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
