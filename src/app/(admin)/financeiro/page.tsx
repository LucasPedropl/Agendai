'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Download,
  FileText,
  Users,
  PieChart as PieChartIcon,
  BarChart2,
  ChevronRight,
  Search
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Transacao } from '@/types';

const COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b'];

export default function AdminFinanceiroPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for charts
  const chartData = [
    { name: 'Jan', receita: 4000, despesa: 2400 },
    { name: 'Fev', receita: 3000, despesa: 1398 },
    { name: 'Mar', receita: 2000, despesa: 9800 },
    { name: 'Abr', receita: 2780, despesa: 3908 },
    { name: 'Mai', receita: 1890, despesa: 4800 },
    { name: 'Jun', receita: 2390, despesa: 3800 },
  ];

  const pieData = [
    { name: 'Serviços', value: 400 },
    { name: 'Produtos', value: 300 },
    { name: 'Aluguel', value: 300 },
    { name: 'Salários', value: 200 },
  ];

  const reports = [
    { title: 'Relatório de Vendas', desc: 'Resumo detalhado de todas as vendas e serviços', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Desempenho de Profissionais', desc: 'Métricas de produtividade e comissões', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { title: 'Fluxo de Caixa', desc: 'Entradas e saídas detalhadas por período', icon: PieChartIcon, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { title: 'Fidelidade de Clientes', desc: 'Análise de recorrência e novos clientes', icon: BarChart2, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { title: 'Agendamentos por Período', desc: 'Horários de maior pico e cancelamentos', icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalEntradas = transacoes.filter(t => t.valor > 0 && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.valor < 0 && t.status === 'pago').reduce((acc, t) => acc + Math.abs(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão Financeira</h1>
          <p className="text-slate-500">Controle completo de receitas, despesas e análise de saúde do negócio.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <Plus className="mr-2 h-4 w-4" /> Despesa
          </Button>
          <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Receita
          </Button>
        </div>
      </div>

      {/* Stats Summary Card Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Entradas (Mês)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -5%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Saídas (Mês)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 text-white rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-indigo-100">Saldo Líquido</p>
          <p className="text-2xl font-bold mt-1">
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="movimentacao" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-8">
          <TabsTrigger value="movimentacao" className="data-[state=active]:bg-white">Movimentação</TabsTrigger>
          <TabsTrigger value="analise" className="data-[state=active]:bg-white">Análise (Receita vs Despesa)</TabsTrigger>
          <TabsTrigger value="relatorios" className="data-[state=active]:bg-white">Relatórios Exportáveis</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacao" className="space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Transações</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar transação..." 
                    className="pl-9 w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                    <tr>
                      <th scope="col" className="px-6 py-3">Descrição</th>
                      <th scope="col" className="px-6 py-3">Data</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          <DollarSign className="mx-auto h-12 w-12 opacity-10 mb-4" />
                          Nenhuma transação registrada no período.
                        </td>
                      </tr>
                    ) : (
                      transacoes.map((transacao) => (
                        <tr key={transacao.id} className="border-b bg-white hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${transacao.valor > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {transacao.valor > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                              </div>
                              {transacao.descricao}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {new Date(transacao.data).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              transacao.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 
                              transacao.status === 'pendente' ? 'bg-amber-100 text-amber-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {transacao.status.charAt(0).toUpperCase() + transacao.status.slice(1)}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${transacao.valor > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {transacao.valor > 0 ? '+' : ''} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(transacao.valor))}
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
            <Card className="p-6 border-none shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Comparativo Mensal</h3>
              <div className="h-[300px] w-full">
                {isMounted && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="receita" name="Receita" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="p-6 border-none shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição de Gastos</h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                {isMounted && (
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
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Tendência de Lucratividade</h3>
            <div className="h-[300px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report, idx) => (
              <Card key={idx} className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${report.bgColor} ${report.color}`}>
                    <report.icon className="h-6 w-6" />
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-indigo-600">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-6">
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{report.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{report.desc}</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                  Gerar Relatório
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-8 border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Precisa de um relatório personalizado?</h3>
              <p className="text-slate-400 max-w-md mb-6">Entre em contato com nosso suporte para solicitar métricas específicas para o seu negócio.</p>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold">Falar com Suporte</Button>
            </div>
            <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
            <FileText className="absolute -bottom-8 -right-8 h-48 w-48 text-white/5 rotate-12 pointer-events-none" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
