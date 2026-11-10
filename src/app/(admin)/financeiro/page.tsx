'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  Filter,
  PieChart as PieChartIcon,
  BarChart2,
  Search,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Transacao } from '@/types';
import { usePagamentosEmpresa } from '@/hooks/useAdminQueries';
import { useComercioId } from '@/hooks/useComercioId';
import { mapPaymentStatusToUi, getPaymentMethodLabel } from '@/lib/paymentEnums';
import { getFriendlyErrorMessage } from '@/lib/errors';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

interface RawPagamento {
  id?: number | string;
  Id?: number | string;
  agendamentoId?: number;
  AgendamentoId?: number;
  valor?: number;
  Valor?: number;
  codigoTransacao?: string;
  CodigoTransacao?: string;
  dataPagamento?: string | null;
  DataPagamento?: string | null;
  dataCriacao?: string;
  DataCriacao?: string;
  descricao?: string;
  Descricao?: string;
  statusPagamento?: number;
  StatusPagamento?: number;
  metodoPagamento?: number;
  MetodoPagamento?: number;
}

type StatusFilterOption = 'todos' | 'pago' | 'pendente' | 'cancelado' | 'reembolsado';

export default function AdminFinanceiroPage() {
  const { comercioId, isLoading: isComercioLoading } = useComercioId();
  
  const { 
    data: pagamentos = [], 
    isPending: isLoadingPagamentos,
    isError: isPagamentosError,
    error: pagamentosError,
    refetch: refetchPagamentos
  } = usePagamentosEmpresa<RawPagamento>(comercioId);

  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('todos');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const transacoes = useMemo<Transacao[]>(() => {
    return pagamentos.map((p) => {
      const id = String(p.id ?? p.Id ?? '');
      const rawDate = p.dataPagamento ?? p.dataCriacao ?? p.DataPagamento ?? p.DataCriacao;
      const statusNum = Number(p.statusPagamento ?? p.StatusPagamento ?? 0);
      const valorNum = Number(p.valor ?? p.Valor ?? 0);
      const desc = String(p.descricao ?? p.Descricao ?? 'Pagamento de agendamento');

      return {
        id,
        descricao: desc,
        valor: valorNum,
        data: rawDate ? String(rawDate) : new Date().toISOString(),
        status: mapPaymentStatusToUi(statusNum),
      };
    });
  }, [pagamentos]);

  const filteredTransacoes = useMemo(() => {
    return transacoes.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.valor.toString().includes(searchTerm) ||
        t.id.includes(searchTerm);
      const matchesStatus = statusFilter === 'todos' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transacoes, searchTerm, statusFilter]);

  const totalEntradas = useMemo(() => {
    return pagamentos
      .filter((p) => Number(p.statusPagamento ?? p.StatusPagamento) === 1)
      .reduce((acc, p) => acc + Number(p.valor ?? p.Valor ?? 0), 0);
  }, [pagamentos]);

  const pagamentosPagosCount = useMemo(() => {
    return pagamentos.filter((p) => Number(p.statusPagamento ?? p.StatusPagamento) === 1).length;
  }, [pagamentos]);

  // Monthly Revenue for Bar Chart (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; name: string; receita: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rawName = d.toLocaleDateString('pt-BR', { month: 'short' });
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace('.', '');
      months.push({ key, name, receita: 0 });
    }

    pagamentos.forEach((p) => {
      const statusNum = Number(p.statusPagamento ?? p.StatusPagamento);
      if (statusNum === 1) {
        const rawDate = p.dataPagamento ?? p.dataCriacao ?? p.DataPagamento ?? p.DataCriacao;
        if (!rawDate) return;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const target = months.find((m) => m.key === key);
        if (target) {
          target.receita += Number(p.valor ?? p.Valor ?? 0);
        }
      }
    });

    return months;
  }, [pagamentos]);

  // Pie Data (Paid valor grouped by metodoPagamento)
  const pieData = useMemo(() => {
    const groups = new Map<number, number>();
    pagamentos.forEach((p) => {
      const statusNum = Number(p.statusPagamento ?? p.StatusPagamento);
      if (statusNum === 1) {
        const method = Number(p.metodoPagamento ?? p.MetodoPagamento ?? 0);
        const val = Number(p.valor ?? p.Valor ?? 0);
        groups.set(method, (groups.get(method) ?? 0) + val);
      }
    });

    const items: { name: string; value: number }[] = [];
    groups.forEach((val, method) => {
      if (val > 0) {
        items.push({
          name: getPaymentMethodLabel(method),
          value: Number(val.toFixed(2)),
        });
      }
    });
    return items;
  }, [pagamentos]);

  const hasMonthlyData = monthlyData.some((m) => m.receita > 0);
  const hasPieData = pieData.length > 0;

  if (isComercioLoading || (isLoadingPagamentos && transacoes.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão Financeira</h1>
        <p className="text-muted-foreground">Controle completo de receitas, faturamento e análise do negócio.</p>
      </div>

      {/* Error Banner when Payments API fails */}
      {isPagamentosError && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-sm font-medium">
              {getFriendlyErrorMessage(pagamentosError, 'Não foi possível carregar os dados financeiros.')}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
            onClick={() => refetchPagamentos()}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Stats Summary Card Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 border border-border shadow-sm bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Entradas
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Receitas Pagas</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-primary text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-foreground/20 text-primary-foreground rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-primary-foreground/80 bg-primary-foreground/10 px-2 py-1 rounded-full">
              Confirmados
            </span>
          </div>
          <p className="text-sm font-medium text-primary-foreground/80">Pagamentos Concluídos</p>
          <p className="text-2xl font-bold text-primary-foreground mt-1">
            {pagamentosPagosCount} {pagamentosPagosCount === 1 ? 'pagamento' : 'pagamentos'}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="movimentacao" className="w-full">
        <TabsList className="bg-muted p-1 mb-8">
          <TabsTrigger value="movimentacao" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">Movimentação</TabsTrigger>
          <TabsTrigger value="analise" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">Análise Gráfica</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacao" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-foreground">Histórico de Transações</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar transação..." 
                    className="pl-9 w-[220px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-md px-2 py-1">
                  <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                  <select
                    className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilterOption)}
                    aria-label="Filtrar por status"
                  >
                    <option value="todos" className="bg-background text-foreground">Todos os status</option>
                    <option value="pago" className="bg-background text-foreground">Pago</option>
                    <option value="pendente" className="bg-background text-foreground">Pendente</option>
                    <option value="cancelado" className="bg-background text-foreground">Cancelado</option>
                    <option value="reembolsado" className="bg-background text-foreground">Reembolsado</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted-foreground">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-3">Descrição</th>
                      <th scope="col" className="px-6 py-3">Data</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransacoes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          <DollarSign className="mx-auto h-12 w-12 opacity-10 mb-4" />
                          Nenhuma transação encontrada com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredTransacoes.map((transacao) => (
                        <tr key={transacao.id || Math.random()} className="border-b border-border bg-transparent hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{transacao.descricao}</p>
                                {transacao.id && (
                                  <p className="text-xs text-muted-foreground">ID: {transacao.id}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 text-muted-foreground/70" />
                              {new Date(transacao.data).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              transacao.status === 'pago' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 
                              transacao.status === 'pendente' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 
                              transacao.status === 'reembolsado' ? 'bg-muted text-muted-foreground border border-border' :
                              'bg-red-500/15 text-red-700 dark:text-red-300'
                            }`}>
                              {transacao.status.charAt(0).toUpperCase() + transacao.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transacao.valor)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Bar Chart */}
            <Card className="p-6 border border-border shadow-sm bg-card">
              <h3 className="text-lg font-bold text-foreground mb-6">Receitas por Mês (Últimos 6 meses)</h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                {!hasMonthlyData ? (
                  <div className="text-center text-muted-foreground">
                    <BarChart2 className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p className="text-sm font-medium">Nenhum pagamento registrado nos últimos 6 meses.</p>
                  </div>
                ) : (
                  isMounted && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickFormatter={(v: number) => `R$ ${v}`}
                        />
                        <Tooltip 
                          cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                          formatter={(value: number) => [
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                            'Receita'
                          ]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            borderColor: 'hsl(var(--border))', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            color: 'hsl(var(--foreground))'
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                        />
                        <Legend 
                          iconType="circle" 
                          wrapperStyle={{ paddingTop: '20px' }} 
                          formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>}
                        />
                        <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                )}
              </div>
            </Card>

            {/* Pie Chart */}
            <Card className="p-6 border border-border shadow-sm bg-card">
              <h3 className="text-lg font-bold text-foreground mb-6">Receitas por Forma de Pagamento</h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                {!hasPieData ? (
                  <div className="text-center text-muted-foreground">
                    <PieChartIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p className="text-sm font-medium">Nenhum pagamento concluído para exibir distribuição.</p>
                  </div>
                ) : (
                  isMounted && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                            'Total'
                          ]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            borderColor: 'hsl(var(--border))', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            color: 'hsl(var(--foreground))'
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
