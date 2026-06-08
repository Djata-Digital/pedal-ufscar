import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import {
  Clock3,
  RefreshCw,
  Save,
} from 'lucide-react';

import { api } from '../api/api';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface OperatingHour {
  id: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
}

const dayNames: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

export default function OperatingHoursPage() {
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadHours() {
    try {
      setLoading(true);

      const response = await api.get('/operating-hours');

      setHours(response.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar horários de funcionamento.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveHours() {
    try {
      setSaving(true);

      await api.patch('/operating-hours', {
        hours: hours.map((hour) => ({
          dayOfWeek: hour.dayOfWeek,
          isOpen: hour.isOpen,
          openTime: hour.isOpen ? hour.openTime : null,
          closeTime: hour.isOpen ? hour.closeTime : null,
        })),
      });

      toast.success('Horários de funcionamento salvos com sucesso!');

      await loadHours();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao salvar horários de funcionamento.',
      );
    } finally {
      setSaving(false);
    }
  }

  function updateHour(
    dayOfWeek: number,
    field: 'isOpen' | 'openTime' | 'closeTime',
    value: boolean | string,
  ) {
    setHours((current) =>
      current.map((hour) => {
        if (hour.dayOfWeek !== dayOfWeek) {
          return hour;
        }

        if (field === 'isOpen') {
          const isOpen = Boolean(value);

          return {
            ...hour,
            isOpen,
            openTime: isOpen ? hour.openTime || '08:00' : null,
            closeTime: isOpen ? hour.closeTime || '18:00' : null,
          };
        }

        return {
          ...hour,
          [field]: value,
        };
      }),
    );
  }

  useEffect(() => {
    loadHours();
  }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-950/20">
              <Clock3 size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Horário de funcionamento
              </h1>

              <p className="mt-1 text-slate-500">
                Configure os dias e horários em que os usuários podem retirar bicicletas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={loadHours}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>

            <button
              onClick={saveHours}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60">
          {loading ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Carregando horários...
            </div>
          ) : (
            <div className="grid gap-4">
              {hours.map((hour) => (
                <div
                  key={hour.dayOfWeek}
                  className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.2fr_1fr_1fr_1fr]"
                >
                  <div>
                    <p className="font-black text-slate-900">
                      {dayNames[hour.dayOfWeek]}
                    </p>

                    <p className="text-sm text-slate-500">
                      {hour.isOpen
                        ? 'Funcionamento ativo'
                        : 'Fechado neste dia'}
                    </p>
                  </div>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={hour.isOpen}
                      onChange={(event) =>
                        updateHour(
                          hour.dayOfWeek,
                          'isOpen',
                          event.target.checked,
                        )
                      }
                      className="h-5 w-5"
                    />

                    <span className="text-sm font-bold text-slate-700">
                      Aberto
                    </span>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black uppercase text-slate-400">
                      Abertura
                    </span>

                    <input
                      type="time"
                      value={hour.openTime || ''}
                      disabled={!hour.isOpen}
                      onChange={(event) =>
                        updateHour(
                          hour.dayOfWeek,
                          'openTime',
                          event.target.value,
                        )
                      }
                      className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black uppercase text-slate-400">
                      Fechamento
                    </span>

                    <input
                      type="time"
                      value={hour.closeTime || ''}
                      disabled={!hour.isOpen}
                      onChange={(event) =>
                        updateHour(
                          hour.dayOfWeek,
                          'closeTime',
                          event.target.value,
                        )
                      }
                      className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}