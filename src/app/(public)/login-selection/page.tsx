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
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Como você deseja entrar?
        </h1>
        <p className="mt-3 text-muted-foreground">Selecione o seu perfil para continuar</p>
      </div>

      <div className="grid w-full gap-5 md:grid-cols-3">
        {profiles.map((profile, index) => (
          <motion.div
            key={profile.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={profile.to} className="group block h-full">
              <Card className={`h-full p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 bg-gradient-to-br ${profile.gradient}`}>
                <CardHeader className="text-center p-0">
                  <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${profile.iconBg}`}>
                    <profile.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl mb-3">{profile.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {profile.description}
                  </CardDescription>
                  <div className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
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
