import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClienteAvaliacoes } from '@/hooks/useClienteQueries';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/page-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';

interface Review {
  id: string | number;
  servico: string;
  profissional: string;
  dataServico: string;
  nota: number;
  comentario: string;
}

export default function ClientAvaliacoesPage() {
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : undefined;
  const { data: reviews = [], isPending: isLoading } = useClienteAvaliacoes(userId);
  const reviewsList = reviews as Review[];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Minhas Avaliações"
        description="Veja o que você achou dos serviços realizados."
      />

      {isLoading ? (
        <PageLoader label="Carregando avaliações..." />
      ) : reviewsList.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nenhuma avaliação encontrada"
          description="Após concluir um serviço, você poderá avaliar sua experiência aqui."
        />
      ) : (
        <div className="space-y-4">
          {reviewsList.map((review) => (
            <Card key={review.id} className="p-6 hover:border-primary/20 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{review.servico}</h3>
                  <p className="text-sm text-muted-foreground">
                    Profissional: {review.profissional}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.dataServico).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.nota ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comentario && (
                <p className="mt-4 text-sm text-muted-foreground border-t pt-4">
                  {review.comentario}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
