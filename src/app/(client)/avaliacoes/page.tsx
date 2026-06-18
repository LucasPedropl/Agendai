import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useClientDashboard } from '@/hooks/useClientDashboard';
import { useAuth } from '@/contexts/AuthContext';
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
  const { getAvaliacoes, isLoading } = useClientDashboard();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getAvaliacoes(user?.id ? String(user.id) : 'demo-user-id');
      setReviews(Array.isArray(data) ? data : []);
    };
    load();
  }, [user?.id, getAvaliacoes]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Minhas Avaliações"
        description="Veja o que você achou dos serviços realizados."
      />

      {isLoading ? (
        <PageLoader label="Carregando avaliações..." />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nenhuma avaliação encontrada"
          description="Após concluir um serviço, você poderá avaliar sua experiência aqui."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6 hover:border-primary/20 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{review.servico}</h3>
                  <p className="text-sm text-muted-foreground">com {review.profissional}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(review.dataServico).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= review.nota ? 'text-amber-400 fill-amber-400' : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comentario && (
                <p className="text-foreground/80 italic border-l-2 border-primary/30 pl-4">
                  &ldquo;{review.comentario}&rdquo;
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
