import React, { useState, useEffect } from 'react';
import { 
  Store, Save, MapPin, Phone, Mail, Clock, Globe, Instagram, Facebook, Camera,
  Info, Calendar as CalendarIcon, CalendarX, Settings2, Check, Loader2, Bell,
  Briefcase, Users, Umbrella, Ban
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useEstablishmentConfig,
  ComercioConfg,
  ComercioConfiguracao,
  CONFIG_LOAD_FAILED_MESSAGE,
} from '@/hooks/useEstablishmentConfig';
import { useToast } from '@/contexts/ToastContext';
import { ChavesPixPanel } from '@/features/chaves-pix/components/ChavesPixPanel';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { validateBusinessHours } from '@/lib/configComercioMappers';

export default function AdminEstablishmentConfigPage() {
  const [activeTab, setActiveTab] = useState('horarios');
  const [activePattern, setActivePattern] = useState('seg-sex');
  const { config, basicInfo, isLoading, error, configLoadFailed, updateConfig, updateBasicInfo } =
    useEstablishmentConfig();
  const [localBasicInfo, setLocalBasicInfo] = useState<ComercioConfg | null>(null);
  const [localConfig, setLocalConfig] = useState<ComercioConfiguracao | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (basicInfo) setLocalBasicInfo(basicInfo);
    if (config) setLocalConfig(config);
  }, [basicInfo, config]);

  const handleSaveConfig = async () => {
    if (!localConfig) return;

    const errorMsg = validateBusinessHours(localConfig);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    
    setIsSaving(true);
    try {
      const success = await updateConfig(localConfig);
      if (success) {
        toast.success('Horários salvos com sucesso!');
      }
    } catch (err: unknown) {
      console.error('Erro ao salvar horários:', err);
      toast.error(getFriendlyErrorMessage(err, 'Não foi possível salvar os horários.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!localBasicInfo) return;
    
    setIsSaving(true);
    try {
      const success = await updateBasicInfo(localBasicInfo);
      if (success) {
        toast.success('Informações salvas com sucesso!');
      }
    } catch (err: unknown) {
      console.error('Erro ao salvar informações do estabelecimento:', err);
      toast.error(
        getFriendlyErrorMessage(err, 'Não foi possível salvar as informações do estabelecimento.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se for erro no carregamento inicial, exibe o erro mas com um botão de tentar novamente ou layout básico
  if (error && !localConfig && !localBasicInfo) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex flex-col items-center">
        <span>{error}</span>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">Tentar Novamente</Button>
      </div>
    );
  }

  const days = [
    { id: 0, label: 'Domingo' },
    { id: 1, label: 'Segunda' },
    { id: 2, label: 'Terça' },
    { id: 3, label: 'Quarta' },
    { id: 4, label: 'Quinta' },
    { id: 5, label: 'Sexta' },
    { id: 6, label: 'Sábado' },
  ];

  const activeDays = localConfig?.horarioAtendimento?.dias || [];

  const handleDayToggle = (dayId: number) => {
    if (!localConfig?.horarioAtendimento) return;
    
    const newDias = activeDays.includes(dayId)
      ? activeDays.filter(d => d !== dayId)
      : [...activeDays, dayId];
      
    setLocalConfig({
      ...localConfig,
      horarioAtendimento: {
        ...localConfig.horarioAtendimento,
        dias: newDias
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuração do Estabelecimento</h1>
          <p className="text-muted-foreground">Gerencie horários de funcionamento, feriados e bloqueios de agenda.</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
          {error}
        </div>
      )}

      {configLoadFailed && activeTab === 'horarios' && (
        <div role="alert" className="p-4 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-lg text-sm">
          {CONFIG_LOAD_FAILED_MESSAGE}
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('horarios')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'horarios' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Horários e Regras
        </button>
        <button
          onClick={() => setActiveTab('informacoes')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'informacoes' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Informações Básicas
        </button>
        <button
          onClick={() => setActiveTab('chaves-pix')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'chaves-pix'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Chaves PIX
        </button>
      </div>

      {activeTab === 'horarios' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Horário de Funcionamento */}
          <Card className="p-0 border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/40">
              <h3 className="text-lg font-bold text-foreground flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                Horário de Funcionamento
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Defina os dias e horários em que seu estabelecimento funciona</p>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Padrão de Funcionamento */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Padrão de Funcionamento</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => {
                      setActivePattern('seg-sex');
                      if (localConfig?.horarioAtendimento) {
                        setLocalConfig({
                          ...localConfig,
                          horarioAtendimento: {
                            ...localConfig.horarioAtendimento,
                            dias: [1, 2, 3, 4, 5]
                          }
                        });
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-center flex flex-col items-center justify-center ${
                      activePattern === 'seg-sex' 
                        ? 'border-foreground ring-1 ring-foreground bg-muted/60' 
                        : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <Briefcase className="h-6 w-6 text-foreground/80 mb-2" />
                    <p className="font-semibold text-foreground">Segunda a Sexta</p>
                    <p className="text-xs text-muted-foreground mt-1">Dias úteis</p>
                  </div>
                  <div 
                    onClick={() => {
                      setActivePattern('seg-sab');
                      if (localConfig?.horarioAtendimento) {
                        setLocalConfig({
                          ...localConfig,
                          horarioAtendimento: {
                            ...localConfig.horarioAtendimento,
                            dias: [1, 2, 3, 4, 5, 6]
                          }
                        });
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-center flex flex-col items-center justify-center ${
                      activePattern === 'seg-sab' 
                        ? 'border-foreground ring-1 ring-foreground bg-muted/60' 
                        : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <CalendarIcon className="h-6 w-6 text-foreground/80 mb-2" />
                    <p className="font-semibold text-foreground">Segunda a Sábado</p>
                    <p className="text-xs text-muted-foreground mt-1">Com sábado</p>
                  </div>
                  <div 
                    onClick={() => {
                      setActivePattern('todos');
                      if (localConfig?.horarioAtendimento) {
                        setLocalConfig({
                          ...localConfig,
                          horarioAtendimento: {
                            ...localConfig.horarioAtendimento,
                            dias: [0, 1, 2, 3, 4, 5, 6]
                          }
                        });
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-center flex flex-col items-center justify-center ${
                      activePattern === 'todos' 
                        ? 'border-foreground ring-1 ring-foreground bg-muted/60' 
                        : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <CalendarIcon className="h-6 w-6 text-foreground/80 mb-2" />
                    <p className="font-semibold text-foreground">Segunda a Domingo</p>
                    <p className="text-xs text-muted-foreground mt-1">Todos os dias</p>
                  </div>
                </div>
              </div>

              {/* Dias Personalizados */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Dias de Funcionamento (Personalizado)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {days.map(day => (
                    <label key={day.id} className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <span className="text-sm text-foreground">{day.label.substring(0, 3)}</span>
                      <input 
                        type="checkbox" 
                        checked={activeDays.includes(day.id)}
                        onChange={() => handleDayToggle(day.id)}
                        className="h-4 w-4 rounded border-input text-primary accent-primary focus:ring-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Horário Padrão */}
              <div className="space-y-4 pt-4 border-t border-border">
                <label className="text-sm font-medium text-foreground">Horário de Atendimento Padrão</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Abertura</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={localConfig?.horarioAtendimento?.horaInicio?.substring(0, 5) || '08:00'}
                        onChange={(e) => {
                          if (!localConfig?.horarioAtendimento) return;
                          setLocalConfig({
                            ...localConfig,
                            horarioAtendimento: {
                              ...localConfig.horarioAtendimento,
                              horaInicio: e.target.value + ':00'
                            }
                          });
                        }}
                        className="w-full h-11 rounded-lg border border-border bg-secondary/30 text-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Fechamento</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={localConfig?.horarioAtendimento?.horaFim?.substring(0, 5) || '18:00'}
                        onChange={(e) => {
                          if (!localConfig?.horarioAtendimento) return;
                          setLocalConfig({
                            ...localConfig,
                            horarioAtendimento: {
                              ...localConfig.horarioAtendimento,
                              horaFim: e.target.value + ':00'
                            }
                          });
                        }}
                        className="w-full h-11 rounded-lg border border-border bg-secondary/30 text-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={localConfig?.horarioAtendimento?.intervalo || false}
                      onChange={(e) => {
                        if (!localConfig?.horarioAtendimento) return;
                        setLocalConfig({
                          ...localConfig,
                          horarioAtendimento: {
                            ...localConfig.horarioAtendimento,
                            intervalo: e.target.checked
                          }
                        });
                      }}
                      className="h-4 w-4 rounded border-input text-primary accent-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Possui intervalo para almoço</span>
                  </label>
                  
                  {localConfig?.horarioAtendimento?.intervalo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 pl-6 border-l-2 border-border ml-2">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Início do Intervalo</label>
                        <input 
                          type="time" 
                          value={localConfig?.horarioAtendimento?.inicioIntervalo?.substring(0, 5) || '12:00'}
                          onChange={(e) => {
                            if (!localConfig?.horarioAtendimento) return;
                            setLocalConfig({
                              ...localConfig,
                              horarioAtendimento: {
                                ...localConfig.horarioAtendimento,
                                inicioIntervalo: e.target.value + ':00'
                              }
                            });
                          }}
                          className="w-full h-11 rounded-lg border border-border bg-secondary/30 text-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Fim do Intervalo</label>
                        <input 
                          type="time" 
                          value={localConfig?.horarioAtendimento?.fimIntervalo?.substring(0, 5) || '13:00'}
                          onChange={(e) => {
                            if (!localConfig?.horarioAtendimento) return;
                            setLocalConfig({
                              ...localConfig,
                              horarioAtendimento: {
                                ...localConfig.horarioAtendimento,
                                fimIntervalo: e.target.value + ':00'
                              }
                            });
                          }}
                          className="w-full h-11 rounded-lg border border-border bg-secondary/30 text-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Horários por Profissional */}
          <Card className="p-6 border-border shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                Horários por Profissional
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Configure horários individuais para cada profissional (opcional)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={localConfig?.configuracao?.horarioPorProfissional || false}
                onChange={(e) => {
                  if (!localConfig?.configuracao) return;
                  setLocalConfig({
                    ...localConfig,
                    configuracao: {
                      ...localConfig.configuracao,
                      horarioPorProfissional: e.target.checked
                    }
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </Card>

          {/* Funcionamento em Feriados */}
          <Card className="p-0 border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/40">
              <h3 className="text-lg font-bold text-foreground flex items-center">
                <Umbrella className="h-5 w-5 mr-2 text-muted-foreground" />
                Funcionamento em Feriados
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Configure o funcionamento do estabelecimento em feriados</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Fechar em Feriados Nacionais</span>
                  <span className="text-xs text-muted-foreground mt-1 block">O estabelecimento não aceitará agendamentos em feriados nacionais</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig?.configuracao?.fechaFeriadosNacionais || false}
                    onChange={(e) => {
                      if (!localConfig?.configuracao) return;
                      setLocalConfig({
                        ...localConfig,
                        configuracao: {
                          ...localConfig.configuracao,
                          fechaFeriadosNacionais: e.target.checked
                        }
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Fechar em Feriados Municipais</span>
                  <span className="text-xs text-muted-foreground mt-1 block">O estabelecimento não aceitará agendamentos em feriados locais</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig?.configuracao?.fechaFeriadosMunicipais || false}
                    onChange={(e) => {
                      if (!localConfig?.configuracao) return;
                      setLocalConfig({
                        ...localConfig,
                        configuracao: {
                          ...localConfig.configuracao,
                          fechaFeriadosMunicipais: e.target.checked
                        }
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-border">
                <label className="text-sm font-medium text-foreground block mb-3">Feriados Personalizados</label>
                
                {(!localConfig?.configuracao?.diasFechados || localConfig.configuracao.diasFechados.length === 0) ? (
                  <p className="text-sm text-muted-foreground mb-4">Nenhum feriado personalizado cadastrado</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {localConfig.configuracao.diasFechados.map((feriado, index) => (
                      <div key={index} className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border">
                        <input 
                          type="date" 
                          value={feriado.data.substring(0, 10)}
                          onChange={(e) => {
                            if (!localConfig?.configuracao) return;
                            const newDiasFechados = [...(localConfig.configuracao.diasFechados || [])];
                            newDiasFechados[index] = { ...feriado, data: e.target.value + 'T00:00:00' };
                            setLocalConfig({
                              ...localConfig,
                              configuracao: {
                                ...localConfig.configuracao,
                                diasFechados: newDiasFechados
                              }
                            });
                          }}
                          className="h-9 rounded-md border border-border bg-background text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <input 
                          type="text" 
                          placeholder="Descrição (ex: Aniversário da Cidade)"
                          value={feriado.descricao || ''}
                          onChange={(e) => {
                            if (!localConfig?.configuracao) return;
                            const newDiasFechados = [...(localConfig.configuracao.diasFechados || [])];
                            newDiasFechados[index] = { ...feriado, descricao: e.target.value };
                            setLocalConfig({
                              ...localConfig,
                              configuracao: {
                                ...localConfig.configuracao,
                                diasFechados: newDiasFechados
                              }
                            });
                          }}
                          className="flex-1 h-9 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button 
                          onClick={() => {
                            if (!localConfig?.configuracao) return;
                            const newDiasFechados = localConfig.configuracao.diasFechados?.filter((_, i) => i !== index) || [];
                            setLocalConfig({
                              ...localConfig,
                              configuracao: {
                                ...localConfig.configuracao,
                                diasFechados: newDiasFechados
                              }
                            });
                          }}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Remover feriado"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (!localConfig?.configuracao) return;
                    const newDiasFechados = [...(localConfig.configuracao.diasFechados || [])];
                    newDiasFechados.push({ data: new Date().toISOString().substring(0, 10) + 'T00:00:00', descricao: '' });
                    setLocalConfig({
                      ...localConfig,
                      configuracao: {
                        ...localConfig.configuracao,
                        diasFechados: newDiasFechados
                      }
                    });
                  }}
                  className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  Adicionar Feriado Personalizado
                </button>
              </div>
            </div>
          </Card>

          {/* Bloqueio de Agenda */}
          <Card className="p-0 border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/40">
              <h3 className="text-lg font-bold text-foreground flex items-center">
                <Ban className="h-5 w-5 mr-2 text-muted-foreground" />
                Bloqueio de Agenda
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Bloqueie datas específicas para não receber agendamentos</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-4">Selecione as datas</h4>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Funcionalidade em Desenvolvimento</h4>
                    <p className="text-sm text-muted-foreground mt-1">Em breve você poderá bloquear datas específicas através de um calendário interativo.</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-4">Datas Bloqueadas</h4>
                <div className="space-y-3">
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">25 de Dezembro de 2025</p>
                      <p className="text-xs text-muted-foreground">Data bloqueada</p>
                    </div>
                    <button className="text-destructive hover:opacity-80">
                      <CalendarX className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">1 de Janeiro de 2026</p>
                      <p className="text-xs text-muted-foreground">Data bloqueada</p>
                    </div>
                    <button className="text-destructive hover:opacity-80">
                      <CalendarX className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Como usar:</h4>
                    <p className="text-sm text-muted-foreground mt-1">Clique nos dias do calendário para bloquear ou desbloquear datas. Clientes não poderão agendar serviços nas datas bloqueadas.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Configurações Adicionais */}
          <Card className="p-0 border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/40">
              <h3 className="text-lg font-bold text-foreground flex items-center">
                <Settings2 className="h-5 w-5 mr-2 text-muted-foreground" />
                Configurações Adicionais
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Antecedência Mínima para Agendamentos</span>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    Clientes devem agendar com pelo menos
                    <select 
                      value={localConfig?.configuracao?.antecedenciaMin || 1}
                      onChange={(e) => {
                        if (!localConfig?.configuracao) return;
                        setLocalConfig({
                          ...localConfig,
                          configuracao: {
                            ...localConfig.configuracao,
                            antecedenciaMin: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="h-8 rounded-md border border-border bg-background text-foreground px-2 outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={1}>1 hora</option>
                      <option value={2}>2 horas</option>
                      <option value={4}>4 horas</option>
                      <option value={12}>12 horas</option>
                      <option value={24}>24 horas</option>
                    </select>
                    de antecedência
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Limite para Agendamentos Futuros</span>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    Clientes podem agendar com até
                    <select 
                      value={localConfig?.configuracao?.limiteAgendar || 30}
                      onChange={(e) => {
                        if (!localConfig?.configuracao) return;
                        setLocalConfig({
                          ...localConfig,
                          configuracao: {
                            ...localConfig.configuracao,
                            limiteAgendar: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="h-8 rounded-md border border-border bg-background text-foreground px-2 outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={7}>7 dias</option>
                      <option value={15}>15 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={60}>60 dias</option>
                      <option value={90}>90 dias</option>
                    </select>
                    de antecedência máxima
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Tempo de Duração Padrão dos Serviços</span>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    Duração sugerida de
                    <select 
                      value={localConfig?.configuracao?.tempoDuracaoPadrao || 30}
                      onChange={(e) => {
                        if (!localConfig?.configuracao) return;
                        setLocalConfig({
                          ...localConfig,
                          configuracao: {
                            ...localConfig.configuracao,
                            tempoDuracaoPadrao: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="h-8 rounded-md border border-border bg-background text-foreground px-2 outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={90}>1h 30m</option>
                      <option value={120}>2 horas</option>
                    </select>
                    por atendimento
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Limite de Agendamentos Simultâneos</span>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    Permitir no máximo
                    <select 
                      value={localConfig?.configuracao?.agendaSimultanea || 1}
                      onChange={(e) => {
                        if (!localConfig?.configuracao) return;
                        setLocalConfig({
                          ...localConfig,
                          configuracao: {
                            ...localConfig.configuracao,
                            agendaSimultanea: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="h-8 rounded-md border border-border bg-background text-foreground px-2 outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                    agendamentos no mesmo horário
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig?.configuracao?.limiteAgendar !== undefined}
                    onChange={() => {}}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Confirmação Automática de Agendamentos</span>
                  <span className="text-xs text-muted-foreground mt-1 block">Agendamentos serão confirmados automaticamente sem necessidade de aprovação manual</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig?.configuracao?.confirmaAuto || false}
                    onChange={(e) => {
                      if (!localConfig?.configuracao) return;
                      setLocalConfig({
                        ...localConfig,
                        configuracao: {
                          ...localConfig.configuracao,
                          confirmaAuto: e.target.checked
                        }
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Horários Diferenciados por Profissional</span>
                  <span className="text-xs text-muted-foreground mt-1 block">Permitir que cada profissional tenha seu próprio horário de atendimento</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig?.configuracao?.horarioPorProfissional || false}
                    onChange={(e) => {
                      if (!localConfig?.configuracao) return;
                      setLocalConfig({
                        ...localConfig,
                        configuracao: {
                          ...localConfig.configuracao,
                          horarioPorProfissional: e.target.checked
                        }
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

          {localConfig?.configuracao?.horarioPorProfissional && localConfig.funcionarios && localConfig.funcionarios.length > 0 && (
            <Card className="p-0 border-border shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-border bg-muted/40">
                <h3 className="text-lg font-bold text-foreground flex items-center">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  Horários por Profissional
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Configure o horário individual de cada membro da equipe</p>
              </div>
              <div className="p-6 divide-y divide-border">
                {localConfig.funcionarios.map((func, index) => (
                  <div key={func.idFuncionario} className="py-6 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                          {func.nomeFuncionario?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <span className="font-bold text-foreground">{func.nomeFuncionario || 'Profissional'}</span>
                          <span className="text-xs text-muted-foreground block">ID: {func.idFuncionario.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {days.map((day) => {
                            const isActive = func.dias.includes(day.id);
                            return (
                              <button
                                key={day.id}
                                onClick={() => {
                                  const newFuncs = [...(localConfig.funcionarios || [])];
                                  const newDias = isActive 
                                    ? func.dias.filter(d => d !== day.id)
                                    : [...func.dias, day.id];
                                  newFuncs[index] = { ...func, dias: newDias };
                                  setLocalConfig({ ...localConfig, funcionarios: newFuncs });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isActive 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                              >
                                {day.label.substring(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Início</label>
                          <input 
                            type="time" 
                            value={func.horaInicio.substring(0, 5)}
                            onChange={(e) => {
                              const newFuncs = [...(localConfig.funcionarios || [])];
                              newFuncs[index] = { ...func, horaInicio: e.target.value + ':00' };
                              setLocalConfig({ ...localConfig, funcionarios: newFuncs });
                            }}
                            className="w-full h-10 rounded-lg border border-border bg-secondary/30 text-foreground px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fim</label>
                          <input 
                            type="time" 
                            value={func.horaFim.substring(0, 5)}
                            onChange={(e) => {
                              const newFuncs = [...(localConfig.funcionarios || [])];
                              newFuncs[index] = { ...func, horaFim: e.target.value + ':00' };
                              setLocalConfig({ ...localConfig, funcionarios: newFuncs });
                            }}
                            className="w-full h-10 rounded-lg border border-border bg-secondary/30 text-foreground px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Buffer entre Serviços</span>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    Adicionar
                    <select 
                      value={localConfig?.configuracao?.tempoIntervalo || 0}
                      onChange={(e) => {
                        if (!localConfig?.configuracao) return;
                        setLocalConfig({
                          ...localConfig,
                          configuracao: {
                            ...localConfig.configuracao,
                            tempoIntervalo: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="h-8 rounded-md border border-border bg-background text-foreground px-2 outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={0}>Nenhum</option>
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                    </select>
                    de intervalo entre cada agendamento
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig?.configuracao?.tempoIntervalo !== undefined}
                    onChange={() => {}}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Antecedência para Cancelamento</span>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    Clientes podem cancelar com até
                    <select 
                      value={localConfig?.configuracao?.tempoCancelamento || 24}
                      onChange={(e) => {
                        if (!localConfig?.configuracao) return;
                        setLocalConfig({
                          ...localConfig,
                          configuracao: {
                            ...localConfig.configuracao,
                            tempoCancelamento: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="h-8 rounded-md border border-border bg-background text-foreground px-2 outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={2}>2 horas</option>
                      <option value={12}>12 horas</option>
                      <option value={24}>24 horas</option>
                      <option value={48}>48 horas</option>
                    </select>
                    antes do horário agendado
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig?.configuracao?.tempoCancelamento !== undefined}
                    onChange={() => {}}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">Permitir Reagendamento pelo Cliente</span>
                  <span className="text-xs text-muted-foreground mt-1 block">Clientes podem reagendar seus agendamentos sem aprovação do estabelecimento</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localConfig?.configuracao?.reagendar || false}
                    onChange={(e) => {
                      if (!localConfig?.configuracao) return;
                      setLocalConfig({
                        ...localConfig,
                        configuracao: {
                          ...localConfig.configuracao,
                          reagendar: e.target.checked
                        }
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Bottom Bar */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button variant="outline">Cancelar</Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={isSaving || configLoadFailed}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'informacoes' && (
        <div className="grid gap-8 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Left Column: Profile & Logo */}
          <div className="space-y-8">
            <Card className="p-8 border-border shadow-sm flex flex-col items-center text-center">
              <div className="relative group cursor-pointer">
                <div className="h-32 w-32 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-all">
                  <Store className="h-12 w-12 text-muted-foreground/50 group-hover:text-primary transition-all" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="mt-4 font-bold text-foreground text-lg">Logo do Estabelecimento</h3>
              <p className="text-sm text-muted-foreground mt-1">Recomendado: 512x512px (PNG ou JPG)</p>
              <Button variant="outline" size="sm" className="mt-4 w-full">Alterar Logo</Button>
            </Card>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 border-border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6">Informações Básicas</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Nome do Estabelecimento*</label>
                  <input 
                    type="text" 
                    value={localBasicInfo?.nome || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, nome: e.target.value } : null)}
                    className="w-full h-11 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">CNPJ (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="00.000.000/0000-00"
                    value={localBasicInfo?.cnpj || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, cnpj: e.target.value } : null)}
                    className="w-full h-11 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Descrição/Bio</label>
                  <textarea 
                    rows={3}
                    value={localBasicInfo?.descricao || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, descricao: e.target.value } : null)}
                    placeholder="Fale um pouco sobre o seu estabelecimento..."
                    className="w-full rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground p-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                Localização e Contato
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={localBasicInfo?.endereco || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, endereco: e.target.value } : null)}
                    className="w-full h-11 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Telefone/WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      value={localBasicInfo?.telefone || ''}
                      onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">E-mail de Contato</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="email" 
                      value={localBasicInfo?.email || ''}
                      onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, email: e.target.value } : null)}
                      placeholder="contato@estabelecimento.com"
                      className="w-full h-11 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6">Redes Sociais</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="@seu_instagram"
                    value={localBasicInfo?.instagram || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, instagram: e.target.value } : null)}
                    className="flex-1 h-11 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Facebook className="h-5 w-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="facebook.com/seu_negocio"
                    value={localBasicInfo?.facebook || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, facebook: e.target.value } : null)}
                    className="flex-1 h-11 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="www.seusite.com.br"
                    value={localBasicInfo?.site || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, site: e.target.value } : null)}
                    className="flex-1 h-11 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground px-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                Notificações e Lembretes
              </h3>
              <div className="space-y-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localBasicInfo?.notificarAgendamento || false}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, notificarAgendamento: e.target.checked } : null)}
                    className="h-5 w-5 rounded border-input text-primary accent-primary focus:ring-primary mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">Notificar Novos Agendamentos</span>
                    <span className="text-xs text-muted-foreground">Receber notificações quando um cliente realizar um novo agendamento</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localBasicInfo?.lembrarAgendamento || false}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, lembrarAgendamento: e.target.checked } : null)}
                    className="h-5 w-5 rounded border-input text-primary accent-primary focus:ring-primary mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">Lembretes para Clientes</span>
                    <span className="text-xs text-muted-foreground">Enviar lembretes automáticos para os clientes antes do horário agendado</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localBasicInfo?.resumoDiario || false}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, resumoDiario: e.target.checked } : null)}
                    className="h-5 w-5 rounded border-input text-primary accent-primary focus:ring-primary mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">Resumo Diário</span>
                    <span className="text-xs text-muted-foreground">Receber um e-mail com o resumo de todos os agendamentos do dia</span>
                  </div>
                </label>
              </div>
            </Card>

            <div className="flex justify-end pt-4">
              <Button 
                className="w-full h-12 rounded-xl font-bold transition-all lg:w-64"
                onClick={handleSaveBasicInfo}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                    Salvando...
                  </div>
                ) : (
                  'Salvar Informações'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chaves-pix' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ChavesPixPanel />
        </div>
      )}
    </div>
  );
}
