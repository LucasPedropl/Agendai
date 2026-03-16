import { useState } from 'react';
import { Bell } from 'lucide-react';

export default function ClientNotificacoesPage() {
  const [preferences, setPreferences] = useState({
    lembretes: true,
    promocoes: false,
    atualizacoes: true,
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    console.log('Saved preferences', preferences);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-600" />
          Notificações
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie suas preferências de alerta.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Preferências de Notificação</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Lembretes de Agendamento</p>
              <p className="text-sm text-slate-500">Receba alertas sobre seus próximos serviços.</p>
            </div>
            <button
              onClick={() => handleToggle('lembretes')}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                preferences.lembretes ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.lembretes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Promoções e Ofertas</p>
              <p className="text-sm text-slate-500">Fique por dentro das novidades e descontos.</p>
            </div>
            <button
              onClick={() => handleToggle('promocoes')}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                preferences.promocoes ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.promocoes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Atualizações do Sistema</p>
              <p className="text-sm text-slate-500">Avisos importantes sobre a plataforma.</p>
            </div>
            <button
              onClick={() => handleToggle('atualizacoes')}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                preferences.atualizacoes ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.atualizacoes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
