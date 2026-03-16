import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminHistoryPage() {
  const [activeTab, setActiveTab] = useState('todos');

  const stats = [
    { label: 'Concluídos', value: '0', icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { label: 'Cancelados', value: '0', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
    { label: 'Total Faturado', value: 'R$ 0,00', icon: Calendar, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Histórico de Agendamentos</h1>
        <p className="text-slate-500">Visualize todos os agendamentos concluídos e cancelados</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 flex items-center justify-between border-none shadow-sm bg-white">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters and Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex p-1 bg-gray-100 rounded-lg">
          {['todos', 'concluidos', 'cancelados'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} (0)
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar agendamento..." 
              className="h-10 w-full sm:w-64 rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      <Card className="flex flex-col items-center justify-center py-20 border-dashed border-2 bg-transparent">
        <div className="mb-4 p-4 rounded-full bg-slate-50 text-slate-400">
          <Calendar className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Nenhum agendamento encontrado no histórico</h3>
        <p className="text-slate-500 mt-1">Os agendamentos concluídos ou cancelados aparecerão aqui.</p>
      </Card>
    </div>
  );
}
