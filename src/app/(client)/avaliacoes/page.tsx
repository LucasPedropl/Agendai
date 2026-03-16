import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useClientDashboard } from '@/hooks/useClientDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientAvaliacoesPage() {
  const { user } = useAuth();
  const { getAvaliacoes, isLoading } = useClientDashboard();
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    loadAvaliacoes();
  }, [user]);

  const loadAvaliacoes = async () => {
    if (user?.id) {
      const data = await getAvaliacoes(user.id);
      setReviews(data);
    } else {
      // For demo mode
      const data = await getAvaliacoes('demo-user-id');
      setReviews(data);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-blue-600" />
          Minhas Avaliações
        </h1>
        <p className="text-sm text-slate-500 mt-1">Veja o que você achou dos serviços.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-lg border border-slate-200">
          <Star className="h-12 w-12 text-slate-300 mb-4" />
          <p>Nenhuma avaliação encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const data = new Date(review.dataServico);
            return (
              <div key={review.id} className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{review.servico}</h3>
                    <p className="text-sm text-slate-500">com {review.profissional}</p>
                    <p className="text-sm text-slate-500 mt-1">{data.toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= review.nota ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 italic">"{review.comentario}"</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
