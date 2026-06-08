import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Bike,
  CheckCircle2,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  User as UserIcon,
  XCircle,
} from 'lucide-react';

import { api } from '../api/api';
import { DashboardLayout } from '../layouts/DashboardLayout';


interface User {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
}

interface Equipment {
  id: string;
  code: string;
  name: string;
  photoUrl: string | null;
}

interface Loan {
  id: string;
  user: User;
  equipment: Equipment;
  status: string;
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

export default function LostReportsPage() {
  const [reports, setReports] = useState<LostReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function loadReports() {
    try {
      setLoading(true);

      const response = await api.get('/lost-reports');

      setReports(response.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar ocorrências.',
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const text = `
        ${report.user?.fullName || ''}
        ${report.user?.email || ''}
        ${report.loan?.equipment?.code || ''}
        ${report.loan?.equipment?.name || ''}
        ${report.type || ''}
        ${report.description || ''}
      `.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  async function reviewReport(report: LostReport) {
    const adminNotes =
      prompt(
        'Observação da análise:',
        'Ocorrência analisada pela equipe responsável.',
      ) || 'Ocorrência analisada pela equipe responsável.';

    try {
      await api.patch(`/lost-reports/${report.id}/review`, {
        adminNotes,
      });

      toast.success('Ocorrência marcada como analisada.');

      await loadReports();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao analisar ocorrência.',
      );
    }
  }

  async function rejectReport(report: LostReport) {
    const adminNotes =
      prompt(
        'Motivo da rejeição:',
        'Ocorrência rejeitada pela equipe responsável.',
      ) || 'Ocorrência rejeitada pela equipe responsável.';

    try {
      await api.patch(`/lost-reports/${report.id}/reject`, {
        adminNotes,
      });

      toast.success('Ocorrência rejeitada.');

      await loadReports();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao rejeitar ocorrência.',
      );
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-950/20">
              <FileText size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Ocorrências
              </h1>

              <p className="mt-1 text-slate-500">
                Analise registros de roubo, furto ou perda de bicicletas.
              </p>
            </div>
          </div>

          <button
            onClick={loadReports}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        <div className="mb-6 grid gap-4 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/60 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuário, bicicleta, tipo ou descrição..."
              className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="reviewed">Analisadas</option>
            <option value="rejected">Rejeitadas</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/60">
          {loading ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Carregando ocorrências...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Nenhuma ocorrência encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Usuário
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Bicicleta
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Descrição
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Documento
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {report.user?.photoUrl ? (
                            <img
                              src={report.user.photoUrl}
                              alt={report.user.fullName}
                              className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                              <UserIcon size={22} />
                            </div>
                          )}

                          <div>
                            <p className="font-bold text-slate-900">
                              {report.user?.fullName}
                            </p>

                            <p className="text-xs text-slate-400">
                              {report.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {report.loan?.equipment?.photoUrl ? (
                            <img
                              src={report.loan.equipment.photoUrl}
                              alt={report.loan.equipment.name}
                              className="h-12 w-16 rounded-2xl object-cover ring-2 ring-slate-100"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                              <Bike size={22} />
                            </div>
                          )}

                          <div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {report.loan?.equipment?.code}
                            </span>

                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              {report.loan?.equipment?.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                          {translateType(report.type)}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {report.description}
                      </td>

                      <td className="px-6 py-5 text-sm">
                        {report.occurrenceDocumentUrl ? (
                          <a
                            href={report.occurrenceDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                          >
                            <ExternalLink size={15} />
                            Ver documento
                          </a>
                        ) : (
                          <span className="text-slate-400">
                            Não enviado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={report.status} />
                      </td>

                      <td className="px-6 py-5">
                        {report.status === 'pending' ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => reviewReport(report)}
                              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                            >
                              <CheckCircle2 size={16} />
                              Analisar
                            </button>

                            <button
                              onClick={() => rejectReport(report)}
                              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                            >
                              <XCircle size={16} />
                              Rejeitar
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
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

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        classes[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {translateStatus(status)}
    </span>
  );
}

function translateStatus(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendente',
    reviewed: 'Analisada',
    rejected: 'Rejeitada',
  };

  return map[status] || status;
}

function translateType(type: string) {
  const map: Record<string, string> = {
    theft: 'Furto',
    robbery: 'Roubo',
    loss: 'Perda',
    perda: 'Perda',
    roubo: 'Roubo',
    furto: 'Furto',
  };

  return map[type] || type;
}