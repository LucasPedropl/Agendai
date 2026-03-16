import React from 'react';
import { 
  FileText, 
  Download, 
  PieChart, 
  BarChart2, 
  Users, 
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminReportsPage() {
  const reports = [
    { title: 'Relatório de Vendas', desc: 'Resumo detalhado de todas as vendas e serviços', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Desempenho de Profissionais', desc: 'Métricas de produtividade e comissões', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { title: 'Fluxo de Caixa', desc: 'Entradas e saídas detalhadas por período', icon: PieChart, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { title: 'Fidelidade de Clientes', desc: 'Análise de recorrência e novos clientes', icon: BarChart2, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { title: 'Agendamentos por Período', desc: 'Horários de maior pico e cancelamentos', icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Relatórios e Análises</h1>
        <p className="text-slate-500">Gere relatórios detalhados para tomar melhores decisões</p>
      </div>

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
          <Button className="bg-white text-slate-900 hover:bg-slate-100">Falar com Suporte</Button>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
        <FileText className="absolute -bottom-8 -right-8 h-48 w-48 text-white/5 rotate-12 pointer-events-none" />
      </Card>
    </div>
  );
}
