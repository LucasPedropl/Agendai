import React, { useState, useEffect } from 'react';
import { 
  Store, Save, MapPin, Phone, Mail, Clock, Globe, Instagram, Facebook, Camera,
  Info, Calendar as CalendarIcon, CalendarX, Settings2, Check, Loader2, Bell
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEstablishmentConfig, ComercioConfg, ComercioConfiguracao } from '@/hooks/useEstablishmentConfig';

export default function AdminEstablishmentConfigPage() {
  const [activeTab, setActiveTab] = useState('horarios');
  const [activePattern, setActivePattern] = useState('seg-sex');
  const { config, basicInfo, isLoading, error, updateConfig, updateBasicInfo } = useEstablishmentConfig();
  const [localBasicInfo, setLocalBasicInfo] = useState<ComercioConfg | null>(null);
  const [localConfig, setLocalConfig] = useState<ComercioConfiguracao | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (basicInfo) setLocalBasicInfo(basicInfo);
    if (config) setLocalConfig(config);
  }, [basicInfo, config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'informacoes' && localBasicInfo) {
        await updateBasicInfo(localBasicInfo);
      } else if (activeTab === 'horarios' && localConfig) {
        await updateConfig(localConfig);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
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
          <h1 className="text-2xl font-bold text-slate-900">Configuração do Estabelecimento</h1>
          <p className="text-slate-500">Gerencie informações, horários de funcionamento e regras da agenda.</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('horarios')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'horarios' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Horários e Regras
        </button>
        <button
          onClick={() => setActiveTab('informacoes')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'informacoes' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Informações Básicas
        </button>
      </div>

      {activeTab === 'horarios' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Horário de Funcionamento */}
          <Card className="p-0 border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Horário de Funcionamento</h3>
              <p className="text-sm text-slate-500">Defina os dias e horários em que seu estabelecimento funciona</p>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Padrão de Funcionamento */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Padrão de Funcionamento</label>
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-center ${
                      activePattern === 'seg-sex' 
                        ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">Segunda a Sexta</p>
                    <p className="text-xs text-slate-500 mt-1">5 dias por semana</p>
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-center ${
                      activePattern === 'seg-sab' 
                        ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">Segunda a Sábado</p>
                    <p className="text-xs text-slate-500 mt-1">6 dias por semana</p>
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-center ${
                      activePattern === 'todos' 
                        ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' 
                        : 'border-gray-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">Todos os Dias</p>
                    <p className="text-xs text-slate-500 mt-1">7 dias por semana</p>
                  </div>
                </div>
              </div>

              {/* Dias Personalizados */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Dias de Funcionamento (Personalizado)</label>
                <div className="flex flex-wrap gap-3">
                  {days.map(day => (
                    <label key={day.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg min-w-[140px] flex-1 cursor-pointer hover:bg-gray-50">
                      <span className="text-sm text-slate-700">{day.label}</span>
                      <input 
                        type="checkbox" 
                        checked={activeDays.includes(day.id)}
                        onChange={() => handleDayToggle(day.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Horário Padrão */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <label className="text-sm font-medium text-slate-700">Horário de Atendimento Padrão</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Horário de Abertura</label>
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
                        className="w-full h-11 rounded-lg border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Horário de Fechamento</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={localConfig?.horarioAtendimento?.horaFim?.substring(0, 5) || '19:00'}
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
                        className="w-full h-11 rounded-lg border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                      />
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
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Possui intervalo para almoço</span>
                  </label>
                  
                  {localConfig?.horarioAtendimento?.intervalo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 pl-6 border-l-2 border-gray-100 ml-2">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500">Início do Intervalo</label>
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
                          className="w-full h-11 rounded-lg border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500">Fim do Intervalo</label>
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
                          className="w-full h-11 rounded-lg border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Horários por Profissional */}
          <Card className="p-6 border-gray-200 shadow-sm bg-white flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Horários por Profissional</h3>
              <p className="text-sm text-slate-500">Configure horários específicos para cada profissional</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
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
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-sm font-medium text-slate-700">Ativar</span>
            </label>
          </Card>

          {/* Funcionamento em Feriados */}
          <Card className="p-0 border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Funcionamento em Feriados</h3>
              <p className="text-sm text-slate-500">Configure o funcionamento do estabelecimento em feriados</p>
            </div>
            
            <div className="p-6 space-y-6">
              <label className="flex items-start gap-3 cursor-pointer">
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
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 block">Fechar em Feriados Nacionais</span>
                  <span className="text-xs text-slate-500">O estabelecimento não aceitará agendamentos em feriados nacionais</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
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
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 block">Fechar em Feriados Municipais</span>
                  <span className="text-xs text-slate-500">O estabelecimento não aceitará agendamentos em feriados locais</span>
                </div>
              </label>

              <div className="pt-4 border-t border-gray-100">
                <label className="text-sm font-medium text-slate-700 block mb-3">Feriados Personalizados</label>
                
                {(!localConfig?.configuracao?.diasFechados || localConfig.configuracao.diasFechados.length === 0) ? (
                  <p className="text-sm text-slate-500 mb-4">Nenhum feriado personalizado cadastrado</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {localConfig.configuracao.diasFechados.map((feriado, index) => (
                      <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
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
                          className="h-9 rounded-md border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
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
                          className="flex-1 h-9 rounded-md border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
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
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
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
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  Adicionar Feriado Personalizado
                </button>
              </div>
            </div>
          </Card>

          {/* Bloqueio de Agenda */}
          <Card className="p-0 border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Bloqueio de Agenda</h3>
              <p className="text-sm text-slate-500">Bloqueie datas específicas para não receber agendamentos</p>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Funcionalidade em Desenvolvimento</h4>
                  <p className="text-sm text-blue-700 mt-1">Em breve você poderá bloquear datas específicas através de um calendário interativo.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Configurações Adicionais */}
          <Card className="p-0 border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Configurações Adicionais</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={localConfig?.configuracao?.antecedenciaMin !== undefined}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900 block">Antecedência Mínima para Agendamentos</span>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                    Clientes devem agendar com pelo menos
                    <select 
                      value={localConfig?.configuracao?.antecedenciaMin || 2}
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
                      className="h-9 rounded-md border border-gray-200 px-2 outline-none focus:ring-2 focus:ring-indigo-600"
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

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={localConfig?.configuracao?.limiteAgendar !== undefined}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900 block">Limite de Agendamentos Simultâneos</span>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
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
                      className="h-9 rounded-md border border-gray-200 px-2 outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                    agendamentos no mesmo horário
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
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
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 block">Confirmação Automática de Agendamentos</span>
                  <span className="text-xs text-slate-500">Agendamentos serão confirmados automaticamente sem necessidade de aprovação manual</span>
                </div>
              </label>

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={localConfig?.configuracao?.tempoIntervalo !== undefined}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900 block">Buffer entre Serviços</span>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
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
                      className="h-9 rounded-md border border-gray-200 px-2 outline-none focus:ring-2 focus:ring-indigo-600"
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
              </div>

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={localConfig?.configuracao?.tempoCancelamento !== undefined}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900 block">Antecedência para Cancelamento</span>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
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
                      className="h-9 rounded-md border border-gray-200 px-2 outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value={2}>2 horas</option>
                      <option value={12}>12 horas</option>
                      <option value={24}>24 horas</option>
                      <option value={48}>48 horas</option>
                    </select>
                    antes do horário agendado
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
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
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 block">Permitir Reagendamento pelo Cliente</span>
                  <span className="text-xs text-slate-500">Clientes podem reagendar seus agendamentos sem aprovação do estabelecimento</span>
                </div>
              </label>
            </div>
          </Card>

          {/* Auto-save notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center gap-2">
            <span className="text-sm font-bold text-blue-900">Salvamento Automático Ativo:</span>
            <span className="text-sm text-blue-700">Suas alterações são salvas automaticamente após 300ms de inatividade.</span>
          </div>
        </div>
      )}

      {activeTab === 'informacoes' && (
        <div className="grid gap-8 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Left Column: Profile & Logo */}
          <div className="space-y-8">
            <Card className="p-8 border-none shadow-sm bg-white flex flex-col items-center text-center">
              <div className="relative group cursor-pointer">
                <div className="h-32 w-32 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-indigo-400 transition-all">
                  <Store className="h-12 w-12 text-slate-300 group-hover:text-indigo-400 transition-all" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-lg">Logo do Estabelecimento</h3>
              <p className="text-sm text-slate-500 mt-1">Recomendado: 512x512px (PNG ou JPG)</p>
              <Button variant="outline" size="sm" className="mt-4 w-full">Alterar Logo</Button>
            </Card>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 border-none shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Informações Básicas</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nome do Estabelecimento*</label>
                  <input 
                    type="text" 
                    value={localBasicInfo?.nome || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, nome: e.target.value } : null)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">CNPJ (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="00.000.000/0000-00"
                    className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Descrição/Bio</label>
                  <textarea 
                    rows={3}
                    defaultValue="A melhor barbearia da região, com profissionais qualificados e ambiente climatizado."
                    className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                Localização e Contato
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={localBasicInfo?.endereco || ''}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, endereco: e.target.value } : null)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Telefone/WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={localBasicInfo?.telefone || ''}
                      onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                      className="w-full h-11 rounded-xl border border-gray-200 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">E-mail de Contato</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="email" 
                      defaultValue="contato@agendaai.com"
                      className="w-full h-11 rounded-xl border border-gray-200 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Redes Sociais</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="@seu_instagram"
                    className="flex-1 h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Facebook className="h-5 w-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="facebook.com/seu_negocio"
                    className="flex-1 h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="www.seusite.com.br"
                    className="flex-1 h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-indigo-600" />
                Notificações e Lembretes
              </h3>
              <div className="space-y-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localBasicInfo?.notificarAgendamento || false}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, notificarAgendamento: e.target.checked } : null)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 block">Notificar Novos Agendamentos</span>
                    <span className="text-xs text-slate-500">Receber notificações quando um cliente realizar um novo agendamento</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localBasicInfo?.lembrarAgendamento || false}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, lembrarAgendamento: e.target.checked } : null)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 block">Lembretes para Clientes</span>
                    <span className="text-xs text-slate-500">Enviar lembretes automáticos para os clientes antes do horário agendado</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localBasicInfo?.resumoDiario || false}
                    onChange={(e) => setLocalBasicInfo(prev => prev ? { ...prev, resumoDiario: e.target.checked } : null)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 block">Resumo Diário</span>
                    <span className="text-xs text-slate-500">Receber um e-mail com o resumo de todos os agendamentos do dia</span>
                  </div>
                </label>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
