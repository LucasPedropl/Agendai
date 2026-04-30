import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAppointmentForm } from '../hooks/useAppointmentForm';
import { Loader2 } from 'lucide-react';

interface AppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: string;
  initialTime?: string;
}

export function AppointmentForm({ onSuccess, onCancel, initialData, initialTime }: AppointmentFormProps) {
  const { 
    formState, 
    setters, 
    options, 
    isLoadingOptions, 
    isSubmitting, 
    fetchOptions, 
    handleSubmit 
  } = useAppointmentForm(onSuccess);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (initialData) setters.setData(initialData);
    if (initialTime) setters.setHorario(initialTime);
  }, [initialData, initialTime, setters]);

  if (isLoadingOptions) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Carregando opções...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="data">Data</label>
          <Input 
            id="data" 
            type="date"
            required 
            value={formState.data} 
            onChange={(e) => setters.setData(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="horario">Horário</label>
          <Input 
            id="horario" 
            type="time"
            required 
            value={formState.horario} 
            onChange={(e) => setters.setHorario(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="idUsuario">Cliente</label>
        <SearchableSelect 
          options={options.clientesOptions}
          value={formState.idUsuario}
          onChange={setters.setIdUsuario}
          placeholder="Selecione um cliente..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="idProssional">Profissional</label>
        <SearchableSelect 
          options={options.profissionaisOptions}
          value={formState.idProssional}
          onChange={setters.setIdProssional}
          placeholder="Selecione um profissional..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="idServico">Serviço</label>
        <SearchableSelect 
          options={options.servicosOptions}
          value={formState.idServico}
          onChange={setters.setIdServico}
          placeholder="Selecione um serviço..."
        />
      </div>

      <div className="pt-4 flex justify-end gap-3">
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : 'Salvar Agendamento'}
        </Button>
      </div>
    </form>
  );
}
