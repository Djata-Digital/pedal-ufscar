import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Bike,
  CheckCircle2,
  Clock3,
  Users,
  Wrench,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { api } from '../api/api';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface DashboardStats {
  users: {
    total: number;
    pending: number;
    approved: number;
  };

  equipments: {
    total: number;
    bikes: number;
    availableBikes: number;
    loanedBikes: number;
    maintenanceBikes: number;
  };

  loans: {
    total: number;
    active: number;
    returned: number;
    late: number;
  };

  maintenance: {
    total: number;
    active: number;
    finished: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      setLoading(true);

      const response = await api.get('/dashboard/stats');

      setStats(response.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const userChartData = [
    {
      name: 'Aprovados',
      value: stats?.users.approved || 0,
    },
    {
      name: 'Pendentes',
      value: stats?.users.pending || 0,
    },
  ];

  const equipmentChartData = [
    {
      name: 'Disponíveis',
      value: stats?.equipments.availableBikes || 0,
    },
    {
      name: 'Emprestadas',
      value: stats?.equipments.loanedBikes || 0,
    },
    {
      name: 'Manutenção',
      value: stats?.equipments.maintenanceBikes || 0,
    },
  ];

  const loanChartData = [
    {
      name: 'Ativos',
      value: stats?.loans.active || 0,
    },
    {
      name: 'Devolvidos',
      value: stats?.loans.returned || 0,
    },
    {
      name: 'Atrasos',
      value: stats?.loans.late || 0,
    },
  ];

  const maintenanceChartData = [
    {
      name: 'Em andamento',
      value: stats?.maintenance.active || 0,
    },
    {
      name: 'Finalizadas',
      value: stats?.maintenance.finished || 0,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-lg font-semibold text-slate-500">
            Carregando dashboard...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Visão geral do sistema PEDAL-UFSCar.
            </p>
          </div>

          <button
            onClick={loadStats}
            className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700"
          >
            Atualizar dados
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Usuários"
            value={stats?.users.total || 0}
            subtitle={`${stats?.users.approved || 0} aprovados`}
            icon={<Users size={28} />}
            color="blue"
          />

          <StatCard
            title="Pendentes"
            value={stats?.users.pending || 0}
            subtitle="Aguardando aprovação"
            icon={<Clock3 size={28} />}
            color="amber"
          />

          <StatCard
            title="Bicicletas"
            value={stats?.equipments.bikes || 0}
            subtitle={`${stats?.equipments.availableBikes || 0} disponíveis`}
            icon={<Bike size={28} />}
            color="green"
          />

          <StatCard
            title="Emprestadas"
            value={stats?.equipments.loanedBikes || 0}
            subtitle="Atualmente em uso"
            icon={<Bike size={28} />}
            color="indigo"
          />

          <StatCard
            title="Empréstimos"
            value={stats?.loans.total || 0}
            subtitle={`${stats?.loans.active || 0} ativos`}
            icon={<CheckCircle2 size={28} />}
            color="emerald"
          />

          <StatCard
            title="Atrasos"
            value={stats?.loans.late || 0}
            subtitle="Precisam de atenção"
            icon={<Clock3 size={28} />}
            color="red"
          />

          <StatCard
            title="Devolvidos"
            value={stats?.loans.returned || 0}
            subtitle="Finalizados"
            icon={<CheckCircle2 size={28} />}
            color="cyan"
          />

          <StatCard
            title="Bikes em manutenção"
            value={stats?.equipments.maintenanceBikes || 0}
            subtitle="Bikes indisponíveis"
            icon={<Wrench size={28} />}
            color="orange"
          />

          <StatCard
            title="Manutenções"
            value={stats?.maintenance.total || 0}
            subtitle={`${stats?.maintenance.active || 0} em andamento`}
            icon={<Wrench size={28} />}
            color="orange"
          />

          <StatCard
            title="Manut. finalizadas"
            value={stats?.maintenance.finished || 0}
            subtitle="Equipamentos liberados"
            icon={<CheckCircle2 size={28} />}
            color="emerald"
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-4">
          <ChartCard title="Usuários">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={userChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {userChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#2563eb', '#f59e0b'][index]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Bicicletas">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={equipmentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {equipmentChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#16a34a', '#4f46e5', '#f97316'][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Empréstimos">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={loanChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {loanChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#2563eb', '#16a34a', '#dc2626'][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Manutenção">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={maintenanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {maintenanceChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#f97316', '#16a34a'][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color:
    | 'blue'
    | 'amber'
    | 'green'
    | 'indigo'
    | 'emerald'
    | 'red'
    | 'cyan'
    | 'orange';
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-5xl font-black text-slate-900">
            {value}
          </h2>

          <p className="mt-3 text-sm text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60">
      <h2 className="mb-6 text-lg font-black text-slate-900">
        {title}
      </h2>

      {children}
    </div>
  );
}