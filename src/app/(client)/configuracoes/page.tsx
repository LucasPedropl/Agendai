import React, { useState } from 'react';
import { Settings, Shield, Globe } from 'lucide-react';

export default function ClientConfiguracoesPage() {
  const [settings, setSettings] = useState({
    idioma: 'Português (Brasil)',
    fusoHorario: 'Horário de Brasília',
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, [e.target.id]: e.target.value });
  };

  const handleSave = () => {
    console.log('Saved settings', settings);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Configurações da Conta
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie as preferências da sua conta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Segurança</h2>
          </div>
          <div className="p-6 space-y-4">
            <button className="w-full text-left px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Alterar Senha
            </button>
            <button className="w-full text-left px-4 py-2 border border-red-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              Excluir Conta
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Idioma e Região</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="idioma" className="block text-sm font-medium text-slate-700">
                Idioma
              </label>
              <select
                id="idioma"
                value={settings.idioma}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>Português (Brasil)</option>
                <option>English (US)</option>
                <option>Español</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="fusoHorario" className="block text-sm font-medium text-slate-700">
                Fuso Horário
              </label>
              <select
                id="fusoHorario"
                value={settings.fusoHorario}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>Horário de Brasília</option>
                <option>Pacific Time (US)</option>
                <option>Central European Time</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
