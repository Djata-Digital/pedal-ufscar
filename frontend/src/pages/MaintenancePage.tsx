import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { toast } from 'sonner';

import {
  Bike,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  Wrench,
  X,
} from 'lucide-react';

import { api } from '../api/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { exportToCsv } from '../utils/exportCsv';

interface Equipment {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  photoUrl: string | null;
}

interface MaintenanceRecord {
  id: string;
  equipment: Equipment;
  problemDescription: string;
  solutionDescription: string | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export default function MaintenancePage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [equipmentId, setEquipmentId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedRecord, setSelectedRecord] =
    useState<MaintenanceRecord | null>(null);

  const [solutionDescription, setSolutionDescription] = useState(
    'Manutenção concluída e equipamento liberado.',
  );

  const availableEquipments = useMemo(
    () => equipments.filter((item) => item.status !== 'loaned'),
    [equipments],
  );

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const text = `
        ${record.equipment?.code || ''}
        ${record.equipment?.name || ''}
        ${record.problemDescription || ''}
        ${record.solutionDescription || ''}
      `.toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (statusFilter === 'all' || record.status === statusFilter)
      );
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      inProgress: records.filter(
        (record) => record.status === 'in_progress',
      ).length,
      finished: records.filter(
        (record) => record.status === 'finished',
      ).length,
    };
  }, [records]);

  async function loadData() {
    try {
      setLoading(true);

      const [equipmentsResponse, maintenanceResponse] = await Promise.all([
        api.get('/equipments'),
        api.get('/maintenance'),
      ]);

      setEquipments(equipmentsResponse.data);
      setRecords(maintenanceResponse.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar manutenções.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMaintenance(event: FormEvent) {
    event.preventDefault();

    if (!equipmentId || !problemDescription) {
      toast.warning('Selecione o equipamento e descreva o problema.');
      return;
    }

    try {
      await api.post('/maintenance', {
        equipmentId,
        problemDescription,
      });

      setEquipmentId('');
      setProblemDescription('');

      await loadData();

      toast.success('Manutenção registrada com sucesso!');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao registrar manutenção.',
      );
    }
  }

  function openFinishModal(record: MaintenanceRecord) {
    setSelectedRecord(record);
    setSolutionDescription(
      'Manutenção concluída e equipamento liberado.',
    );
  }

  function closeFinishModal() {
    setSelectedRecord(null);
    setSolutionDescription(
      'Manutenção concluída e equipamento liberado.',
    );
  }

  async function handleConfirmFinishMaintenance() {
    if (!selectedRecord) return;

    if (!solutionDescription.trim()) {
      toast.warning('Informe a solução aplicada.');
      return;
    }

    try {
      await api.patch(`/maintenance/${selectedRecord.id}/finish`, {
        solutionDescription,
      });

      await loadData();

      closeFinishModal();

      toast.success('Manutenção finalizada com sucesso!');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao finalizar manutenção.',
      );
    }
  }

  function handleExportCsv() {
    exportToCsv(
      'manutencoes-pedal-ufscar.csv',
      filteredRecords.map((record) => ({
        Codigo: record.equipment?.code,
        Equipamento: record.equipment?.name,
        Problema: record.problemDescription,
        Solucao: record.solutionDescription || '',
        Status: translateMaintenanceStatus(record.status),
        CriadoEm: formatDate(record.createdAt),
        FinalizadoEm: record.finishedAt
          ? formatDate(record.finishedAt)
          : '',
      })),
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/20">
              <Wrench size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Manutenção
              </h1>

              <p className="mt-1 text-slate-500">
                Registre problemas, acompanhe reparos e libere equipamentos.
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
              onClick={loadData}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <StatsCard
            title="Total"
            value={stats.total}
            color="bg-slate-900"
          />

          <StatsCard
            title="Em andamento"
            value={stats.inProgress}
            color="bg-orange-500"
          />

          <StatsCard
            title="Finalizadas"
            value={stats.finished}
            color="bg-green-600"
          />
        </div>

        <form
          onSubmit={handleCreateMaintenance}
          className="mb-8 rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60"
        >
          <div className="mb-6 flex items-center gap-3">
            <Wrench className="text-orange-500" size={24} />

            <h2 className="text-xl font-black text-slate-900">
              Nova manutenção
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-700">
                Equipamento
              </span>

              <select
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Selecione</option>

                {availableEquipments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-700">
                Descrição do problema
              </span>

              <input
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Ex: pneu furado, freio com problema..."
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-black text-white shadow-lg shadow-orange-950/20 transition hover:bg-orange-600"
          >
            Registrar manutenção
          </button>
        </form>

        <div className="mb-6 grid gap-4 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/60 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por equipamento, código ou problema..."
              className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">Todos os status</option>
            <option value="in_progress">Em andamento</option>
            <option value="finished">Finalizadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/60">
          {loading ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Carregando manutenções...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Nenhuma manutenção encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Equipamento
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Problema
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Solução
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
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {record.equipment?.photoUrl ? (
                            <img
                              src={record.equipment.photoUrl}
                              alt={record.equipment.name}
                              className="h-12 w-16 rounded-2xl object-cover ring-2 ring-slate-100"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                              <Bike size={22} />
                            </div>
                          )}

                          <div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {record.equipment?.code}
                            </span>

                            <p className="mt-2 font-bold text-slate-900">
                              {record.equipment?.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {record.problemDescription}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {record.solutionDescription ||
                          'Ainda não informada'}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={record.status} />
                      </td>

                      <td className="px-6 py-5">
                        {record.status === 'in_progress' ? (
                          <button
                            onClick={() => openFinishModal(record)}
                            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                          >
                            <CheckCircle2 size={16} />
                            Finalizar
                          </button>
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

        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Finalizar manutenção
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Informe a solução aplicada antes de liberar o equipamento.
                  </p>
                </div>

                <button
                  onClick={closeFinishModal}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="mb-5 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center gap-4">
                  {selectedRecord.equipment?.photoUrl ? (
                    <img
                      src={selectedRecord.equipment.photoUrl}
                      alt={selectedRecord.equipment.name}
                      className="h-20 w-28 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-28 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                      <Bike size={32} />
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-slate-500">Equipamento</p>

                    <p className="font-bold text-slate-900">
                      {selectedRecord.equipment?.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {selectedRecord.equipment?.code}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-slate-500">
                    Problema
                  </p>

                  <p className="font-bold text-slate-900">
                    {selectedRecord.problemDescription}
                  </p>
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">
                  Solução aplicada
                </span>

                <textarea
                  value={solutionDescription}
                  onChange={(e) =>
                    setSolutionDescription(e.target.value)
                  }
                  className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeFinishModal}
                  className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleConfirmFinishMaintenance}
                  className="rounded-xl bg-green-600 px-5 py-3 font-black text-white shadow-lg shadow-green-950/20 transition hover:bg-green-700"
                >
                  Confirmar finalização
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatsCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`${color} rounded-3xl p-6 text-white shadow-lg`}>
      <p className="text-sm font-semibold opacity-90">
        {title}
      </p>

      <h2 className="mt-3 text-5xl font-black">
        {value}
      </h2>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-orange-100 text-orange-700',
    finished: 'bg-green-100 text-green-700',
    cancelled: 'bg-slate-200 text-slate-700',
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        classes[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {translateMaintenanceStatus(status)}
    </span>
  );
}

function translateMaintenanceStatus(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    finished: 'Finalizada',
    cancelled: 'Cancelada',
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