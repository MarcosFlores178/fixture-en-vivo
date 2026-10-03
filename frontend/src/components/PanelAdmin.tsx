import React, { useState } from 'react';
import { usePartidos, Partido } from '../hooks/usePartidos';

export const PanelAdmin: React.FC = () => {
  const { partidos, isLoading, error, mutate } = usePartidos();

  // Estado del formulario de creación
  const [deporte, setDeporte] = useState<'Fútbol 5' | 'Pádel'>('Fútbol 5');
  const [fase, setFase] = useState('');
  const [equipoA, setEquipoA] = useState('');
  const [equipoB, setEquipoB] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estado local para retroalimentación de actualización
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Manejar creación de partido
  const handleCrearPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fase.trim() || !equipoA.trim() || !equipoB.trim()) {
      setFormError('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch('/api/partidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deporte,
          fase: fase.trim(),
          equipo_a: equipoA.trim(),
          equipo_b: equipoB.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      // Limpiar formulario y revalidar lista con SWR
      setFase('');
      setEquipoA('');
      setEquipoB('');
      await mutate();
    } catch (err: any) {
      setFormError(err.message || 'Error al crear el partido');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar actualización de marcador o estado (PATCH)
  const handleActualizar = async (
    id: string,
    updates: Partial<{ marcador_a: string; marcador_b: string; estado: string }>
  ) => {
    try {
      setUpdatingId(id);

      // Mutación optimista opcional para respuesta ultra rápida
      mutate(
        partidos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        false
      );

      const res = await fetch(`/api/partidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Error al actualizar en el servidor');
      }

      // Revalidación con la base de datos
      await mutate();
    } catch (err) {
      console.error('Error al actualizar partido:', err);
      // Revertir en caso de error
      await mutate();
    } finally {
      setUpdatingId(null);
    }
  };

  // Función auxiliar para ajustar marcador con +1 o -1
  const modificarMarcador = (
    partido: Partido,
    equipo: 'a' | 'b',
    delta: number
  ) => {
    const clave = equipo === 'a' ? 'marcador_a' : 'marcador_b';
    const valorActual = parseInt(partido[clave], 10) || 0;
    const nuevoValor = Math.max(0, valorActual + delta).toString();

    handleActualizar(partido.id, { [clave]: nuevoValor });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera del Panel */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Admin
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Panel de Control de Partidos
              </h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Crea encuentros y actualiza marcadores o estados en tiempo real con sincronización instantánea.
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Polling SWR cada 5s activo
          </div>
        </header>

        {/* 1. Formulario para Crear Partido */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Nuevo Partido
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {formError}
            </div>
          )}

          <form onSubmit={handleCrearPartido} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Deporte */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Deporte *
              </label>
              <select
                value={deporte}
                onChange={(e) => setDeporte(e.target.value as 'Fútbol 5' | 'Pádel')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="Fútbol 5">Fútbol 5</option>
                <option value="Pádel">Pádel</option>
              </select>
            </div>

            {/* Fase */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Fase / Horario *
              </label>
              <input
                type="text"
                placeholder="Ej. Fecha 1 - 20:00 hs"
                value={fase}
                onChange={(e) => setFase(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
              </input>
            </div>

            {/* Equipo A */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Equipo A (Local) *
              </label>
              <input
                type="text"
                placeholder="Ej. Los Halcones"
                value={equipoA}
                onChange={(e) => setEquipoA(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
              </input>
            </div>

            {/* Equipo B */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Equipo B (Visitante) *
              </label>
              <input
                type="text"
                placeholder="Ej. La Máquina"
                value={equipoB}
                onChange={(e) => setEquipoB(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
              </input>
            </div>

            {/* Botón de Enviar */}
            <div className="md:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando partido...
                  </>
                ) : (
                  'Crear Partido'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* 2. Lista de Gestión de Partidos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Partidos Registrados ({partidos.length})
            </h2>
            {isLoading && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Sincronizando...
              </span>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              Error al consultar los partidos: {error.message}
            </div>
          )}

          {partidos.length === 0 && !isLoading ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              No hay partidos dados de alta aún. Utiliza el formulario superior para crear el primero.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {partidos.map((partido) => {
                const isItemUpdating = updatingId === partido.id;

                return (
                  <div
                    key={partido.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-sm ${
                      partido.estado === 'en_juego'
                        ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Información de Cabecera del Partido */}
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 uppercase">
                          {partido.deporte}
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          {partido.fase}
                        </span>
                        {isItemUpdating && (
                          <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                            Actualizando...
                          </span>
                        )}
                      </div>

                      {/* Control de Marcadores Rápidos (+1 / -1) */}
                      <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        {/* Equipo A */}
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-800 text-sm max-w-[120px] sm:max-w-[160px] truncate text-right" title={partido.equipo_a}>
                            {partido.equipo_a}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => modificarMarcador(partido, 'a', -1)}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center transition active:scale-95 shadow-xs"
                              title="Restar 1 gol/punto"
                            >
                              -1
                            </button>
                            <span className="w-10 text-center font-black text-2xl text-slate-900">
                              {partido.marcador_a}
                            </span>
                            <button
                              type="button"
                              onClick={() => modificarMarcador(partido, 'a', 1)}
                              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center transition active:scale-95 shadow-xs"
                              title="Sumar 1 gol/punto"
                            >
                              +1
                            </button>
                          </div>
                        </div>

                        <span className="text-slate-400 font-bold text-lg select-none">
                          VS
                        </span>

                        {/* Equipo B */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => modificarMarcador(partido, 'b', -1)}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center transition active:scale-95 shadow-xs"
                              title="Restar 1 gol/punto"
                            >
                              -1
                            </button>
                            <span className="w-10 text-center font-black text-2xl text-slate-900">
                              {partido.marcador_b}
                            </span>
                            <button
                              type="button"
                              onClick={() => modificarMarcador(partido, 'b', 1)}
                              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center transition active:scale-95 shadow-xs"
                              title="Sumar 1 gol/punto"
                            >
                              +1
                            </button>
                          </div>
                          <span className="font-semibold text-slate-800 text-sm max-w-[120px] sm:max-w-[160px] truncate" title={partido.equipo_b}>
                            {partido.equipo_b}
                          </span>
                        </div>
                      </div>

                      {/* Selector de Estado */}
                      <div className="flex items-center justify-end gap-2">
                        <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                          Estado:
                        </label>
                        <select
                          value={partido.estado}
                          onChange={(e) => handleActualizar(partido.id, { estado: e.target.value })}
                          className={`text-xs font-bold rounded-xl px-3 py-2 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                            partido.estado === 'en_juego'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : partido.estado === 'pendiente'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="en_juego">🟢 En juego</option>
                          <option value="finalizado">🏁 Finalizado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
