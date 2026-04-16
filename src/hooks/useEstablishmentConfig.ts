import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface HorarioAtendimento {
  id?: number;
  comercioId?: number;
  dias: number[];
  horaInicio: string;
  horaFim: string;
  intervalo: boolean;
  inicioIntervalo?: string;
  fimIntervalo?: string;
}

export interface DiaFechado {
  id?: number;
  data: string;
  descricao?: string;
}

export interface ConfigComercio {
  id?: number;
  comercioId?: number;
  antecedenciaMin: number;
  limiteAgendar: number;
  confirmaAuto: boolean;
  tempoDuracaoPadrao: number;
  tempoCancelamento: number;
  reagendar: boolean;
  tempoIntervalo: number;
  agendaSimultanea: number;
  horarioPorProfissional: boolean;
  fechaFeriadosNacionais: boolean;
  fechaFeriadosMunicipais: boolean;
  diasFechados: DiaFechado[];
}

export interface ComercioClientes {
  nome: string;
  telefone: string;
  ultimaVisita?: string;
}

export interface UsuarioEmpresa {
  id?: number;
  usuarioId: string;
  comercioId: number;
  tipoPermissao: number;
  status: boolean;
  horarioId?: number;
  horarioAtendimento?: HorarioAtendimento;
}

export interface ComercioConfiguracao {
  horarioAtendimento?: HorarioAtendimento;
  configuracao?: ConfigComercio;
  funcionarios?: UsuarioEmpresa[];
}

export interface ComercioConfg {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  horaEntradaUtil: string;
  horaSaidaUtil: string;
  horaEntradaFimDeSem: string;
  horaSaidaFimDeSem: string;
  notificarAgendamento: boolean;
  lembrarAgendamento: boolean;
  resumoDiario: boolean;
}

const IS_DEMO_MODE = false; // TODO: Remover depois

export function useEstablishmentConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<ComercioConfiguracao | null>(null);
  const [basicInfo, setBasicInfo] = useState<ComercioConfg | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComercioId, setActiveComercioId] = useState<number | null>(null);

  const comercioId = user?.id || 1; // Fallback to 1 for testing

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      if (IS_DEMO_MODE) {
        setTimeout(() => {
          const storedConfig = localStorage.getItem('demo_config');
          const storedBasic = localStorage.getItem('demo_basic');
          
          if (storedConfig) {
            setConfig(JSON.parse(storedConfig));
          } else {
            setConfig({
              horarioAtendimento: {
                dias: [1, 2, 3, 4, 5],
                horaInicio: '09:00',
                horaFim: '18:00',
                intervalo: true,
                inicioIntervalo: '12:00',
                fimIntervalo: '13:00'
              },
              configuracao: {
                antecedenciaMin: 30,
                limiteAgendar: 30,
                confirmaAuto: true,
                tempoDuracaoPadrao: 30,
                tempoCancelamento: 2,
                reagendar: true,
                tempoIntervalo: 15,
                agendaSimultanea: 1,
                horarioPorProfissional: false,
                fechaFeriadosNacionais: true,
                fechaFeriadosMunicipais: false,
                diasFechados: []
              }
            });
          }
          
          if (storedBasic) {
            setBasicInfo(JSON.parse(storedBasic));
          } else {
            setBasicInfo({
              id: 1,
              nome: 'Barbearia Demo',
              endereco: 'Rua Fictícia, 123',
              telefone: '(11) 99999-9999',
              horaEntradaUtil: '09:00',
              horaSaidaUtil: '18:00',
              horaEntradaFimDeSem: '09:00',
              horaSaidaFimDeSem: '13:00',
              notificarAgendamento: true,
              lembrarAgendamento: true,
              resumoDiario: false
            });
          }
          
          setActiveComercioId(1);
          setIsLoading(false);
        }, 500);
        return;
      }

      try {
        // First, get the user's comercios to find the correct comercioId
        const comercios = await fetchApi('/api/Comercios');
        
        let actualComercioId = null;
        let basicDataRaw: any = null;

        if (Array.isArray(comercios) && comercios.length > 0) {
          actualComercioId = comercios[0].id;
          basicDataRaw = comercios[0];
        } else if (comercios && !Array.isArray(comercios) && comercios.id) {
          actualComercioId = comercios.id;
          basicDataRaw = comercios;
        }

        if (!actualComercioId) {
          throw new Error("Nenhum comércio encontrado para este usuário.");
        }

        setActiveComercioId(actualComercioId);

        // Como a página ainda não tem GET para as configurações, vamos usar valores padrão
        const configData: ComercioConfiguracao = {
          horarioAtendimento: {
            dias: [1, 2, 3, 4, 5],
            horaInicio: '09:00',
            horaFim: '18:00',
            intervalo: true,
            inicioIntervalo: '12:00',
            fimIntervalo: '13:00'
          },
          configuracao: {
            antecedenciaMin: 30,
            limiteAgendar: 30,
            confirmaAuto: true,
            tempoDuracaoPadrao: 30,
            tempoCancelamento: 2,
            reagendar: true,
            tempoIntervalo: 15,
            agendaSimultanea: 1,
            horarioPorProfissional: false,
            fechaFeriadosNacionais: true,
            fechaFeriadosMunicipais: false,
            diasFechados: []
          }
        };
        
        // Adapt basicData from API (which returns Comercio instead of ComercioConfg)
        let horaEntradaUtil = '09:00';
        let horaSaidaUtil = '18:00';
        let horaEntradaFimDeSem = '09:00';
        let horaSaidaFimDeSem = '13:00';

        if (basicDataRaw.horarioAtendimento && Array.isArray(basicDataRaw.horarioAtendimento)) {
          basicDataRaw.horarioAtendimento.forEach((horario: any) => {
            if (horario.dias && horario.dias.length > 2) {
              horaEntradaUtil = horario.horaInicio || '09:00';
              horaSaidaUtil = horario.horaFim || '18:00';
            } else {
              horaEntradaFimDeSem = horario.horaInicio || '09:00';
              horaSaidaFimDeSem = horario.horaFim || '13:00';
            }
          });
        }

        const basicData: ComercioConfg = {
          id: basicDataRaw.id || comercioId,
          nome: basicDataRaw.nome || '',
          endereco: basicDataRaw.endereco || '',
          telefone: basicDataRaw.telefone || '',
          notificarAgendamento: basicDataRaw.notificarAgendamento || false,
          lembrarAgendamento: basicDataRaw.lembrarAgendamento || false,
          resumoDiario: basicDataRaw.resumoDiario || false,
          horaEntradaUtil,
          horaSaidaUtil,
          horaEntradaFimDeSem,
          horaSaidaFimDeSem
        };

        setConfig(configData);
        setBasicInfo(basicData);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    };

    if (comercioId) {
      loadData();
    }
  }, [comercioId]);

  const updateConfig = async (newConfig: ComercioConfiguracao) => {
    if (IS_DEMO_MODE) {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          localStorage.setItem('demo_config', JSON.stringify(newConfig));
          setConfig(newConfig);
          resolve(true);
        }, 500);
      });
    }

    if (!activeComercioId) {
      setError('ID do comércio não encontrado.');
      return false;
    }

    try {
      await fetchApi(`/Editar-Atendimento/${activeComercioId}`, {
        method: 'PUT',
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig);
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
      return false;
    }
  };

  const updateBasicInfo = async (newBasicInfo: ComercioConfg) => {
    if (IS_DEMO_MODE) {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          localStorage.setItem('demo_basic', JSON.stringify(newBasicInfo));
          setBasicInfo(newBasicInfo);
          resolve(true);
        }, 500);
      });
    }

    if (!activeComercioId) {
      setError('ID do comércio não encontrado.');
      return false;
    }

    try {
      await fetchApi(`/Editar/${activeComercioId}`, {
        method: 'PUT',
        body: JSON.stringify(newBasicInfo),
      });
      setBasicInfo(newBasicInfo);
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar informações básicas');
      return false;
    }
  };

  return {
    config,
    basicInfo,
    isLoading,
    error,
    updateConfig,
    updateBasicInfo
  };
}
