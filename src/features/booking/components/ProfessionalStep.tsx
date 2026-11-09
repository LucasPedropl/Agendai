import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BookingOutletContext } from './BookingLayout';
import { Sparkles, Star, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'motion/react';
import { Profissional } from '../types';

export function ProfessionalStep() {
  const { comercioId, servicos, profissionais, isLoading } =
    useOutletContext<BookingOutletContext>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const servicoId = searchParams.get('servico');

  // Redireciona para o passo de serviço se o parâmetro for inválido ou ausente
  if (!isLoading && (!servicoId || !servicos.some((s) => String(s.id) === servicoId))) {
    navigate(`/app/estabelecimento/${comercioId}`, { replace: true });
    return null;
  }

  const handleSelectProfessional = (prof: Profissional | null) => {
    const profParam = prof ? String(prof.id) : 'qualquer';
    navigate(`/app/estabelecimento/${comercioId}/horario?servico=${servicoId}&profissional=${profParam}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-10 w-64 mx-auto rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Quem vai te atender?</h3>
        <p className="text-muted-foreground">
          Selecione seu profissional preferido ou deixe conosco para o melhor horário.
        </p>
      </div>

      {profissionais.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">
            Este estabelecimento ainda não tem profissionais disponíveis para agendamento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Qualquer Profissional */}
          <button
            type="button"
            onClick={() => handleSelectProfessional(null)}
            className="flex flex-col items-center p-8 bg-primary/5 border-2 border-primary/20 rounded-3xl hover:bg-primary/10 hover:border-primary transition-all group cursor-pointer"
          >
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
              <Sparkles className="w-10 h-10" />
            </div>
            <h4 className="font-bold text-lg">Qualquer Profissional</h4>
            <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
              Iremos selecionar o melhor horário disponível entre os profissionais da equipe.
            </p>
          </button>

          {/* Cards: Profissionais individuais */}
          {profissionais.map((prof) => (
            <button
              key={prof.id}
              type="button"
              onClick={() => handleSelectProfessional(prof)}
              className="flex flex-col items-center p-8 bg-card border border-border rounded-3xl hover:border-primary hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-20 h-20 bg-accent text-primary rounded-full flex items-center justify-center mb-4 text-2xl font-bold group-hover:scale-110 transition-transform">
                {prof.nome.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-bold text-lg">{prof.nome}</h4>
              <div className="flex items-center gap-1 mt-2 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold">5.0</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Botões de Navegação */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 border-t border-border mt-12">
        <Button
          variant="outline"
          onClick={() => navigate(`/app/estabelecimento/${comercioId}`)}
          className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar aos Serviços
        </Button>
        <Link to="/app">
          <Button
            variant="ghost"
            className="w-full sm:w-auto h-12 px-8 rounded-xl text-muted-foreground hover:text-destructive"
          >
            Sair e Escolher outra Loja
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
