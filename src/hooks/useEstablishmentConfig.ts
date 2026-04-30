import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface HorarioAtendimento {
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
  comercioId: number;
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

export interface ComercioConfigFuncionario {
  idFuncionario: string;
  nomeFuncionario?: string;
  idHorarioAtendimento?: number;
  dias: number[];
  horaInicio: string;
  horaFim: string;
  inicioIntervalo?: string;
  fimIntervalo?: string;
  intervalo: boolean;
}

export interface ComercioConfiguracao {
  idHorarioAtendimento?: number;
  idConfigComercio?: number;
  horarioAtendimento?: HorarioAtendimento;
  configuracao?: ConfigComercio;
  funcionarios?: ComercioConfigFuncionario[];
}

export interface ComercioConfg {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  cnpj?: string;
  email?: string;
  descricao?: string;
  notificarAgendamento: boolean;
  lembrarAgendamento: boolean;
  resumoDiario: boolean;
  instagram?: string;
  facebook?: string;
  site?: string;
  logoUrl?: string;
}


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

      try {
        // 1. Get the user's commerce
        const comercios = await fetchApi('/api/Comercios/Admin');
        let basicDataRaw: any = null;

        if (Array.isArray(comercios) && comercios.length > 0) {
          basicDataRaw = comercios[0];
        } else if (comercios && !Array.isArray(comercios) && comercios.id) {
          basicDataRaw = comercios;
        }

        if (!basicDataRaw) {
          throw new Error("Nenhum comércio encontrado para este usuário.");
        }

        const actualComercioId = basicDataRaw.id;
        setActiveComercioId(actualComercioId);

        // 2. Map basic info
        const basicData: ComercioConfg = {
          id: basicDataRaw.id,
          nome: basicDataRaw.nome || '',
          endereco: basicDataRaw.endereco || '',
          telefone: basicDataRaw.telefone || '',
          cnpj: basicDataRaw.cnpj || '',
          email: basicDataRaw.email || '',
          descricao: basicDataRaw.descricao || '',
          notificarAgendamento: basicDataRaw.notificarAgendamento || false,
          lembrarAgendamento: basicDataRaw.lembrarAgendamento || false,
          resumoDiario: basicDataRaw.resumoDiario || false,
          instagram: basicDataRaw.instagram || '',
          facebook: basicDataRaw.facebook || '',
          site: basicDataRaw.site || '',
          logoUrl: basicDataRaw.logoUrl || ''
        };
        setBasicInfo(basicData);

        // 3. Get specific configuration
        try {
          const configDataRaw = await fetchApi(`/api/ConfigComercio/${actualComercioId}`);
          if (configDataRaw) {
            setConfig({
              idHorarioAtendimento: configDataRaw.idHorarioAtendimento,
              idConfigComercio: configDataRaw.idConfigComercio,
              horarioAtendimento: configDataRaw.horarioAtendimento,
              configuracao: configDataRaw.configuracao,
              funcionarios: configDataRaw.funcionarios
            });
          }
        } catch (err: any) {
          // Se for 404, apenas ignoramos pois significa que o comércio ainda não tem configurações
          // e permitiremos que ele salve as primeiras agora.
          if (err.status !== 404 && err.message !== '404') {
            console.error("Erro ao buscar configurações específicas:", err);
          }
          
          // Inicializa com valores padrão caso não encontre
          setConfig({
            horarioAtendimento: {
              dias: [1, 2, 3, 4, 5],
              horaInicio: "08:00:00",
              horaFim: "18:00:00",
              intervalo: false
            },
            configuracao: {
              antecedenciaMin: 1,
              limiteAgendar: 30,
              tempoDuracaoPadrao: 30,
              confirmaAuto: true,
              horarioPorProfissional: false,
              agendaSimultanea: 1,
              reagendar: true,
              tempoCancelamento: 24
            },
            funcionarios: []
          });
        }
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
    if (!activeComercioId) {
      setError('ID do comércio não encontrado.');
      return false;
    }

    try {
      // Determina se é criação (POST) ou edição (PUT) baseado na presença de IDs
      const isNew = !newConfig.idConfigComercio || !newConfig.idHorarioAtendimento;
      
      // Mapeamento rigoroso para o DTO esperado pelo .NET (PascalCase)
      const payload = {
        IdHorarioAtendimento: newConfig.idHorarioAtendimento,
        IdConfigComercio: newConfig.idConfigComercio,
        HorarioAtendimento: newConfig.horarioAtendimento ? {
          Dias: newConfig.horarioAtendimento.dias,
          HoraInicio: newConfig.horarioAtendimento.horaInicio,
          HoraFim: newConfig.horarioAtendimento.horaFim,
          Intervalo: newConfig.horarioAtendimento.intervalo,
          InicioIntervalo: newConfig.horarioAtendimento.inicioIntervalo,
          FimIntervalo: newConfig.horarioAtendimento.fimIntervalo
        } : null,
        Configuracao: newConfig.configuracao ? {
          ComercioId: activeComercioId,
          AntecedenciaMin: newConfig.configuracao.antecedenciaMin,
          LimiteAgendar: newConfig.configuracao.limiteAgendar,
          ConfirmaAuto: newConfig.configuracao.confirmaAuto,
          TempoDuracaoPadrao: newConfig.configuracao.tempoDuracaoPadrao,
          TempoCancelamento: newConfig.configuracao.tempoCancelamento,
          Reagendar: newConfig.configuracao.reagendar,
          TempoIntervalo: newConfig.configuracao.tempoIntervalo,
          AgendaSimultanea: newConfig.configuracao.agendaSimultanea,
          HorarioPorProfissional: newConfig.configuracao.horarioPorProfissional,
          FechaFeriadosNacionais: newConfig.configuracao.fechaFeriadosNacionais,
          FechaFeriadosMunicipais: newConfig.configuracao.fechaFeriadosMunicipais,
          DiasFechados: newConfig.configuracao.diasFechados?.map(df => ({
            Id: df.id,
            Data: df.data,
            Descricao: df.descricao
          })) || []
        } : null,
        Funcionarios: newConfig.funcionarios?.map(f => ({
          IdFuncionario: f.idFuncionario,
          Dias: f.dias,
          HoraInicio: f.horaInicio,
          HoraFim: f.horaFim,
          Intervalo: f.intervalo,
          InicioIntervalo: f.inicioIntervalo,
          FimIntervalo: f.fimIntervalo
        })) || []
      };

      const url = isNew 
        ? '/api/ConfigComercio' 
        : `/api/ConfigComercio/Editar-Atendimento/${activeComercioId}`;
        
      const method = isNew ? 'POST' : 'PUT';

      await fetchApi(url, {
        method: method,
        body: JSON.stringify(payload),
        skipToast: true
      } as any);
      
      // Se era novo, precisamos recarregar os dados para obter os IDs gerados pelo banco
      if (isNew) {
        window.location.reload(); 
      } else {
        setConfig(newConfig);
      }
      
      return true;
    } catch (err: any) {
      throw err;
    }
  };

  const updateBasicInfo = async (newBasicInfo: ComercioConfg) => {
    if (!activeComercioId) {
      setError('ID do comércio não encontrado.');
      return false;
    }

    try {
      // ComerciosController Put uses [FromForm], so we use FormData
      const formData = new FormData();
      formData.append('Id', String(newBasicInfo.id));
      formData.append('Nome', newBasicInfo.nome);
      formData.append('Endereco', newBasicInfo.endereco);
      formData.append('Telefone', newBasicInfo.telefone);
      if (newBasicInfo.cnpj) formData.append('CNPJ', newBasicInfo.cnpj);
      if (newBasicInfo.email) formData.append('Email', newBasicInfo.email);
      if (newBasicInfo.descricao) formData.append('Descricao', newBasicInfo.descricao);
      formData.append('NotificarAgendamento', String(newBasicInfo.notificarAgendamento));
      formData.append('LembrarAgendamento', String(newBasicInfo.lembrarAgendamento));
      formData.append('ResumoDiario', String(newBasicInfo.resumoDiario));
      if (newBasicInfo.instagram) formData.append('Instagram', newBasicInfo.instagram);
      if (newBasicInfo.facebook) formData.append('Facebook', newBasicInfo.facebook);
      if (newBasicInfo.site) formData.append('Site', newBasicInfo.site);

      await fetchApi(`/api/Comercios/${activeComercioId}`, {
        method: 'PUT',
        body: formData, // fetchApi should handle FormData correctly
        skipToast: true
      } as any);
      
      setBasicInfo(newBasicInfo);
      return true;
    } catch (err: any) {
      throw err;
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
