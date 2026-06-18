import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { fetchAdminComercios } from '@/lib/apiHelpers';
import {
  buildConfigComercioPayload,
  createDefaultConfig,
  isValidConfigResponse,
  mapConfigFromApi,
  mergeConfigIdsFromCache,
  saveConfigWithIdDiscovery,
  serverConfigExists,
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

export function useEstablishmentConfig() {
  const { token, userType } = useAuth();
  const [config, setConfig] = useState<ComercioConfiguracao | null>(null);
  const [basicInfo, setBasicInfo] = useState<ComercioConfg | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComercioId, setActiveComercioId] = useState<number | null>(null);
  const [hasServerConfig, setHasServerConfig] = useState(false);

  const loadConfigForComercio = useCallback(async (comercioId: number) => {
    try {
      const configDataRaw = await fetchApi(`/api/ConfigComercio/${comercioId}`, {
        skipToast: true,
      });

      if (isValidConfigResponse(configDataRaw) && serverConfigExists(configDataRaw)) {
        setHasServerConfig(true);
        setConfig(mergeConfigIdsFromCache(mapConfigFromApi(configDataRaw, comercioId), comercioId));
        return;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (!message.includes('404')) {
        console.error('Erro ao buscar configurações específicas:', err);
      }
    }

    setHasServerConfig(false);
    setConfig(createDefaultConfig(comercioId));
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
      setBasicInfo(mapBasicInfo(basicDataRaw as Record<string, unknown>));
      await loadConfigForComercio(actualComercioId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, [token, userType, loadConfigForComercio]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateConfig = async (newConfig: ComercioConfiguracao) => {
    if (!activeComercioId) {
      setError('ID do comércio não encontrado.');
      return false;
    }

    const mergedConfig = mergeConfigState(config, newConfig);
    const isNew = !hasServerConfig;

    if (isNew) {
      const payload = buildConfigComercioPayload(mergedConfig, activeComercioId, true);
      try {
        await fetchApi('/api/ConfigComercio', {
          method: 'POST',
          body: payload,
          skipToast: true,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        if (!message.includes('400')) throw err;
      }
      setHasServerConfig(true);
    } else {
      await saveConfigWithIdDiscovery(fetchApi, activeComercioId, mergedConfig);
    }

    setHasServerConfig(true);
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
    updateConfig,
    updateBasicInfo,
    reload: loadData,
  };
}
