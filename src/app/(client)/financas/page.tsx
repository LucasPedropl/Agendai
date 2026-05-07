import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  Receipt,
  PieChart,
  ChevronRight,
  MoreVertical,
  Filter
} from 'lucide-react';
import { useFinance, Pagamento } from '@/hooks/useFinance';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientFinancasPage() {
  const { getPagamentosCliente, isLoading } = useFinance();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [stats, setStats] = useState({
    totalGasto: 0,
    servicosRealizados: 0,
    mediaMensal: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getPagamentosCliente();
    setPagamentos(data);
    
    // Calculate stats
    const total = data.reduce((acc, curr) => acc + curr.valor, 0);
    setStats({
      totalGasto: total,
      servicosRealizados: data.length,
      mediaMensal: data.length > 0 ? total / 12 : 0 // Estimativa simples
    });
  };

  const getStatusBadge = (status: number) => {
    // Enum mock logic: 0=Pendente, 1=Pago, 2=Cancelado, 3=Estornado
    switch (status) {
      case 1:
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Pago</span>;
      case 2:
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 border border-red-500/20">Cancelado</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">Pendente</span>;
    }
  };

  const getMetodoIcon = (metodo: number) => {
    // Enum mock: 0=Dinheiro, 1=Cartão, 2=Pix, etc.
    if (metodo === 1) return <CreditCard className="h-4 w-4" />;
    if (metodo === 2) return <Receipt className="h-4 w-4" />;
    return <Wallet className="h-4 w-4" />;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      {/* Header & Balance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white shadow-2xl border border-white/5">
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Saldo Total Gasto</p>
                <h1 className="text-5xl font-black tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalGasto)}
                </h1>
              </div>
              <div className="bg-white/10 p-4 rounded-[1.5rem] backdrop-blur-md">
                <PieChart className="h-8 w-8 text-white/80" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Média Mensal</p>
                  <p className="text-sm font-bold">R$ {stats.mediaMensal.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Total Serviços</p>
                  <p className="text-sm font-bold">{stats.servicosRealizados}</p>
                </div>
              </div>
            </div>
          </div>
          <DollarSign className="absolute right-[-40px] top-[-40px] w-64 h-64 text-white/5 -rotate-12 pointer-events-none" />
        </div>

        <div className="bg-primary p-10 rounded-[2.5rem] text-primary-foreground shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <h3 className="text-xl font-bold">Fatura Atual</h3>
            <p className="text-3xl font-black">R$ 0,00</p>
            <p className="text-xs opacity-70">Nenhum pagamento pendente para este mês.</p>
          </div>
          <Button variant="secondary" className="relative z-10 w-full rounded-2xl font-bold h-12 shadow-lg group-hover:scale-[1.02] transition-transform">
            Ver Faturas <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-extrabold flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            Histórico de Pagamentos
          </h2>
          <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs gap-2">
            <Filter className="h-4 w-4" /> Filtrar
          </Button>
        </div>

        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))
            ) : pagamentos.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground">Nenhuma transação registrada até o momento.</p>
              </div>
            ) : (
              pagamentos.map((pagamento) => (
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  key={pagamento.id} 
                  className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-accent/30 transition-colors group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {getMetodoIcon(pagamento.metodoPagamento)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg">
                        {pagamento.descricao || `Pagamento #${pagamento.id}`}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(pagamento.dataCriacao), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>ID: {pagamento.agendamentoId}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 pt-4 md:pt-0 border-border/50">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Valor</p>
                      <p className="text-xl font-black text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagamento.valor)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(pagamento.statusPagamento)}
                      <button className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
