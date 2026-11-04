import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { fetchAdminComercios } from '@/lib/apiHelpers';
import { getFriendlyErrorMessage, hasApiStatus } from '@/lib/errors';
import {
  buildConfigComercioPayload,
  configExistsOnServer,
  createDefaultConfig,
  isValidConfigResponse,
  mapConfigFromApi,
  type ComercioConfiguracao,
  type ConfigComercio,
  type HorarioAtendimento,
  type ComercioConfigFuncionario,
  type DiaFechado,
} from '@/lib/configComercioMappers';
import { useAuth } from '@/contexts/AuthContext';

export type {
  ComercioConfiguracao,
  ConfigComercio,
  HorarioAtendimento,
  ComercioConfigFuncionario,
  DiaFechado,
};

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

function mapBasicInfo(raw: Record<string, unknown>): ComercioConfg {
  return {
    id: Number(raw.id),
    nome: String(raw.nome ?? ''),
    endereco: String(raw.endereco ?? ''),
    telefone: String(raw.telefone ?? ''),
    cnpj: String(raw.cnpj ?? ''),
    email: String(raw.email ?? ''),
    descricao: String(raw.descricao ?? ''),
    notificarAgendamento: Boolean(raw.notificarAgendamento),
    lembrarAgendamento: Boolean(raw.lembrarAgendamento),
    resumoDiario: Boolean(raw.resumoDiario),
    instagram: String(raw.instagram ?? ''),
    facebook: String(raw.facebook ?? ''),
    site: String(raw.site ?? ''),
    logoUrl: String(raw.logoUrl ?? ''),
  };
}

function mergeConfigState(
  current: ComercioConfiguracao | null,
  incoming: ComercioConfiguracao
): ComercioConfiguracao {
  return {
    ...current,
    ...incoming,
    idHorarioAtendimento: incoming.idHorarioAtendimento ?? current?.idHorarioAtendimento ?? 0,
    idConfigComercio: incoming.idConfigComercio ?? current?.idConfigComercio ?? 0,
    horarioAtendimento: incoming.horarioAtendimento ?? current?.horarioAtendimento,
    configuracao: incoming.configuracao ?? current?.configuracao,
    funcionarios: incoming.funcionarios ?? current?.funcionarios,
  };
}

/**
 * - `existing`: o GET trouxe uma configuração gravada (ids reais) → salvar é PUT.
 * - `missing`: o comércio ainda não tem configuração → salvar é POST.
 * - `failed`: o GET falhou. Não sabemos se existe configuração, então salvar fica
 *   bloqueado — um POST/PUT às cegas já gravou por cima de dados antes.
 */
type ConfigLoadState = 'existing' | 'missing' | 'failed';

export const CONFIG_LOAD_FAILED_MESSAGE =
  'Não foi possível carregar os horários salvos: o servidor do AgendaAi está com erro nesta tela. ' +
  'Para não apagar o que já está gravado, salvar os horários fica bloqueado até o problema ser corrigido.';

export function useEstablishmentConfig() {
  const { token, userType } = useAuth();
  const [config, setConfig] = useState<ComercioConfiguracao | null>(null);
  const [basicInfo, setBasicInfo] = useState<ComercioConfg | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComercioId, setActiveComercioId] = useState<number | null>(null);
  const [configLoadState, setConfigLoadState] = useState<ConfigLoadState>('missing');

  const loadConfigForComercio = useCallback(async (comercioId: number) => {
    try {
      const configDataRaw = await fetchApi(`/api/ConfigComercio/${comercioId}`, {
        skipToast: true,
      });

      if (isValidConfigResponse(configDataRaw)) {
        const mapped = mapConfigFromApi(configDataRaw, comercioId);
        setConfigLoadState(configExistsOnServer(mapped) ? 'existing' : 'missing');
        setConfig(mapped);
        return;
      }
      setConfigLoadState('missing');
    } catch (err: unknown) {
      // 404 = comércio sem configuração (caso normal). Qualquer outro erro: estado desconhecido.
      if (hasApiStatus(err, 404)) {
        setConfigLoadState('missing');
      } else {
        console.error('Erro ao buscar configurações específicas:', err);
        setConfigLoadState('failed');
      }
    }

    setConfig(createDefaultConfig(comercioId));
  }, []);

  /** `/api/Comercios/Admin` só traz id e nome; os demais campos vêm de `/api/Comercios/{id}`. */
  const loadBasicInfo = useCallback(async (summary: Record<string, unknown>, comercioId: number) => {
    try {
      const detail = await fetchApi(`/api/Comercios/${comercioId}`, { skipToast: true });
      if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        setBasicInfo(mapBasicInfo({ ...summary, ...(detail as Record<string, unknown>) }));
        return;
      }
    } catch (err: unknown) {
      console.error('Erro ao buscar dados do estabelecimento:', err);
    }
    // Sem os dados completos, salvar "Informações" apagaria endereço, telefone etc. no servidor.
    throw new Error('Não foi possível carregar os dados do estabelecimento.');
  }, []);

  const loadData = useCallback(async () => {
    if (!token || (userType !== 'estabelecimento' && userType !== 'profissional')) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const comercios = await fetchAdminComercios(fetchApi);
      const basicDataRaw = comercios[0];

      if (!basicDataRaw?.id) {
        throw new Error('Nenhum comércio encontrado para este usuário.');
      }

      const actualComercioId = basicDataRaw.id;
      setActiveComercioId(actualComercioId);
      await Promise.all([
        loadBasicInfo(basicDataRaw as Record<string, unknown>, actualComercioId),
        loadConfigForComercio(actualComercioId),
      ]);
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível carregar as configurações do estabelecimento.'));
    } finally {
      setIsLoading(false);
    }
  }, [token, userType, loadBasicInfo, loadConfigForComercio]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateConfig = async (newConfig: ComercioConfiguracao) => {
    if (!activeComercioId) {
      setError('ID do comércio não encontrado.');
      return false;
    }

    if (configLoadState === 'failed') {
      throw new Error(CONFIG_LOAD_FAILED_MESSAGE);
    }

    const mergedConfig = mergeConfigState(config, newConfig);

    if (configLoadState === 'missing') {
      await fetchApi('/api/ConfigComercio', {
        method: 'POST',
        body: buildConfigComercioPayload(mergedConfig, activeComercioId, true),
        skipToast: true,
      });
    } else {
      // Ids exatamente como o GET devolveu. Se a API recusar, o erro sobe para a tela.
      await fetchApi(`/api/ConfigComercio/Editar-Atendimento/${activeComercioId}`, {
        method: 'PUT',
        body: buildConfigComercioPayload(mergedConfig, activeComercioId, false),
        skipToast: true,
      });
    }

    await loadConfigForComercio(activeComercioId);
    return true;
  };

  const updateBasicInfo = async (newBasicInfo: ComercioConfg) => {
    if (!activeComercioId) {
      setError('ID do comércio não encontrado.');
      return false;
    }

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
      body: formData,
      skipToast: true,
    });

    setBasicInfo(newBasicInfo);
    return true;
  };

  return {
    config,
    basicInfo,
    activeComercioId,
    isLoading,
    error,
    configLoadFailed: configLoadState === 'failed',
    updateConfig,
    updateBasicInfo,
    reload: loadData,
  };
}
