'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarDays, DollarSign, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardMetrics {
  agendamentosHoje: number;
  agendamentosSemana: number;
  receitaMes: number;
  taxaCancelamento: number;
}

export default function AdminDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>({
    agendamentosHoje: 12,
    agendamentosSemana: 84,
    receitaMes: 12450.00,
    taxaCancelamento: 4.2,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([
    { name: 'Seg', receita: 1200, cancelamentos: 1 },
    { name: 'Ter', receita: 1500, cancelamentos: 0 },
    { name: 'Qua', receita: 900, cancelamentos: 2 },
    { name: 'Qui', receita: 1800, cancelamentos: 1 },
    { name: 'Sex', receita: 2200, cancelamentos: 0 },
    { name: 'Sab', receita: 2800, cancelamentos: 1 },
    { name: 'Dom', receita: 1100, cancelamentos: 0 },
  ]);
  const [agendamentos, setAgendamentos] = useState<any[]>([
    { horario: '14:30', cliente: 'Ricardo Mendonça', servico: 'Corte de Cabelo + Barba', valor: '85.00' },
    { horario: '15:45', cliente: 'Ana Lúcia', servico: 'Coloração Premium', valor: '220.00' },
    { horario: '17:00', cliente: 'Marcos Silva', servico: 'Hidratação Profunda', valor: '120.00' },
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>;
  }

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Sistema Operacional: Online</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl">Dashboard.</h1>
        <p className="text-foreground/50 mt-2 font-medium">Visão geral do desempenho do seu estabelecimento.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-2 border-none bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight">R$ {metrics?.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] font-bold opacity-60 mt-1">↑ 12% em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em]">Agendamentos Hoje</CardTitle>
            <CalendarDays className="h-4 w-4 text-foreground/20" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics?.agendamentosHoje}</div>
            <div className="mt-2 flex items-center gap-2">
               <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                 <div className="w-[65%] h-full bg-primary rounded-full"></div>
               </div>
               <span className="text-[10px] font-bold text-foreground/40">65%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em]">Clientes na Semana</CardTitle>
            <Users className="h-4 w-4 text-foreground/20" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics?.agendamentosSemana}</div>
            <p className="text-xs font-medium text-emerald-500 mt-1">Status: Estável</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em]">Taxa de Cancelamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground/20" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-rose-500">{metrics?.taxaCancelamento}%</div>
            <p className="text-xs font-medium text-foreground/40 mt-1">Meta: abaixo de 5%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 overflow-hidden">
          <CardHeader className="border-b border-border bg-secondary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Fluxo Financeiro Semanal</CardTitle>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-primary"></div>
                   <span className="text-[10px] font-bold text-foreground/40">Receita</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                   <span className="text-[10px] font-bold text-foreground/40">Cancelamentos</span>
                 </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--foreground))" 
                      opacity={0.3} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))" 
                      opacity={0.3} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `R$${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderRadius: '12px', 
                        border: '1px solid hsl(var(--border))', 
                        boxShadow: '0 20px 40px -20px rgba(0,0,0,0.2)',
                        fontSize: '12px'
                      }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={4} 
                      dot={false} 
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cancelamentos" 
                      stroke="#f43f5e" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 overflow-hidden">
          <CardHeader className="border-b border-border bg-secondary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Próximos Clientes</CardTitle>
              <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Ver Agenda</button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {agendamentos.length === 0 ? (
                <div className="text-center text-foreground/40 py-10 font-medium italic">Nenhum agendamento próximo.</div>
              ) : (
                agendamentos.map((agendamento, i) => (
                  <div key={i} className="group flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-background border border-border group-hover:border-primary/30 transition-colors">
                        <span className="text-[10px] font-black text-foreground/30 uppercase leading-none mb-1">Início</span>
                        <span className="text-sm font-bold text-foreground leading-none">{agendamento.horario}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">{agendamento.cliente}</p>
                        <p className="text-[11px] font-medium text-foreground/40 italic">{agendamento.servico}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-foreground">R$ {agendamento.valor}</p>
                       <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Confirmado</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-6 py-3 border border-dashed border-border rounded-xl text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] hover:bg-secondary/20 hover:text-foreground/50 transition-all">
              Sincronizar com Google Agenda
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
