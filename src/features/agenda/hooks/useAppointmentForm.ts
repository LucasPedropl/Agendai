import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useComercioId } from '@/hooks/useComercioId';

interface Option {
  value: string;
  label: string;
}

export function useAppointmentForm(onSuccess?: () => void) {
  const { token } = useAuth();
  const { comercioId } = useComercioId();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Form state
  const [idProssional, setIdProssional] = useState('');
  const [idUsuario, setIdUsuario] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [idServico, setIdServico] = useState('');
  const [observacao, setObservacao] = useState('');

  // Options for selects
  const [clientesOptions, setClientesOptions] = useState<Option[]>([]);
  const [profissionaisOptions, setProfissionaisOptions] = useState<Option[]>([]);
  const [servicosOptions, setServicosOptions] = useState<Option[]>([]);

  const fetchOptions = useCallback(async () => {
    if (!token || !comercioId) return;

    setIsLoadingOptions(true);

    try {
      const listOpts = { skipToast: true, notFoundAsEmpty: true } as RequestInit & {
        skipToast?: boolean;
        notFoundAsEmpty?: boolean;
      };

      const [servicosData, profissionaisData, clientesData] = await Promise.all([
        fetchApi(`/api/Servicos/Todos/${comercioId}`, { skipToast: true } as RequestInit),
        fetchApi(`/api/ComercioUsuarios/Profissionais/${comercioId}`, listOpts),
        fetchApi(`/api/ComercioUsuarios/Clientes/${comercioId}`, listOpts),
      ]);

      // Process Services
      if (Array.isArray(servicosData)) {
        setServicosOptions(servicosData.map(s => ({ value: String(s.id), label: s.nome })));
      }

      // Process Professionals
      if (Array.isArray(profissionaisData)) {
        setProfissionaisOptions(
          profissionaisData
            .filter(p => (p.status || '').toLowerCase() === 'ativo')
            .map(p => ({ value: String(p.id || p.Id), label: p.nome || p.Nome }))
        );
      }

      // Process Clients
      if (Array.isArray(clientesData)) {
        const options = clientesData
          .filter(c => (c.status || '').toLowerCase() === 'ativo')
          .map(c => {
            const id = c.id || c.Id || c.usuarioId || c.UsuarioId || c.idUsuario;
            const nome = c.nome || c.Nome || c.userName || c.UserName || "Cliente sem nome";
            return { value: id ? String(id) : 'undefined', label: String(nome) };
          })
          .filter(opt => opt.value !== 'undefined');
        setClientesOptions(options);
      }
    } catch (err) {
      console.error("Erro ao buscar opções para o formulário de agendamento:", err);
      error("Erro ao carregar dados do formulário");
    } finally {
      setIsLoadingOptions(false);
    }
  }, [token, comercioId, error]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!idUsuario || idUsuario === 'undefined' || !idProssional || !idServico || !data || !horario) {
      error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!comercioId) {
      error('Comércio não identificado');
      return;
    }

    setIsSubmitting(true);

    try {
      const dataIso = new Date(data).toISOString();
      const horarioComSegundos = horario.length === 5 ? `${horario}:00` : horario;

      const payload = {
        idProssional,
        idUsuario,
        data: dataIso,
        horario: horarioComSegundos,
        idServico: Number(idServico),
        observacao,
      };

      // Rota real da API: POST /api/Agenda/Comercio-Agendar (sem {id} na URL)
      await fetchApi('/api/Agenda/Comercio-Agendar', {
        method: 'POST',
        body: payload,
        skipToast: true,
      } as RequestInit);

      success("Agendamento cadastrado com sucesso!");
      resetForm();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Erro ao cadastrar agendamento:", err);
      error("Erro ao cadastrar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIdProssional('');
    setIdUsuario('');
    setData('');
    setHorario('');
    setIdServico('');
    setObservacao('');
  };

  const formState = useMemo(() => ({ 
    idProssional, idUsuario, data, horario, idServico, observacao 
  }), [idProssional, idUsuario, data, horario, idServico, observacao]);

  const setters = useMemo(() => ({ 
    setIdProssional, setIdUsuario, setData, setHorario, setIdServico, setObservacao 
  }), []);

  const options = useMemo(() => ({ 
    clientesOptions, profissionaisOptions, servicosOptions 
  }), [clientesOptions, profissionaisOptions, servicosOptions]);

  return {
    formState,
    setters,
    options,
    isLoadingOptions,
    isSubmitting,
    fetchOptions,
    handleSubmit,
    resetForm
  };
}
