import { useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  AlertTriangle,
  Bike,
  ClipboardList,
  Download,
  Lock,
  Printer,
  RefreshCw,
  Shield,
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
import { exportToCsv } from '../utils/exportCsv';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  userType: string;
  status: string;
  createdAt: string;

  birthPlace: string | null;
  nationality: string | null;
  racialIdentity: string | null;
  genderIdentity: string | null;
  socialClass: string | null;
}

interface Equipment {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  photoUrl?: string | null;
}

interface Loan {
  id: string;
  user: User;
  equipment: Equipment;
  helmet: Equipment | null;
  lock: Equipment | null;
  loanDate: string;
  expectedReturnDate: string;
  returnDate: string | null;
  status: string;
}

interface MaintenanceRecord {
  id: string;
  equipment: Equipment;
  problemDescription: string;
  solutionDescription: string | null;
  status: string;
  createdAt: string;
  finishedAt: string | null;
}

interface LostReport {
  id: string;
  loan: Loan;
  user: User;
  type: string;
  description: string;
  occurrenceDocumentUrl: string | null;
  adminNotes: string | null;
  status: string;
  createdAt: string;
}

function countByField<T extends Record<string, any>>(
  items: T[],
  field: keyof T,
) {
  const result: Record<string, number> = {};

  items.forEach((item) => {
    const value = item[field] || 'Não informado';
    result[String(value)] = (result[String(value)] || 0) + 1;
  });

  return Object.entries(result).map(([name, value]) => ({
    name,
    value,
  }));
}

export default function ReportsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      setLoading(true);

      const [
        usersResponse,
        equipmentsResponse,
        loansResponse,
        maintenanceResponse,
        lostReportsResponse,
      ] = await Promise.all([
        api.get('/users'),
        api.get('/equipments'),
        api.get('/loans'),
        api.get('/maintenance'),
        api.get('/lost-reports'),
      ]);

      setUsers(usersResponse.data);
      setEquipments(equipmentsResponse.data);
      setLoans(loansResponse.data);
      setMaintenance(maintenanceResponse.data);
      setLostReports(lostReportsResponse.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar relatórios.',
      );
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const bikes = equipments.filter((item) => item.type === 'bike');
    const helmets = equipments.filter((item) => item.type === 'helmet');
    const locks = equipments.filter((item) => item.type === 'lock');

    return {
      usersTotal: users.length,
      usersApproved: users.filter((user) => user.status === 'approved').length,
      usersPending: users.filter((user) => user.status === 'pending').length,
      usersSuspended: users.filter((user) => user.status === 'suspended').length,

      equipmentsTotal: equipments.length,

      bikesTotal: bikes.length,
      bikesAvailable: bikes.filter((item) => item.status === 'available').length,
      bikesLoaned: bikes.filter((item) => item.status === 'loaned').length,
      bikesMaintenance: bikes.filter((item) => item.status === 'maintenance').length,
      bikesLost: bikes.filter((item) => item.status === 'lost').length,
      bikesDamaged: bikes.filter((item) => item.status === 'damaged').length,

      helmetsTotal: helmets.length,
      helmetsAvailable: helmets.filter((item) => item.status === 'available').length,
      helmetsLoaned: helmets.filter((item) => item.status === 'loaned').length,

      locksTotal: locks.length,
      locksAvailable: locks.filter((item) => item.status === 'available').length,
      locksLoaned: locks.filter((item) => item.status === 'loaned').length,

      loansTotal: loans.length,
      loansActive: loans.filter((loan) => loan.status === 'active').length,
      loansReturned: loans.filter((loan) => loan.status === 'returned').length,
      loansLate: loans.filter((loan) => loan.status === 'late').length,
      loansLost: loans.filter((loan) => loan.status === 'lost').length,

      maintenanceTotal: maintenance.length,
      maintenanceActive: maintenance.filter((item) => item.status === 'in_progress').length,
      maintenanceFinished: maintenance.filter((item) => item.status === 'finished').length,

      reportsTotal: lostReports.length,
      reportsPending: lostReports.filter((item) => item.status === 'pending').length,
      reportsReviewed: lostReports.filter((item) => item.status === 'reviewed').length,
      reportsRejected: lostReports.filter((item) => item.status === 'rejected').length,
    };
  }, [users, equipments, loans, maintenance, lostReports]);

  const bikesChartData = [
    { name: 'Disponíveis', value: stats.bikesAvailable },
    { name: 'Emprestadas', value: stats.bikesLoaned },
    { name: 'Manutenção', value: stats.bikesMaintenance },
    { name: 'Perdidas', value: stats.bikesLost },
    { name: 'Danificadas', value: stats.bikesDamaged },
  ];

  const loansChartData = [
    { name: 'Ativos', value: stats.loansActive },
    { name: 'Devolvidos', value: stats.loansReturned },
    { name: 'Atrasados', value: stats.loansLate },
    { name: 'Perdidos', value: stats.loansLost },
  ];

  const usersChartData = [
    { name: 'Aprovados', value: stats.usersApproved },
    { name: 'Pendentes', value: stats.usersPending },
    { name: 'Suspensos', value: stats.usersSuspended },
  ];

  const accessoriesChartData = [
    { name: 'Capacetes disponíveis', value: stats.helmetsAvailable },
    { name: 'Capacetes emprestados', value: stats.helmetsLoaned },
    { name: 'Travas disponíveis', value: stats.locksAvailable },
    { name: 'Travas emprestadas', value: stats.locksLoaned },
  ];

  const reportsChartData = [
    { name: 'Pendentes', value: stats.reportsPending },
    { name: 'Analisadas', value: stats.reportsReviewed },
    { name: 'Rejeitadas', value: stats.reportsRejected },
  ];

  const nationalityChartData = useMemo(
    () => countByField(users, 'nationality'),
    [users],
  );

  const racialChartData = useMemo(
    () => countByField(users, 'racialIdentity'),
    [users],
  );

  const genderChartData = useMemo(
    () => countByField(users, 'genderIdentity'),
    [users],
  );

  const socialClassChartData = useMemo(
    () => countByField(users, 'socialClass'),
    [users],
  );

  function handlePrintReport() {
    window.print();
  }

  function handleExportSummary() {
    exportToCsv('relatorio-geral-pedal-ufscar.csv', [
      { Indicador: 'Usuários cadastrados', Valor: stats.usersTotal },
      { Indicador: 'Usuários aprovados', Valor: stats.usersApproved },
      { Indicador: 'Usuários pendentes', Valor: stats.usersPending },
      { Indicador: 'Usuários suspensos', Valor: stats.usersSuspended },

      { Indicador: 'Equipamentos cadastrados', Valor: stats.equipmentsTotal },

      { Indicador: 'Bicicletas cadastradas', Valor: stats.bikesTotal },
      { Indicador: 'Bicicletas disponíveis', Valor: stats.bikesAvailable },
      { Indicador: 'Bicicletas emprestadas', Valor: stats.bikesLoaned },
      { Indicador: 'Bicicletas em manutenção', Valor: stats.bikesMaintenance },
      { Indicador: 'Bicicletas perdidas', Valor: stats.bikesLost },
      { Indicador: 'Bicicletas danificadas', Valor: stats.bikesDamaged },

      { Indicador: 'Capacetes cadastrados', Valor: stats.helmetsTotal },
      { Indicador: 'Capacetes disponíveis', Valor: stats.helmetsAvailable },
      { Indicador: 'Capacetes emprestados', Valor: stats.helmetsLoaned },

      { Indicador: 'Travas cadastradas', Valor: stats.locksTotal },
      { Indicador: 'Travas disponíveis', Valor: stats.locksAvailable },
      { Indicador: 'Travas emprestadas', Valor: stats.locksLoaned },

      { Indicador: 'Empréstimos totais', Valor: stats.loansTotal },
      { Indicador: 'Empréstimos ativos', Valor: stats.loansActive },
      { Indicador: 'Empréstimos devolvidos', Valor: stats.loansReturned },
      { Indicador: 'Empréstimos atrasados', Valor: stats.loansLate },
      { Indicador: 'Empréstimos perdidos', Valor: stats.loansLost },

      { Indicador: 'Manutenções totais', Valor: stats.maintenanceTotal },
      { Indicador: 'Manutenções em andamento', Valor: stats.maintenanceActive },
      { Indicador: 'Manutenções finalizadas', Valor: stats.maintenanceFinished },

      { Indicador: 'Ocorrências totais', Valor: stats.reportsTotal },
      { Indicador: 'Ocorrências pendentes', Valor: stats.reportsPending },
      { Indicador: 'Ocorrências analisadas', Valor: stats.reportsReviewed },
      { Indicador: 'Ocorrências rejeitadas', Valor: stats.reportsRejected },

      ...nationalityChartData.map((item) => ({
        Indicador: `Nacionalidade - ${item.name}`,
        Valor: item.value,
      })),

      ...racialChartData.map((item) => ({
        Indicador: `Identidade racial - ${item.name}`,
        Valor: item.value,
      })),

      ...genderChartData.map((item) => ({
        Indicador: `Identidade de gênero - ${item.name}`,
        Valor: item.value,
      })),

      ...socialClassChartData.map((item) => ({
        Indicador: `Classe social - ${item.name}`,
        Valor: item.value,
      })),
    ]);
  }

  function handleExportLoans() {
    exportToCsv(
      'relatorio-emprestimos-detalhado-pedal-ufscar.csv',
      loans.map((loan) => ({
        Usuario: loan.user?.fullName || '',
        Email: loan.user?.email || '',
        Bicicleta: loan.equipment?.name || '',
        CodigoBicicleta: loan.equipment?.code || '',
        Capacete: loan.helmet?.name || '',
        CodigoCapacete: loan.helmet?.code || '',
        Trava: loan.lock?.name || '',
        CodigoTrava: loan.lock?.code || '',
        Retirada: formatDate(loan.loanDate),
        Previsao: formatDate(loan.expectedReturnDate),
        Devolucao: loan.returnDate ? formatDate(loan.returnDate) : '',
        Status: translateStatus(loan.status),
      })),
    );
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-lg font-semibold text-slate-500">
            Carregando relatórios...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="print-area">
        <div className="print-only hidden">
          <h1>Relatório Geral - PEDAL UFSCar</h1>
          <p>Emitido em: {new Date().toLocaleString('pt-BR')}</p>
          <hr />
        </div>

        <div className="no-print mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Relatórios
            </h1>

            <p className="mt-2 text-slate-500">
              Visão consolidada dos usuários, bicicletas, capacetes, travas, empréstimos, ocorrências, manutenções e dados demográficos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleExportSummary}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
            >
              <Download size={18} />
              Exportar resumo
            </button>

            <button
              onClick={handleExportLoans}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-700"
            >
              <Download size={18} />
              Exportar empréstimos
            </button>

            <button
              onClick={handlePrintReport}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white shadow-lg shadow-green-950/20 transition hover:bg-green-700"
            >
              <Printer size={18} />
              Imprimir / PDF
            </button>

            <button
              onClick={loadReports}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <ReportCard
            title="Usuários"
            value={stats.usersTotal}
            subtitle={`${stats.usersApproved} aprovados · ${stats.usersPending} pendentes`}
            icon={<Users size={26} />}
            color="bg-blue-600"
          />

          <ReportCard
            title="Bicicletas"
            value={stats.bikesTotal}
            subtitle={`${stats.bikesAvailable} disponíveis · ${stats.bikesLoaned} emprestadas`}
            icon={<Bike size={26} />}
            color="bg-green-600"
          />

          <ReportCard
            title="Capacetes"
            value={stats.helmetsTotal}
            subtitle={`${stats.helmetsAvailable} disponíveis · ${stats.helmetsLoaned} emprestados`}
            icon={<Shield size={26} />}
            color="bg-cyan-600"
          />

          <ReportCard
            title="Travas"
            value={stats.locksTotal}
            subtitle={`${stats.locksAvailable} disponíveis · ${stats.locksLoaned} emprestadas`}
            icon={<Lock size={26} />}
            color="bg-emerald-600"
          />

          <ReportCard
            title="Empréstimos"
            value={stats.loansTotal}
            subtitle={`${stats.loansActive} ativos · ${stats.loansLate} atrasados`}
            icon={<ClipboardList size={26} />}
            color="bg-indigo-600"
          />

          <ReportCard
            title="Ocorrências"
            value={stats.reportsTotal}
            subtitle={`${stats.reportsPending} pendentes`}
            icon={<AlertTriangle size={26} />}
            color="bg-red-600"
          />

          <ReportCard
            title="Manutenções"
            value={stats.maintenanceTotal}
            subtitle={`${stats.maintenanceActive} em andamento`}
            icon={<Wrench size={26} />}
            color="bg-orange-500"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
          <ChartCard title="Usuários">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={usersChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {usersChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#2563eb', '#f59e0b', '#f97316'][index]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Bicicletas">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bikesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {bikesChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#16a34a', '#4f46e5', '#f97316', '#dc2626', '#f59e0b'][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Capacetes e Travas">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={accessoriesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {accessoriesChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#0891b2', '#0e7490', '#059669', '#047857'][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Empréstimos">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={loansChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {loansChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#2563eb', '#16a34a', '#dc2626', '#f97316'][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ocorrências">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={reportsChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {reportsChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#f59e0b', '#16a34a', '#dc2626'][index]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Nacionalidade">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={nationalityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {nationalityChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'][index % 5]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Auto identificação racial">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={racialChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {racialChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'][index % 6]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Auto identificação de gênero">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {genderChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#4f46e5', '#db2777', '#16a34a', '#f59e0b'][index % 4]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Classe social">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={socialClassChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {socialClassChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#0f766e', '#0891b2', '#2563eb', '#7c3aed', '#f59e0b', '#64748b'][index % 6]}
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

function ReportCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60 print-card">
      <div className="flex items-start justify-between gap-3">
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
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60 print-card">
      <h2 className="mb-6 text-lg font-black text-slate-900">
        {title}
      </h2>

      {children}
    </div>
  );
}

function translateStatus(status: string) {
  const map: Record<string, string> = {
    active: 'Ativo',
    returned: 'Devolvido',
    late: 'Atrasado',
    lost: 'Perdido',
    cancelled: 'Cancelado',
    pending: 'Pendente',
    reviewed: 'Analisada',
    rejected: 'Rejeitada',
  };

  return map[status] || status;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}