'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminAgendaPage() {
  const { token, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [idProssional, setIdProssional] = useState('');
  const [idUsuario, setIdUsuario] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [idServico, setIdServico] = useState('');

  // Options for selects
  const [clientesOptions, setClientesOptions] = useState<{value: string, label: string}[]>([]);
  const [profissionaisOptions, setProfissionaisOptions] = useState<{value: string, label: string}[]>([]);
  const [servicosOptions, setServicosOptions] = useState<{value: string, label: string}[]>([]);

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00

  useEffect(() => {
    // Fetch data for selects when modal opens
    if (isModalOpen) {
      const fetchSelectData = async () => {
        const commerceId = (user as any)?.id || 1;
        
        try {
          // Fetch real services
          const servicosData = await fetchApi(`/api/Servicos/Todos/${commerceId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            skipToast: true
          } as any);
          
          if (Array.isArray(servicosData)) {
            setServicosOptions(servicosData.map(s => ({ value: String(s.id), label: s.nome })));
          } else {
            setServicosOptions([]);
          }
        } catch (err) {
          console.error("Erro ao buscar serviços para o select:", err);
          setServicosOptions([]);
        }

        try {
          // Fetch real professionals
          const profissionaisData = await fetchApi(`/api/ComercioUsuarios/Profissionais/${commerceId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            skipToast: true
          } as any);
          
          if (Array.isArray(profissionaisData)) {
            setProfissionaisOptions(profissionaisData.map(p => ({ value: String(p.id), label: p.nome })));
          } else {
            setProfissionaisOptions([]);
          }
        } catch (err) {
          console.error("Erro ao buscar profissionais para o select:", err);
          setProfissionaisOptions([]);
        }

        try {
          // Fetch real clients
          const clientesData = await fetchApi(`/api/ComercioUsuarios/Clientes/${commerceId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            skipToast: true
          } as any);
          
          if (Array.isArray(clientesData)) {
            setClientesOptions(clientesData.map(c => ({ value: String(c.id), label: c.nome })));
          } else {
            setClientesOptions([]);
          }
        } catch (err) {
          console.error("Erro ao buscar clientes para o select:", err);
          setClientesOptions([]);
        }
      };

      fetchSelectData();
    }
  }, [isModalOpen, token, user]);

  const handleCreateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Tentativa de agendamento:', { idUsuario, idProssional, idServico, data, horario });

    if (!idUsuario || !idProssional || !idServico || !data || !horario) {
      console.error('Campos obrigatórios ausentes:', {
        cliente: !idUsuario,
        profissional: !idProssional,
        servico: !idServico,
        data: !data,
        horario: !horario
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a valid ISO date string from the date input
      const dataIso = new Date(data).toISOString();
      const commerceId = (user as any)?.id || 1;

      const payload = {
        idProssional: idProssional, // Spelling as per user curl
        idProfissional: idProssional, // Correct spelling just in case
        idUsuario: idUsuario,
        idComercio: commerceId, // Likely required as in other endpoints
        comercioId: commerceId, // Alternative naming
        data: dataIso,
        horario: horario,
        idServico: Number(idServico)
      };

      console.log('Enviando Payload:', payload);

      await fetchApi('/api/Agenda', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        skipToast: true
      } as any);

      setIsModalOpen(false);
      setIdProssional('');
      setIdUsuario('');
      setData('');
      setHorario('');
      setIdServico('');
      // TODO: Refresh list of agendamentos
    } catch (err: any) {
      console.error("Erro ao cadastrar agendamento:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda</h1>
          <p className="text-gray-500">Gerencie seus agendamentos diários.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Hoje
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hours.map((hour) => {
              const hourAppointments = agendamentos.filter(a => new Date(a.data).getHours() === hour);
              
              return (
                <div key={hour} className="flex min-h-[80px] border-t border-gray-100 pt-4">
                  <div className="w-16 flex-shrink-0 text-right text-sm font-medium text-gray-500 pr-4">
                    {hour}:00
                  </div>
                  <div className="flex-1 space-y-2">
                    {hourAppointments.length > 0 ? (
                      hourAppointments.map((agendamento, idx) => (
                        <div key={idx} className="rounded-md bg-indigo-50 border border-indigo-100 p-3 shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-semibold text-indigo-900">{agendamento.servico}</p>
                              <p className="text-xs text-indigo-700">{agendamento.cliente} • com {agendamento.profissional}</p>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              agendamento.status === 'confirmado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {agendamento.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div 
                        className="h-full w-full rounded-md border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => {
                          setHorario(`${hour.toString().padStart(2, '0')}:00`);
                          setData(currentDate.toISOString().split('T')[0]);
                          setIsModalOpen(true);
                        }}
                      >
                        <span className="text-xs text-gray-400">+ Adicionar</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Agendamento">
        <form onSubmit={handleCreateAgenda} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="data">Data</label>
              <Input 
                id="data" 
                type="date"
                required 
                value={data} 
                onChange={(e) => setData(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="horario">Horário</label>
              <Input 
                id="horario" 
                type="time"
                required 
                value={horario} 
                onChange={(e) => setHorario(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="idUsuario">Cliente</label>
            <SearchableSelect 
              options={clientesOptions}
              value={idUsuario}
              onChange={setIdUsuario}
              placeholder="Selecione um cliente..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="idProssional">Profissional</label>
            <SearchableSelect 
              options={profissionaisOptions}
              value={idProssional}
              onChange={setIdProssional}
              placeholder="Selecione um profissional..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="idServico">Serviço</label>
            <SearchableSelect 
              options={servicosOptions}
              value={idServico}
              onChange={setIdServico}
              placeholder="Selecione um serviço..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
