import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { toast } from 'sonner';

import {
  Bike,
  ImageIcon,
  LogIn,
  RefreshCw,
  Send,
} from 'lucide-react';

import { api } from '../../api/api';

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Equipment {
  id: string;
  type: string;
  code: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  status: string;
  notes: string | null;
}

export default function PublicEquipmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  function getLoggedUser() {
    const userText = localStorage.getItem('public_user');

    if (!userText) {
      return null;
    }

    try {
      return JSON.parse(userText) as User;
    } catch {
      return null;
    }
  }

  async function loadEquipment() {
    if (!id) return;

    try {
      setLoading(true);

      const response = await api.get(`/equipments/public/${id}`);

      setEquipment(response.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar equipamento.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestThisBike() {
    if (!equipment) return;

    const user = getLoggedUser();

    if (!user) {
      toast.warning('Faça login para solicitar esta bicicleta.');
      navigate(`/public/login?redirect=/public/equipment/${equipment.id}`);
      return;
    }

    if (equipment.status !== 'available') {
      toast.warning('Esta bicicleta não está disponível para solicitação.');
      return;
    }

    const purpose =
      prompt(
        `Informe a finalidade do uso da bicicleta ${equipment.code}:`,
        'Deslocamento no campus.',
      ) || 'Deslocamento no campus.';

    const expectedReturnDate = new Date();
    expectedReturnDate.setHours(expectedReturnDate.getHours() + 24);

    try {
      setRequesting(true);

      await api.post('/loans-requests', {
        userId: user.id,
        equipmentId: equipment.id,
        expectedReturnDate: expectedReturnDate.toISOString(),
        purpose,
      });

      toast.success('Solicitação enviada com sucesso!');

      navigate('/public/dashboard');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao solicitar bicicleta.',
      );
    } finally {
      setRequesting(false);
    }
  }

  useEffect(() => {
    loadEquipment();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-md">
        <header className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-600 text-white shadow-lg shadow-green-950/20">
            <Bike size={34} />
          </div>

          <h1 className="mt-4 text-3xl font-black text-slate-900">
            PEDAL-UFSCar
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Consulta pública do equipamento.
          </p>
        </header>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-semibold text-slate-500 shadow-lg shadow-slate-200/60">
            Carregando equipamento...
          </div>
        ) : !equipment ? (
          <div className="rounded-3xl bg-white p-8 text-center font-semibold text-slate-500 shadow-lg shadow-slate-200/60">
            Equipamento não encontrado.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/60">
            {equipment.photoUrl ? (
              <img
                src={equipment.photoUrl}
                alt={equipment.name}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center bg-slate-100 text-slate-400">
                <ImageIcon size={48} />
              </div>
            )}

            <div className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                  {equipment.code}
                </span>

                <StatusBadge status={equipment.status} />
              </div>

              <h2 className="text-2xl font-black text-slate-900">
                {equipment.name}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {equipment.description || 'Sem descrição cadastrada.'}
              </p>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Tipo</p>
                <p className="font-bold text-slate-900">
                  {translateType(equipment.type)}
                </p>
              </div>

              {equipment.status === 'available' ? (
                <button
                  onClick={handleRequestThisBike}
                  disabled={requesting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-black text-white shadow-lg shadow-green-950/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={18} />
                  {requesting ? 'Enviando...' : 'Solicitar esta bicicleta'}
                </button>
              ) : (
                <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-center text-sm font-bold text-slate-500">
                  Esta bicicleta não está disponível para solicitação no momento.
                </div>
              )}

              <button
                onClick={loadEquipment}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700"
              >
                <RefreshCw size={18} />
                Atualizar informações
              </button>

              {!getLoggedUser() && (
                <button
                  onClick={() => navigate('/public/login')}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-black text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
                >
                  <LogIn size={18} />
                  Fazer login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    loaned: 'bg-blue-100 text-blue-700',
    maintenance: 'bg-amber-100 text-amber-700',
    lost: 'bg-red-100 text-red-700',
    damaged: 'bg-orange-100 text-orange-700',
    inactive: 'bg-slate-200 text-slate-700',
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

function translateType(type: string) {
  const map: Record<string, string> = {
    bike: 'Bicicleta',
    helmet: 'Capacete',
    lock: 'Trava',
    key: 'Chave',
  };

  return map[type] || type;
}

function translateStatus(status: string) {
  const map: Record<string, string> = {
    available: 'Disponível',
    loaned: 'Emprestado',
    maintenance: 'Manutenção',
    lost: 'Perdido',
    damaged: 'Danificado',
    inactive: 'Inativo',
  };

  return map[status] || status;
}