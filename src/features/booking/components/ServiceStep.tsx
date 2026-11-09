import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { BookingOutletContext } from './BookingLayout';
import { Clock, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'motion/react';
import { Servico } from '../types';

export function ServiceStep() {
  const { comercioId, estabelecimento, servicos, isLoading } =
    useOutletContext<BookingOutletContext>();
  const navigate = useNavigate();

  const handleSelectService = (service: Servico) => {
    navigate(`/app/estabelecimento/${comercioId}/profissional?servico=${service.id}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Skeleton className="h-64 md:col-span-1 rounded-3xl" />
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const estName = estabelecimento?.nome || 'Estabelecimento';
  const estInitial = estName.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card Informativo do Estabelecimento */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border p-6 rounded-3xl sticky top-6 shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl font-bold text-primary">{estInitial}</span>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">{estName}</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {estabelecimento?.endereco || 'Endereço não informado'}
            </p>
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sobre</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {estabelecimento?.descricao || 'Bem-vindo ao nosso espaço de cuidado e beleza.'}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Serviços */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-bold">Escolha um serviço</h3>
          {servicos.length === 0 ? (
            <div className="p-8 text-center bg-card border border-border rounded-2xl text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhum serviço disponível para agendamento no momento.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {servicos.map((serv) => {
                // Sem imagem/ícone por enquanto (decisão do Pedro, 09/11/2026): a API
                // devolve o placeholder "string" em `icone`.
                return (
                  <button
                    key={serv.id}
                    onClick={() => handleSelectService(serv)}
                    className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/[0.02] transition-all text-left group"
                  >
                    <div className="flex gap-4 items-center">
                      <div>
                        <h4 className="font-bold text-lg">{serv.nome}</h4>
                        {serv.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                            {serv.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {serv.duracao}
                          </span>
                          <span className="font-bold text-foreground">
                            R$ {serv.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Botões de Navegação */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 border-t border-border mt-12">
        <Button
          variant="outline"
          onClick={() => navigate('/app')}
          className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar às Lojas
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
