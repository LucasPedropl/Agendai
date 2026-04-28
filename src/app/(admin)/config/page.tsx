'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Save,
  Shield,
  Building2,
  LogOut,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

type ConfigTab = 'perfil' | 'empresa' | 'notificacoes' | 'seguranca';

export default function AdminConfigPage() {
  const { token, logout, user, userType } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isProfissional = userType === 'profissional';
  const [activeTab, setActiveTab] = useState<ConfigTab>(isProfissional ? 'perfil' : 'empresa');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Empresa State
  const [comercio, setComercio] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Perfil State (Mock)
  const [perfil, setPerfil] = useState({
    nome: (user as any)?.nome || 'Administrador',
    email: (user as any)?.email || 'admin@agendaai.com',
    telefone: '(27) 99999-9999'
  });

  useEffect(() => {
    if (activeTab === 'empresa' && token) {
      loadComercio();
    } else {
      setIsLoading(false);
    }
  }, [activeTab, token]);

  const loadComercio = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi('/api/Comercios', {
        headers: { 'Authorization': `Bearer ${token}` },
        skipToast: true
      } as any);
      
      if (Array.isArray(data) && data.length > 0) {
        setComercio(data[0]);
        if (data[0].logoUrl) {
          setPreviewImage(data[0].logoUrl);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar comércio:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateComercio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercio) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('Id', String(comercio.id));
      formData.append('Nome', comercio.nome);
      formData.append('Endereco', comercio.endereco || '');
      formData.append('Telefone', (comercio.telefone || '').replace(/\D/g, ''));
      formData.append('CNPJ', (comercio.cnpj || '').replace(/\D/g, ''));
      formData.append('Email', comercio.email || '');
      formData.append('Descricao', comercio.descricao || '');
      formData.append('Instagram', comercio.instagram || '');
      formData.append('Facebook', comercio.facebook || '');
      formData.append('Site', comercio.site || '');
      formData.append('NotificarAgendamento', String(comercio.notificarAgendamento));
      formData.append('LembrarAgendamento', String(comercio.lembrarAgendamento));
      formData.append('ResumoDiario', String(comercio.resumoDiario));
      
      if (selectedFile) {
        formData.append('Image', selectedFile);
      } else {
        // Enviar vazio ou campo nulo conforme API espera para manter imagem atual
        formData.append('Image', ''); 
      }

      await fetchApi(`/api/Comercios/${comercio.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      } as any);

      toast.success('Configurações da empresa atualizadas com sucesso!');
      loadComercio();
    } catch (err: any) {
      console.error("Erro ao atualizar comércio:", err);
      toast.error('Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login-selection');
  };

  const navItems = [
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    ...(!isProfissional ? [{ id: 'empresa', label: 'Dados da Empresa', icon: Building2 }] : []),
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm">Gerencie os detalhes da sua empresa e preferências do sistema.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ConfigTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="text-slate-500 text-sm animate-pulse">Carregando configurações...</p>
                </div>
              ) : (
                <div className="p-8">
                  {activeTab === 'perfil' && (
                    <div className="space-y-6">
                      <div className="border-b pb-4 mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Informações Pessoais</h2>
                        <p className="text-sm text-slate-500">Dados do administrador da conta.</p>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Nome</label>
                          <Input value={perfil.nome} onChange={(e) => setPerfil({...perfil, nome: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">E-mail</label>
                          <Input value={perfil.email} readOnly className="bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Telefone</label>
                          <Input value={perfil.telefone} onChange={(e) => setPerfil({...perfil, telefone: e.target.value})} />
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button className="bg-slate-900 hover:bg-black text-white px-8">Salvar Alterações</Button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'empresa' && comercio && (
                    <form onSubmit={handleUpdateComercio} className="space-y-8">
                      <div className="border-b pb-4">
                        <h2 className="text-xl font-bold text-slate-900">Informações da Empresa</h2>
                        <p className="text-sm text-slate-500">Dados visíveis para seus clientes nas faturas e agendamentos.</p>
                      </div>

                      {/* Logo Section */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative group">
                          <div className="h-24 w-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                            {previewImage ? (
                              <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-10 w-10 text-slate-300" />
                            )}
                          </div>
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-indigo-600 hover:bg-slate-50 transition-all transition-transform active:scale-95"
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-semibold text-slate-900">Logo da Empresa</h4>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-4 border-slate-200 text-slate-700 font-medium"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                {selectedFile ? 'Alterar arquivo' : 'Escolher arquivo'}
                              </Button>
                              <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                {selectedFile ? selectedFile.name : 'Nenhum arquivo escolhido'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">JPG, GIF ou PNG. Max 1MB.</p>
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>

                      {/* Basic Info Fields */}
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-semibold text-slate-700">Nome da Empresa</label>
                          <Input 
                            value={comercio.nome} 
                            onChange={(e) => setComercio({...comercio, nome: e.target.value})} 
                            placeholder="Nome comercial"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Telefone de Contato</label>
                          <Input 
                            value={comercio.telefone} 
                            onChange={(e) => setComercio({...comercio, telefone: e.target.value})} 
                            placeholder="(00) 00000-0000"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">CNPJ</label>
                          <Input 
                            value={comercio.cnpj || ''} 
                            onChange={(e) => setComercio({...comercio, cnpj: e.target.value})} 
                            placeholder="00.000.000/0000-00"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-semibold text-slate-700">E-mail Comercial</label>
                          <Input 
                            type="email"
                            value={comercio.email || ''} 
                            onChange={(e) => setComercio({...comercio, email: e.target.value})} 
                            placeholder="contato@empresa.com"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-semibold text-slate-700">Endereço Completo</label>
                          <Input 
                            value={comercio.endereco || ''} 
                            onChange={(e) => setComercio({...comercio, endereco: e.target.value})} 
                            placeholder="Rua, número, bairro, cidade"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-semibold text-slate-700">Descrição do Negócio</label>
                          <textarea 
                            rows={3}
                            className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Fale um pouco sobre os serviços oferecidos"
                            value={comercio.descricao || ''}
                            onChange={(e) => setComercio({...comercio, descricao: e.target.value})}
                          />
                        </div>

                        {/* Social Media */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Instagram</label>
                          <Input value={comercio.instagram || ''} onChange={(e) => setComercio({...comercio, instagram: e.target.value})} placeholder="@seu_perfil" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Site</label>
                          <Input value={comercio.site || ''} onChange={(e) => setComercio({...comercio, site: e.target.value})} placeholder="www.seu-site.com" />
                        </div>
                      </div>

                      {/* Notificações Settings (Company Level) */}
                      <div className="pt-4 space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Automações e Preferências</p>
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                              <p className="text-sm font-bold text-slate-900">Notificar Novos Agendamentos</p>
                              <p className="text-xs text-slate-500">Receba alertas cada vez que um cliente marcar horário.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={comercio.notificarAgendamento}
                                onChange={(e) => setComercio({...comercio, notificarAgendamento: e.target.checked})}
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                              <p className="text-sm font-bold text-slate-900">Lembrete para Clientes</p>
                              <p className="text-xs text-slate-500">Enviar lembretes automáticos para evitar faltas.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={comercio.lembrarAgendamento}
                                onChange={(e) => setComercio({...comercio, lembrarAgendamento: e.target.checked})}
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="bg-slate-900 hover:bg-black text-white px-10 h-11 shadow-lg shadow-slate-200 transition-all active:scale-95"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar Alterações
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}

                  {activeTab === 'notificacoes' && (
                    <div className="space-y-6">
                       <div className="border-b pb-4 mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Configurações de Notificação</h2>
                        <p className="text-sm text-slate-500">Gerencie como e quando você quer ser avisado.</p>
                      </div>
                      <div className="space-y-4">
                        {['Alertas de Agendamento', 'Resumo Diário', 'Notificações de Faturas', 'Novos Clientes'].map((pref, i) => (
                          <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
                            <span className="text-sm font-medium text-slate-700">{pref}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'seguranca' && (
                    <div className="space-y-6">
                       <div className="border-b pb-4 mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Segurança da Conta</h2>
                        <p className="text-sm text-slate-500">Mantenha sua conta protegida.</p>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Senha Atual</label>
                          <Input type="password" placeholder="••••••••" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Nova Senha</label>
                            <Input type="password" placeholder="Mínimo 6 caracteres" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Confirmar Senha</label>
                            <Input type="password" placeholder="Repita a nova senha" />
                          </div>
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button className="bg-slate-900 hover:bg-black text-white px-8">Atualizar Senha</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

