'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, 
  Save,
  Building2,
  LogOut,
  Camera,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';
import { getUserIdFromToken } from '@/lib/apiHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { useComercioId } from '@/hooks/useComercioId';
import { useToast } from '@/contexts/ToastContext';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useNavigate } from 'react-router-dom';

type ConfigTab = 'perfil' | 'empresa';

interface ComercioConfig {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  cnpj: string;
  notificarAgendamento: boolean;
  lembrarAgendamento: boolean;
  resumoDiario: boolean;
  descricao: string;
  instagram: string;
  facebook: string;
  site: string;
  logoUrl?: string;
}

interface UserProfile {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
}

export default function AdminConfigPage() {
  const { token, logout, userType } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { comercioId, isLoading: isComercioIdLoading } = useComercioId();

  const isProfissional = userType === 'profissional';
  const [activeTab, setActiveTab] = useState<ConfigTab>(isProfissional ? 'perfil' : 'empresa');
  
  // Loading states
  const [isLoadingComercio, setIsLoadingComercio] = useState(false);
  const [comercioError, setComercioError] = useState<string | null>(null);
  const [isSavingComercio, setIsSavingComercio] = useState(false);

  const [isLoadingPerfil, setIsLoadingPerfil] = useState(false);
  const [perfilError, setPerfilError] = useState<string | null>(null);
  const [isSavingPerfil, setIsSavingPerfil] = useState(false);

  // Empresa State
  const [comercio, setComercio] = useState<ComercioConfig | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Perfil State
  const [perfil, setPerfil] = useState<UserProfile>({
    id: '',
    nome: '',
    sobrenome: '',
    email: '',
    cpf: '',
    telefone: '',
    dataNascimento: '',
  });

  const loadComercio = useCallback(async () => {
    if (!comercioId) return;
    setIsLoadingComercio(true);
    setComercioError(null);
    try {
      const data = await fetchApi(`/api/Comercios/${comercioId}`, { skipToast: true });
      if (data && typeof data === 'object') {
        const raw = data as Record<string, unknown>;
        const mapped: ComercioConfig = {
          id: Number(raw.id ?? raw.Id ?? comercioId),
          nome: String(raw.nome ?? raw.Nome ?? ''),
          endereco: String(raw.endereco ?? raw.Endereco ?? ''),
          telefone: String(raw.telefone ?? raw.Telefone ?? ''),
          email: String(raw.email ?? raw.Email ?? ''),
          cnpj: String(raw.cnpj ?? raw.CNPJ ?? ''),
          notificarAgendamento: Boolean(raw.notificarAgendamento ?? raw.NotificarAgendamento),
          lembrarAgendamento: Boolean(raw.lembrarAgendamento ?? raw.LembrarAgendamento),
          resumoDiario: Boolean(raw.resumoDiario ?? raw.ResumoDiario),
          descricao: String(raw.descricao ?? raw.Descricao ?? ''),
          instagram: String(raw.instagram ?? raw.Instagram ?? ''),
          facebook: String(raw.facebook ?? raw.Facebook ?? ''),
          site: String(raw.site ?? raw.Site ?? ''),
          logoUrl: raw.logoUrl || raw.LogoUrl ? String(raw.logoUrl ?? raw.LogoUrl) : undefined,
        };
        setComercio(mapped);
        if (mapped.logoUrl) {
          setPreviewImage(mapped.logoUrl);
        }
      } else {
        throw new Error('Comércio não encontrado.');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar comércio:', err);
      const msg = getFriendlyErrorMessage(err, 'Erro ao carregar dados da empresa.');
      setComercioError(msg);
      setComercio(null);
    } finally {
      setIsLoadingComercio(false);
    }
  }, [comercioId]);

  const loadPerfil = useCallback(async () => {
    if (!token) return;
    const userId = getUserIdFromToken(token);
    if (!userId) return;

    setIsLoadingPerfil(true);
    setPerfilError(null);
    try {
      const data = await fetchApi(`/api/Usuario/${userId}`, { skipToast: true });
      if (data && typeof data === 'object') {
        const raw = data as Record<string, unknown>;
        const rawDate = raw.dataNascimento ?? raw.DataNascimento;
        let dateStr = '';
        if (rawDate && typeof rawDate === 'string') {
          const sliced = rawDate.slice(0, 10);
          if (sliced !== '0001-01-01') {
            dateStr = sliced;
          }
        }

        setPerfil({
          id: String(raw.id ?? raw.Id ?? userId),
          nome: String(raw.nome ?? raw.Nome ?? ''),
          sobrenome: String(raw.sobrenome ?? raw.Sobrenome ?? ''),
          email: String(raw.email ?? raw.Email ?? ''),
          cpf: String(raw.cpf ?? raw.CPF ?? ''),
          telefone: String(raw.telefone ?? raw.Telefone ?? ''),
          dataNascimento: dateStr,
        });
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar perfil:', err);
      const msg = getFriendlyErrorMessage(err, 'Erro ao carregar perfil do usuário.');
      setPerfilError(msg);
    } finally {
      setIsLoadingPerfil(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'empresa' && !isProfissional && comercioId) {
      void loadComercio();
    } else if (activeTab === 'perfil' && token) {
      void loadPerfil();
    }
  }, [activeTab, isProfissional, comercioId, token, loadComercio, loadPerfil]);

  useEffect(() => {
    if (isProfissional && activeTab === 'empresa') {
      setActiveTab('perfil');
    }
  }, [isProfissional, activeTab]);

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

    setIsSavingComercio(true);
    try {
      const formData = new FormData();
      formData.append('Id', String(comercio.id));
      formData.append('Nome', comercio.nome.trim());
      formData.append('Endereco', (comercio.endereco || '').trim());
      formData.append('Telefone', (comercio.telefone || '').replace(/\D/g, ''));
      formData.append('CNPJ', (comercio.cnpj || '').replace(/\D/g, ''));
      formData.append('Email', (comercio.email || '').trim());
      formData.append('Descricao', (comercio.descricao || '').trim());
      formData.append('Instagram', (comercio.instagram || '').trim());
      formData.append('Facebook', (comercio.facebook || '').trim());
      formData.append('Site', (comercio.site || '').trim());
      formData.append('NotificarAgendamento', comercio.notificarAgendamento ? 'true' : 'false');
      formData.append('LembrarAgendamento', comercio.lembrarAgendamento ? 'true' : 'false');
      formData.append('ResumoDiario', comercio.resumoDiario ? 'true' : 'false');
      
      if (selectedFile) {
        formData.append('Image', selectedFile);
      }

      await fetchApi(`/api/Comercios/${comercio.id}`, {
        method: 'PUT',
        skipToast: true,
        body: formData,
      });

      toast.success('Configurações da empresa atualizadas com sucesso!');
      await loadComercio();
    } catch (err: unknown) {
      console.error('Erro ao atualizar comércio:', err);
      toast.error(getFriendlyErrorMessage(err, 'Não foi possível salvar as alterações.'));
    } finally {
      setIsSavingComercio(false);
    }
  };

  const handleUpdatePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil.id) return;

    const nomeClean = perfil.nome.trim();
    const sobrenomeClean = perfil.sobrenome.trim();
    const cpfDigits = perfil.cpf.replace(/\D/g, '');
    const telefoneDigits = perfil.telefone.replace(/\D/g, '');
    const emailClean = perfil.email.trim();
    const dataNascimentoClean = perfil.dataNascimento.trim();

    if (nomeClean.length < 3 || nomeClean.length > 18) {
      toast.error('O nome deve ter entre 3 e 18 caracteres.');
      return;
    }

    if (cpfDigits.length < 11 || cpfDigits.length > 14) {
      toast.error('O CPF deve ter entre 11 e 14 dígitos.');
      return;
    }

    if (telefoneDigits.length < 10 || telefoneDigits.length > 15) {
      toast.error('O telefone deve ter entre 10 e 15 dígitos.');
      return;
    }

    if (!emailClean) {
      toast.error('O e-mail é obrigatório.');
      return;
    }

    if (!dataNascimentoClean) {
      toast.error('A data de nascimento é obrigatória.');
      return;
    }

    const dateObj = new Date(dataNascimentoClean);
    if (isNaN(dateObj.getTime())) {
      toast.error('Informe uma data de nascimento válida.');
      return;
    }

    setIsSavingPerfil(true);
    try {
      await fetchApi(`/api/Usuario/${perfil.id}`, {
        method: 'PUT',
        skipToast: true,
        body: {
          id: perfil.id,
          nome: nomeClean,
          sobrenome: sobrenomeClean || null,
          cpf: cpfDigits,
          telefone: telefoneDigits,
          email: emailClean,
          dataNascimento: `${dataNascimentoClean.slice(0, 10)}T00:00:00`,
        },
      });

      toast.success('Perfil atualizado com sucesso!');
      await loadPerfil();
    } catch (err: unknown) {
      console.error('Erro ao atualizar perfil:', err);
      toast.error(getFriendlyErrorMessage(err, 'Não foi possível salvar o perfil.'));
    } finally {
      setIsSavingPerfil(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login-selection');
  };

  const navItems = [
    ...(!isProfissional ? [{ id: 'empresa' as const, label: 'Dados da Empresa', icon: Building2 }] : []),
    { id: 'perfil' as const, label: 'Meu Perfil', icon: User },
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
              onClick={() => setActiveTab(item.id)}
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
              <div className="p-8">
                {/* TAB EMPRESA */}
                {activeTab === 'empresa' && !isProfissional && (
                  <div>
                    {isComercioIdLoading || isLoadingComercio ? (
                      <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <p className="text-slate-500 text-sm animate-pulse">Carregando dados da empresa...</p>
                      </div>
                    ) : comercioError ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                            <div>
                              <p className="text-sm font-bold">Falha ao carregar dados da empresa</p>
                              <p className="text-xs text-rose-700">{comercioError}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-rose-300 text-rose-700 hover:bg-rose-100"
                            onClick={() => void loadComercio()}
                          >
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            Tentar novamente
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          O formulário de edição foi bloqueado para prevenir a sobrescrita acidental de dados com valores em branco.
                        </p>
                      </div>
                    ) : comercio ? (
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
                              className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-indigo-600 hover:bg-slate-50 transition-all active:scale-95"
                              title="Alterar logo"
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
                              onChange={(e) => setComercio({ ...comercio, nome: e.target.value })} 
                              placeholder="Nome comercial"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Telefone de Contato</label>
                            <Input 
                              value={comercio.telefone} 
                              onChange={(e) => setComercio({ ...comercio, telefone: e.target.value })} 
                              placeholder="(00) 00000-0000"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">CNPJ</label>
                            <Input 
                              value={comercio.cnpj} 
                              onChange={(e) => setComercio({ ...comercio, cnpj: e.target.value })} 
                              placeholder="00.000.000/0000-00"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">E-mail Comercial</label>
                            <Input 
                              type="email"
                              value={comercio.email} 
                              onChange={(e) => setComercio({ ...comercio, email: e.target.value })} 
                              placeholder="contato@empresa.com"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Endereço Completo</label>
                            <Input 
                              value={comercio.endereco} 
                              onChange={(e) => setComercio({ ...comercio, endereco: e.target.value })} 
                              placeholder="Rua, número, bairro, cidade"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Descrição do Negócio</label>
                            <textarea 
                              rows={3}
                              className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Fale um pouco sobre os serviços oferecidos"
                              value={comercio.descricao}
                              onChange={(e) => setComercio({ ...comercio, descricao: e.target.value })}
                            />
                          </div>

                          {/* Social Media */}
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Instagram</label>
                            <Input 
                              value={comercio.instagram} 
                              onChange={(e) => setComercio({ ...comercio, instagram: e.target.value })} 
                              placeholder="@seu_perfil" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Site</label>
                            <Input 
                              value={comercio.site} 
                              onChange={(e) => setComercio({ ...comercio, site: e.target.value })} 
                              placeholder="www.seu-site.com" 
                            />
                          </div>
                        </div>

                        {/* Automações Settings (Company Level) */}
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
                                  onChange={(e) => setComercio({ ...comercio, notificarAgendamento: e.target.checked })}
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
                                  onChange={(e) => setComercio({ ...comercio, lembrarAgendamento: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <p className="text-sm font-bold text-slate-900">Resumo Diário</p>
                                <p className="text-xs text-slate-500">Receba um resumo diário com os atendimentos programados.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={comercio.resumoDiario}
                                  onChange={(e) => setComercio({ ...comercio, resumoDiario: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6">
                          <Button 
                            type="submit" 
                            disabled={isSavingComercio}
                            className="bg-slate-900 hover:bg-black text-white px-10 h-11 shadow-lg shadow-slate-200 transition-all active:scale-95"
                          >
                            {isSavingComercio ? (
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
                    ) : null}
                  </div>
                )}

                {/* TAB PERFIL */}
                {activeTab === 'perfil' && (
                  <div>
                    {isLoadingPerfil ? (
                      <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <p className="text-slate-500 text-sm animate-pulse">Carregando dados do perfil...</p>
                      </div>
                    ) : perfilError ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                            <p className="text-sm font-medium">{perfilError}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-rose-300 text-rose-700 hover:bg-rose-100"
                            onClick={() => void loadPerfil()}
                          >
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            Tentar novamente
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdatePerfil} className="space-y-6">
                        <div className="border-b pb-4 mb-6">
                          <h2 className="text-xl font-bold text-slate-900">Informações Pessoais</h2>
                          <p className="text-sm text-slate-500">Dados do seu cadastro de usuário.</p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Nome</label>
                            <Input 
                              value={perfil.nome} 
                              onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} 
                              minLength={3}
                              maxLength={18}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Sobrenome</label>
                            <Input 
                              value={perfil.sobrenome} 
                              onChange={(e) => setPerfil({ ...perfil, sobrenome: e.target.value })} 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">E-mail</label>
                            <Input value={perfil.email} readOnly className="bg-slate-50 cursor-not-allowed" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Telefone</label>
                            <Input 
                              value={perfil.telefone} 
                              onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })} 
                              placeholder="(00) 00000-0000"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">CPF</label>
                            <Input 
                              value={perfil.cpf} 
                              onChange={(e) => setPerfil({ ...perfil, cpf: e.target.value })} 
                              placeholder="000.000.000-00"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Data de Nascimento</label>
                            <Input 
                              type="date"
                              value={perfil.dataNascimento} 
                              onChange={(e) => setPerfil({ ...perfil, dataNascimento: e.target.value })} 
                              required
                            />
                          </div>
                        </div>
                        <div className="pt-4">
                          <Button 
                            type="submit" 
                            disabled={isSavingPerfil}
                            className="bg-slate-900 hover:bg-black text-white px-8"
                          >
                            {isSavingPerfil ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              'Salvar Alterações'
                            )}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
