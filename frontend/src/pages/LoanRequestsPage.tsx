import { useEffect, useMemo, useRef, useState } from 'react';

import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';

import {
  CheckCircle2,
  Bike,
  Clock3,
  FileSignature,
  User as UserIcon,

  RefreshCw,
  Search,
  Trash2,
  X,
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
  type: string;
  status: string;
  photoUrl: string | null;
}

interface LoanRequest {
  id: string;
  user: User;
  equipment: Equipment;
  expectedReturnDate: string;
  status: string;
  purpose: string | null;
  notes: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  pickupDate: string | null;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  pickupExpiredAt: string | null;
}

const DEFAULT_TERM = `Declaro que recebi a bicicleta em condições de uso e assumo a responsabilidade pelo seu cuidado durante o período de empréstimo.

Comprometo-me a devolver a bicicleta no prazo previsto e em bom estado de conservação.

Estou ciente de que danos, perda ou atraso na devolução poderão ser analisados pela equipe responsável pelo PEDAL-UFSCar.`;

export default function LoanRequestsPage() {
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedRequest, setSelectedRequest] =
    useState<LoanRequest | null>(null);

  const [acceptedTerm, setAcceptedTerm] = useState(false);
  const [converting, setConverting] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [helmetId, setHelmetId] = useState('');
  const [lockId, setLockId] = useState('');

  async function loadRequests() {
    try {
      setLoading(true);

      const [requestsResponse, equipmentsResponse] = await Promise.all([
        api.get('/loan-requests'),
        api.get('/equipments'),
      ]);

      setRequests(requestsResponse.data);
      setEquipments(equipmentsResponse.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar solicitações.',
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const text = `
        ${request.user?.fullName || ''}
        ${request.user?.email || ''}
        ${request.equipment?.code || ''}
        ${request.equipment?.name || ''}
        ${request.purpose || ''}
        ${request.notes || ''}
      `.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const availableHelmets = useMemo(
    () =>
      equipments.filter(
        (equipment) =>
          equipment.type === 'helmet' &&
          equipment.status === 'available',
      ),
    [equipments],
  );

  const availableLocks = useMemo(
    () =>
      equipments.filter(
        (equipment) =>
          equipment.type === 'lock' &&
          equipment.status === 'available',
      ),
    [equipments],
  );

  async function reviewRequest(
    request: LoanRequest,
    status: 'approved' | 'rejected',
  ) {
    const adminNotes =
      status === 'approved'
        ? 'Solicitação aprovada. Aguardando retirada dentro do horário de funcionamento.'
        : prompt('Motivo da rejeição:', 'Solicitação rejeitada.') ||
          'Solicitação rejeitada.';

    try {
      await api.patch(`/loan-requests/${request.id}/review`, {
        status,
        adminNotes,
      });

      await loadRequests();

      toast.success(
        status === 'approved'
          ? 'Solicitação aprovada! O horário de retirada foi definido automaticamente.'
          : 'Solicitação rejeitada com sucesso!',
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao analisar solicitação.',
      );
    }
  }

  function openWithdrawModal(request: LoanRequest) {
    setSelectedRequest(request);
    setAcceptedTerm(false);
    setHelmetId('');
    setLockId('');

    setTimeout(() => {
      signatureRef.current?.clear();
    }, 100);
  }

  function closeWithdrawModal() {
    setSelectedRequest(null);
    setAcceptedTerm(false);
    setHelmetId('');
    setLockId('');
  }

  function clearSignature() {
    signatureRef.current?.clear();
  }

  async function confirmWithdraw() {
    if (!selectedRequest) return;

    if (!acceptedTerm) {
      toast.warning('É necessário aceitar o termo de responsabilidade.');
      return;
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.warning('É necessário coletar a assinatura do usuário.');
      return;
    }

    const signatureImage = signatureRef.current
      .getCanvas()
      .toDataURL('image/png');

    try {
      setConverting(true);

      await api.patch(
        `/loan-requests/${selectedRequest.id}/convert-to-loan`,
        {
          responsibilityTermAccepted: true,
          responsibilityTermText: DEFAULT_TERM,
          signatureImage,
          helmetId: helmetId || undefined,
          lockId: lockId || undefined,
        }
      );

      await loadRequests();

      closeWithdrawModal();

      toast.success('Retirada registrada e empréstimo criado com sucesso!');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao registrar retirada.',
      );
    } finally {
      setConverting(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-950/20">
              <Clock3 size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Solicitações
              </h1>

              <p className="mt-1 text-slate-500">
                Analise pedidos, aprove solicitações e registre a retirada somente após assinatura do termo.
              </p>
            </div>
          </div>

          <button
            onClick={loadRequests}
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
              placeholder="Buscar por usuário, e-mail, bicicleta ou finalidade..."
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
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="expired">Expiradas</option>
            <option value="converted_to_loan">Convertidas</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/60">
          {loading ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Carregando solicitações...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Nenhuma solicitação encontrada.
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
                      Solicitado em
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Retirada
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Finalidade
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
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {request.user?.photoUrl ? (
                            <img
                              src={request.user.photoUrl}
                              alt={request.user.fullName}
                              className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                              <UserIcon size={22} />
                            </div>
                          )}

                          <div>
                            <p className="font-bold text-slate-900">
                              {request.user?.fullName}
                            </p>

                            <p className="text-xs text-slate-400">
                              {request.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {request.equipment?.photoUrl ? (
                            <img
                              src={request.equipment.photoUrl}
                              alt={request.equipment.name}
                              className="h-12 w-16 rounded-2xl object-cover ring-2 ring-slate-100"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                              <Bike size={22} />
                            </div>
                          )}

                          <div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {request.equipment?.code}
                            </span>

                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              {request.equipment?.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(request.createdAt)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatPickupWindow(request)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {request.purpose || 'Não informado'}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={request.status} />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() =>
                                  reviewRequest(request, 'approved')
                                }
                                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                              >
                                <CheckCircle2 size={16} />
                                Aprovar
                              </button>

                              <button
                                onClick={() =>
                                  reviewRequest(request, 'rejected')
                                }
                                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                              >
                                <XCircle size={16} />
                                Rejeitar
                              </button>
                            </>
                          )}

                          {request.status === 'approved' && (
                            <button
                              onClick={() => openWithdrawModal(request)}
                              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
                            >
                              <FileSignature size={16} />
                              Registrar retirada
                            </button>
                          )}

                          {request.status !== 'pending' &&
                            request.status !== 'approved' && (
                              <span className="text-slate-300">—</span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Registrar retirada
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    A bicicleta só será marcada como emprestada após o usuário assinar o termo.
                  </p>
                </div>

                <button
                  onClick={closeWithdrawModal}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="mb-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  {selectedRequest.user?.photoUrl ? (
                    <img
                      src={selectedRequest.user.photoUrl}
                      alt={selectedRequest.user.fullName}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                      <UserIcon size={24} />
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-slate-500">Usuário</p>
                    <p className="font-bold text-slate-900">
                      {selectedRequest.user?.fullName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedRequest.equipment?.photoUrl ? (
                    <img
                      src={selectedRequest.equipment.photoUrl}
                      alt={selectedRequest.equipment.name}
                      className="h-14 w-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-20 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                      <Bike size={24} />
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-slate-500">Bicicleta</p>
                    <p className="font-bold text-slate-900">
                      {selectedRequest.equipment?.code} —{' '}
                      {selectedRequest.equipment?.name}
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500">Janela de retirada</p>
                  <p className="font-bold text-slate-900">
                    {formatPickupWindow(selectedRequest)}
                  </p>
                </div>
              </div>

              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    Capacete entregue
                  </span>

                  <select
                    value={helmetId}
                    onChange={(event) => setHelmetId(event.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Nenhum capacete</option>

                    {availableHelmets.map((helmet) => (
                      <option key={helmet.id} value={helmet.id}>
                        {helmet.code} — {helmet.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    Trava entregue
                  </span>

                  <select
                    value={lockId}
                    onChange={(event) => setLockId(event.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Nenhuma trava</option>

                    {availableLocks.map((lock) => (
                      <option key={lock.id} value={lock.id}>
                        {lock.code} — {lock.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-black text-amber-900">
                  Termo de responsabilidade
                </h3>

                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-amber-900">
                  {DEFAULT_TERM}
                </p>

                <label className="mt-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedTerm}
                    onChange={(event) =>
                      setAcceptedTerm(event.target.checked)
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <span className="text-sm font-semibold text-amber-900">
                    Confirmo que o usuário leu e aceitou o termo de responsabilidade.
                  </span>
                </label>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-slate-700">
                    Assinatura digital
                  </span>

                  <button
                    type="button"
                    onClick={clearSignature}
                    className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    <Trash2 size={14} />
                    Limpar
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    penColor="black"
                    canvasProps={{
                      width: 900,
                      height: 240,
                      className: 'h-48 w-full bg-white',
                    }}
                  />
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Peça para o usuário assinar acima usando mouse, touchpad ou dedo no celular.
                </p>
              </div>

              <button
                onClick={confirmWithdraw}
                disabled={converting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileSignature size={18} />
                {converting ? 'Registrando...' : 'Confirmar retirada e criar empréstimo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-200 text-slate-700',
    expired: 'bg-red-100 text-red-700',
    converted_to_loan: 'bg-blue-100 text-blue-700',
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
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    cancelled: 'Cancelada',
    expired: 'Expirada',
    converted_to_loan: 'Convertida',
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

function formatDateOnly(value: string) {
  const [year, month, day] = value
    .split('T')[0]
    .split('-')
    .map(Number);

  const date = new Date(year, month - 1, day, 12, 0, 0);

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPickupWindow(request: LoanRequest) {
  if (
    !request.pickupDate ||
    !request.pickupStartTime ||
    !request.pickupEndTime
  ) {
    return 'Ainda não definido';
  }

  return `${formatDateOnly(request.pickupDate)} · ${request.pickupStartTime} às ${request.pickupEndTime}`;
}