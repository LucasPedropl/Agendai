import { Link } from 'react-router-dom';
import { User, Store, Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';

const profiles = [
  {
    type: 'cliente',
    to: '/login?type=cliente',
    icon: User,
    title: 'Sou Cliente',
    description: 'Agende serviços, veja seu histórico e gerencie seus favoritos.',
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconBg: 'bg-violet-500/10 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
  },
  {
    type: 'profissional',
    to: '/login?type=profissional',
    icon: Briefcase,
    title: 'Sou Profissional',
    description: 'Gerencie atendimentos, horários e clientes da sua agenda.',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconBg: 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
  },
  {
    type: 'estabelecimento',
    to: '/login?type=estabelecimento',
    icon: Store,
    title: 'Sou Estabelecimento',
    description: 'Gerencie agenda, profissionais, serviços e clientes do negócio.',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconBg: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
  },
];

export default function LoginSelectionPage() {
  return (
    <div className="w-full">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Como você deseja entrar?
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Selecione o seu perfil para continuar
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        {profiles.map((profile, index) => (
          <motion.div
            key={profile.type}
            className="min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={profile.to} className="group block h-full">
              <Card
                className={`h-full bg-gradient-to-br p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 sm:p-6 ${profile.gradient}`}
              >
                <CardHeader className="flex h-full flex-col p-0 text-left sm:text-center">
                  <div className="flex items-start gap-4 sm:flex-col sm:items-center">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 sm:mb-4 sm:h-16 sm:w-16 ${profile.iconBg}`}
                    >
                      <profile.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="mb-1 text-lg sm:mb-3 sm:text-xl">
                        {profile.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {profile.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary opacity-100 transition-opacity sm:mt-6 sm:justify-center sm:opacity-0 sm:group-hover:opacity-100">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
