import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export default function AdminReceitasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('todas');

  const [stats, setStats] = useState([
    { label: 'Total a Receber', value: 'R$ 0,00', icon: DollarSign, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { label: 'Total Vencido', value: 'R$ 0,00', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
    { label: 'Recebido Este Mês', value: 'R$ 0,00', icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contas a Receber</h1>
          <p className="text-slate-500">Gerencie seus recebimentos e receitas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
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

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
        {['todas', 'pendentes', 'vencidas', 'recebidas'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <Card className="flex flex-col items-center justify-center py-20 border-none shadow-sm bg-white">
        <div className="mb-6 p-6 rounded-full bg-slate-50 text-slate-400">
          <TrendingUp className="h-16 w-16" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Nenhuma conta cadastrada</h3>
        <Button onClick={() => setIsModalOpen(true)} className="mt-6 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Primeira Conta
        </Button>
      </Card>

      {/* New Account Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nova Conta a Receber"
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Descrição*</label>
            <input 
              type="text" 
              placeholder="Ex: Venda de Shampoo"
              className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Valor (R$)*</label>
              <input 
                type="text" 
                placeholder="0,00"
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Vencimento*</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Categoria*</label>
            <select className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white">
              <option value="servico">Serviço</option>
              <option value="venda">Venda de Produto</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Observações</label>
            <textarea 
              placeholder="Adicione observações..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-12 rounded-xl"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              Criar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
