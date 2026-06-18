import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Globe, 
  Bell, 
  User, 
  Lock, 
  Trash2, 
  Save, 
  Loader2, 
  Check,
  Smartphone,
  Mail,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { IS_CONFIG_USUARIO_PUT_BLOCKED } from '@/lib/apiHelpers';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

export default function ClientConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('perfil');
  const { user } = useAuth();
  const { getPerfil, updatePerfil, getConfig, updateConfig, isLoading } = useClientProfile();
  const [perfilData, setPerfilData] = useState<any>(null);
  const [configData, setConfigData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const p = await getPerfil(user!.id);
    const c = await getConfig(user!.id);
    if (p) setPerfilData(p);
    if (c) setConfigData(c);
  };

  const handleSavePerfil = async () => {
    if (!perfilData || !user?.id) return;
    setIsSaving(true);
    const success = await updatePerfil(user.id, perfilData);
    if (success) {
      toast.success('Perfil atualizado com sucesso!');
    }
    setIsSaving(false);
  };

  const handleSaveConfig = async (newConfig?: Record<string, unknown>) => {
    if (IS_CONFIG_USUARIO_PUT_BLOCKED) {
      toast.warning('Salvar preferências de notificação está temporariamente indisponível. A equipe de backend está corrigindo a API.');
      return;
    }
    const dataToSave = newConfig || configData;
    if (!dataToSave || !user?.id) return;
    setIsSaving(true);
    const success = await updateConfig(user.id, dataToSave);
    if (success && !newConfig) {
      toast.success('Configurações atualizadas!');
    } else if (!success) {
      toast.error('Não foi possível salvar as preferências de notificação.');
    }
    setIsSaving(false);
  };

  if (isLoading && !perfilData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Configurações da Conta
          </h1>
          <p className="text-slate-500 mt-1">Gerencie suas informações pessoais, notificações e segurança.</p>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 text-primary font-bold text-sm bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando alterações...
          </div>
        )}
      </div>

      {/* Tabs Layout style from Admin */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200">
        {[
          { id: 'perfil', label: 'Meu Perfil', icon: User },
          { id: 'notificacoes', label: 'Notificações', icon: Bell },
          { id: 'seguranca', label: 'Segurança', icon: Shield }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all
              ${activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }
            `}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'perfil' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-0 border-slate-200 shadow-sm overflow-hidden rounded-[2rem]">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </h3>
                <p className="text-sm text-slate-500 mt-1">Como você aparece para os estabelecimentos e profissionais.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nome</label>
                    <input 
                      type="text" 
                      value={perfilData?.nome || ''}
                      onChange={(e) => setPerfilData({...perfilData, nome: e.target.value})}
                      className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Sobrenome</label>
                    <input 
                      type="text" 
                      value={perfilData?.sobrenome || ''}
                      onChange={(e) => setPerfilData({...perfilData, sobrenome: e.target.value})}
                      className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">E-mail</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={perfilData?.email || ''}
                        disabled
                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm text-slate-500 outline-none"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Telefone / WhatsApp</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={perfilData?.telefone || ''}
                        onChange={(e) => setPerfilData({...perfilData, telefone: e.target.value})}
                        className="w-full h-12 rounded-xl border border-slate-200 px-4 pl-11 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Data de Nascimento</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={perfilData?.dataNascimento?.substring(0, 10) || ''}
                        onChange={(e) => setPerfilData({...perfilData, dataNascimento: e.target.value})}
                        className="w-full h-12 rounded-xl border border-slate-200 px-4 pl-11 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <Button 
                    onClick={handleSavePerfil} 
                    disabled={isSaving}
                    className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'notificacoes' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
             <Card className="p-0 border-slate-200 shadow-sm overflow-hidden rounded-[2rem]">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Preferências de Notificação
                </h3>
                <p className="text-sm text-slate-500 mt-1">Escolha como você deseja ser avisado sobre seus agendamentos.</p>
              </div>
              
              <div className="p-8 space-y-8">
                {IS_CONFIG_USUARIO_PUT_BLOCKED && (
                  <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                    <p>
                      As preferências abaixo podem ser visualizadas, mas <strong>ainda não podem ser salvas</strong> —
                      a API retorna erro ao gravar configurações com ID de usuário (GUID). Correção pendente no backend.
                    </p>
                  </div>
                )}
                {[
                  { 
                    id: 'notificaAgendamento', 
                    title: 'Novos Agendamentos', 
                    desc: 'Receba confirmações imediatas quando realizar um novo agendamento.' 
                  },
                  { 
                    id: 'notificaPromo', 
                    title: 'Promoções e Novidades', 
                    desc: 'Fique por dentro de descontos e novos serviços dos seus locais favoritos.' 
                  },
                  { 
                    id: 'notificaDiaAgendado', 
                    title: 'Lembrete do Dia', 
                    desc: 'Enviaremos um lembrete automático algumas horas antes do seu horário.' 
                  }
                ].map((item, idx) => (
                  <div key={item.id} className={`flex items-center justify-between gap-6 ${idx !== 0 ? 'pt-6 border-t border-slate-100' : ''}`}>
                    <div className="flex-1">
                      <span className="text-base font-bold text-slate-900 block">{item.title}</span>
                      <span className="text-sm text-slate-500 mt-1 block">{item.desc}</span>
                    </div>
                    <label className={`relative inline-flex items-center ${IS_CONFIG_USUARIO_PUT_BLOCKED ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <input 
                        type="checkbox" 
                        checked={configData?.[item.id] || false}
                        disabled={IS_CONFIG_USUARIO_PUT_BLOCKED}
                        onChange={(e) => {
                          if (IS_CONFIG_USUARIO_PUT_BLOCKED) return;
                          const newConfig = { ...configData, [item.id]: e.target.checked };
                          setConfigData(newConfig);
                          handleSaveConfig(newConfig);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'seguranca' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-0 border-slate-200 shadow-sm overflow-hidden rounded-[2rem]">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Senha e Segurança
                </h3>
                <p className="text-sm text-slate-500 mt-1">Mantenha sua conta protegida com uma senha forte.</p>
              </div>
              <div className="p-8">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">Alterar Senha de Acesso</p>
                      <p className="text-sm text-slate-500">Recomendamos trocar sua senha periodicamente.</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl font-bold h-11 px-6 hover:bg-white transition-all">
                      Trocar Senha
                    </Button>
                 </div>
              </div>
            </Card>

            <Card className="p-0 border-red-100 shadow-sm overflow-hidden rounded-[2rem] bg-red-50/10">
              <div className="p-8 border-b border-red-50 bg-red-50/30">
                <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Zona de Perigo
                </h3>
              </div>
              <div className="p-8">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-red-900">Excluir Minha Conta Permanentemente</p>
                      <p className="text-sm text-red-700/60 max-w-md">
                        Esta ação não pode ser desfeita. Todos os seus dados de agendamentos e histórico serão perdidos.
                      </p>
                    </div>
                    <Button variant="destructive" className="rounded-2xl font-bold h-11 px-8 shadow-lg shadow-red-200">
                      Excluir Conta
                    </Button>
                 </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
