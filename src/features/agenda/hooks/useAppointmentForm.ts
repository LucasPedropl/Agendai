import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface Option {
  value: string;
  label: string;
}

export function useAppointmentForm(onSuccess?: () => void) {
  const { token, user } = useAuth();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Form state
  const [idProssional, setIdProssional] = useState('');
  const [idUsuario, setIdUsuario] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [idServico, setIdServico] = useState('');

  // Options for selects
  const [clientesOptions, setClientesOptions] = useState<Option[]>([]);
  const [profissionaisOptions, setProfissionaisOptions] = useState<Option[]>([]);
  const [servicosOptions, setServicosOptions] = useState<Option[]>([]);

  const fetchOptions = useCallback(async () => {
    if (!token || !user) return;
    
    setIsLoadingOptions(true);
    const commerceId = (user as any)?.id || 1;
    
    try {
      // Parallel fetch for better performance
      const [servicosData, profissionaisData, clientesData] = await Promise.all([
        fetchApi(`/api/Servicos/Todos/${commerceId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          skipToast: true
        } as any),
        fetchApi(`/api/ComercioUsuarios/Profissionais/${commerceId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          skipToast: true
        } as any),
        fetchApi(`/api/ComercioUsuarios/Clientes/${commerceId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          skipToast: true
        } as any)
      ]);

      // Process Services
      if (Array.isArray(servicosData)) {
        setServicosOptions(servicosData.map(s => ({ value: String(s.id), label: s.nome })));
      }

      // Process Professionals
      if (Array.isArray(profissionaisData)) {
        setProfissionaisOptions(profissionaisData.map(p => ({ value: String(p.id || p.Id), label: p.nome || p.Nome })));
      }

      // Process Clients
      if (Array.isArray(clientesData)) {
        const options = clientesData
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
  }, [token, user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!idUsuario || idUsuario === 'undefined' || !idProssional || !idServico || !data || !horario) {
      error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataIso = new Date(data).toISOString();
      const horarioComSegundos = horario.length === 5 ? `${horario}:00` : horario;

      const payload = {
        IdProssional: idProssional,
        IdUsuario: idUsuario,
        Data: dataIso,
        Horario: horarioComSegundos,
        IdServico: Number(idServico)
      };

      await fetchApi('/api/Agenda', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        skipToast: true
      } as any);

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
  };

  const formState = useMemo(() => ({ 
    idProssional, idUsuario, data, horario, idServico 
  }), [idProssional, idUsuario, data, horario, idServico]);

  const setters = useMemo(() => ({ 
    setIdProssional, setIdUsuario, setData, setHorario, setIdServico 
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
