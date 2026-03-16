import React from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Save,
  Shield
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminConfigPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações da Conta</h1>
          <p className="text-slate-500">Gerencie seus dados pessoais, segurança e preferências do sistema</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-8">
        {/* Dados Pessoais */}
        <Card className="p-8 border-none shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dados Pessoais</h3>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
              <input 
                type="text" 
                defaultValue="Administrador"
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">E-mail</label>
              <input 
                type="email" 
                defaultValue="admin@agendaai.com"
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-gray-50"
                readOnly
              />
              <p className="text-xs text-slate-500 mt-1">O e-mail não pode ser alterado diretamente.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Telefone</label>
              <input 
                type="text" 
                placeholder="(00) 00000-0000"
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
          </div>
        </Card>

        {/* Segurança */}
        <Card className="p-8 border-none shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Segurança e Senha</h3>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Senha Atual</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full sm:w-1/2 h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Nova Senha</label>
              <input 
                type="password" 
                placeholder="Nova senha"
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Confirmar Nova Senha</label>
              <input 
                type="password" 
                placeholder="Confirme a nova senha"
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <Lock className="h-4 w-4 mr-2" />
              Atualizar Senha
            </Button>
          </div>
        </Card>

        {/* Preferências */}
        <Card className="p-8 border-none shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Palette className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Preferências do Sistema</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-slate-900">Tema Escuro (Dark Mode)</p>
                <p className="text-sm text-slate-500">Ative o tema escuro para o painel administrativo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Bell className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Notificações por E-mail</p>
                  <p className="text-sm text-slate-500">Receba resumos diários e alertas importantes</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
