import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const data = [
  { name: 'Jan', receita: 4000, despesa: 2400 },
  { name: 'Fev', receita: 3000, despesa: 1398 },
  { name: 'Mar', receita: 2000, despesa: 9800 },
  { name: 'Abr', receita: 2780, despesa: 3908 },
  { name: 'Mai', receita: 1890, despesa: 4800 },
  { name: 'Jun', receita: 2390, despesa: 3800 },
];

const pieData = [
  { name: 'Receitas', value: 400 },
  { name: 'Despesas', value: 300 },
];

const COLORS = ['#4f46e5', '#ef4444'];

export default function AdminRevenueVsExpensePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Receita vs Despesa</h1>
        <p className="text-slate-500">Acompanhe a saúde financeira do seu negócio em tempo real</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Receita Total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">R$ 18.450,00</p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -4.2%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Despesa Total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">R$ 9.230,00</p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 text-white rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-indigo-100">Saldo Líquido</p>
          <p className="text-2xl font-bold mt-1">R$ 9.220,00</p>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Comparativo Mensal</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="receita" name="Receita" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição de Gastos</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Line Chart */}
      <Card className="p-6 border-none shadow-sm bg-white">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Tendência de Lucratividade</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
