import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import {
  RefreshCw,
  Save,
  Settings,
} from 'lucide-react';

import { api } from '../api/api';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface SettingItem {
  id: string;
  key: string;
  value: string;
  label: string;
  type: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function loadSettings() {
    try {
      setLoading(true);

      const response = await api.get('/settings');

      setSettings(response.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao carregar configurações.',
      );
    } finally {
      setLoading(false);
    }
  }

  function updateLocalValue(key: string, value: string) {
    setSettings((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              value,
            }
          : item,
      ),
    );
  }

  async function handleSave(setting: SettingItem) {
    try {
      setSavingKey(setting.key);

      await api.patch(`/settings/${setting.key}`, {
        value: setting.value,
      });

      toast.success('Configuração salva com sucesso!');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Erro ao salvar configuração.',
      );
    } finally {
      setSavingKey(null);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-950/20">
              <Settings size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Configurações
              </h1>

              <p className="mt-1 text-slate-500">
                Ajuste os dados institucionais e regras gerais do sistema.
              </p>
            </div>
          </div>

          <button
            onClick={loadSettings}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60">
          {loading ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Carregando configurações...
            </div>
          ) : settings.length === 0 ? (
            <div className="p-8 text-center font-semibold text-slate-500">
              Nenhuma configuração encontrada.
            </div>
          ) : (
            <div className="grid gap-6">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="font-black text-slate-900">
                        {setting.label}
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Chave: {setting.key}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSave(setting)}
                      disabled={savingKey === setting.key}
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={16} />
                      {savingKey === setting.key
                        ? 'Salvando...'
                        : 'Salvar'}
                    </button>
                  </div>

                  {setting.type === 'textarea' ? (
                    <textarea
                      value={setting.value}
                      onChange={(e) =>
                        updateLocalValue(setting.key, e.target.value)
                      }
                      className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <input
                      type={setting.type === 'number' ? 'number' : 'text'}
                      value={setting.value}
                      onChange={(e) =>
                        updateLocalValue(setting.key, e.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}