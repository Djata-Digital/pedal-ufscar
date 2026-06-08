import { useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  ClipboardList,
  Download,
  History,
  Printer,
  RefreshCw,
  Search,
  Users,
  Wrench,
} from 'lucide-react';

import { api } from '../api/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { exportToCsv } from '../utils/exportCsv';

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  async function loadLogs() {
    try {
      setLoading(true);

      const response = await api.get('/audit-logs');

      setLogs(response.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar histórico.',
      );
    } finally {
      setLoading(false);
    }
  }

  const actionOptions = useMemo(() => {
    const uniqueActions = Array.from(
      new Set(logs.map((log) => log.action)),
    );

    return uniqueActions.sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const text = `
        ${log.userName || ''}
        ${log.action || ''}
        ${log.entity || ''}
        ${log.description || ''}
      `.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesAction =
        actionFilter === 'all' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      users: logs.filter((log) => log.entity === 'users').length,
      loans: logs.filter((log) => log.entity === 'loans').length,
      maintenance: logs.filter((log) => log.entity === 'maintenance').length,
    };
  }, [logs]);

  function handleExportCsv() {
    exportToCsv(
      'historico-auditoria-pedal-ufscar.csv',
      filteredLogs.map((log) => ({
        Data: formatDate(log.createdAt),
        Usuario: log.userName || 'Sistema',
        Acao: translateAction(log.action),
        Modulo: translateEntity(log.entity),
        Descricao: log.description,
      })),
    );
  }

  function handlePrint() {
    window.print();
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <DashboardLayout>
      <div className="print-area">
        <div className="print-only hidden">
          <h1>Histórico de Auditoria - PEDAL UFSCar</h1>
          <p>Emitido em: {new Date().toLocaleString('pt-BR')}</p>
          <hr />
        </div>

        <div className="no-print mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-950/20">
              <History size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Histórico
              </h1>

              <p className="mt-1 text-slate-500">
                Acompanhe as principais ações realizadas no sistema.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
            >
              <Download size={18} />
              Exportar CSV
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white shadow-lg shadow-green-950/20 transition hover:bg-green-700"
            >
              <Printer size={18} />
              Imprimir / PDF
            </button>

            <button
              onClick={loadLogs}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total de registros"
            value={stats.total}
            icon={<History size={24} />}
            color="bg-slate-900"
          />

          <StatsCard
            title="Ações de usuários"
            value={stats.users}
            icon={<Users size={24} />}
            color="bg-blue-600"
          />

          <StatsCard
            title="Ações de empréstimos"
            value={stats.loans}
            icon={<ClipboardList size={24} />}
            color="bg-indigo-600"
          />

          <StatsCard
            title="Ações de manutenção"
            value={stats.maintenance}
            icon={<Wrench size={24} />}
            color="bg-orange-500"
          />
        </div>

        <div className="no-print mb-6 grid gap-4 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/60 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ação, módulo ou descrição..."
              className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">Todas as ações</option>

            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {translateAction(action)}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/60 print-card">
          {loading ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Carregando histórico...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Nenhum registro encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Data
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Usuário
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Ação
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Módulo
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Descrição
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(log.createdAt)}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {log.userName || 'Sistema'}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {translateAction(log.action)}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {translateEntity(log.entity)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60 print-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-5xl font-black text-slate-900">
            {value}
          </h2>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function translateAction(action: string) {
  const map: Record<string, string> = {
    CREATE_USER: 'Usuário criado',
    APPROVE_USER: 'Usuário aprovado',
    SUSPEND_USER: 'Usuário suspenso',
    BLOCK_USER: 'Usuário bloqueado',
    CANCEL_USER: 'Usuário cancelado',

    CREATE_EQUIPMENT: 'Equipamento criado',

    CREATE_LOAN: 'Empréstimo criado',
    RETURN_LOAN: 'Devolução registrada',

    CREATE_MAINTENANCE: 'Manutenção criada',
    FINISH_MAINTENANCE: 'Manutenção finalizada',
  };

  return map[action] || action;
}

function translateEntity(entity: string) {
  const map: Record<string, string> = {
    users: 'Usuários',
    equipments: 'Equipamentos',
    loans: 'Empréstimos',
    maintenance: 'Manutenção',
  };

  return map[entity] || entity;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}