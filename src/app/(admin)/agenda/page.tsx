import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function AdminAgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda</h1>
          <p className="text-gray-500">Gerencie seus agendamentos diários.</p>
        </div>
        <Button className="w-full sm:w-auto">
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
            {hours.map((hour) => (
              <div key={hour} className="flex min-h-[80px] border-t border-gray-100 pt-4">
                <div className="w-16 flex-shrink-0 text-right text-sm font-medium text-gray-500 pr-4">
                  {hour}:00
                </div>
                <div className="flex-1 space-y-2">
                  {/* Mock appointments */}
                  {hour === 10 && (
                    <div className="rounded-md bg-indigo-50 border border-indigo-100 p-3 shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-indigo-900">Corte de Cabelo</p>
                          <p className="text-xs text-indigo-700">João Silva • com Pedro</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Confirmado
                        </span>
                      </div>
                    </div>
                  )}
                  {hour === 14 && (
                    <div className="rounded-md bg-amber-50 border border-amber-100 p-3 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Barba</p>
                          <p className="text-xs text-amber-700">Carlos Mendes • com Lucas</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Pendente
                        </span>
                      </div>
                    </div>
                  )}
                  {hour !== 10 && hour !== 14 && (
                    <div className="h-full w-full rounded-md border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-xs text-gray-400">+ Adicionar</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
