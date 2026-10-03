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

  // Estado para retroalimentación visual de actualización
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Función para determinar si es Pádel
  const esPadel = (dep: string) => {
    return dep.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'padel';
  };

  // Crear nuevo partido (POST /api/partidos)
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

  // Actualizar cualquier campo (PATCH /api/partidos/:id + mutate)
  const handleActualizar = async (
    id: string,
    updates: Partial<Partido>
  ) => {
    try {
      setUpdatingId(id);

      // Mutación optimista en el cliente
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

      await mutate();
    } catch (err) {
      console.error('Error al actualizar:', err);
      await mutate();
    } finally {
      setUpdatingId(null);
    }
  };

  // Ajuste rápido de goles para Fútbol (+1 / -1)
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

  // Ajuste rápido de sets para Pádel (+1 / -1)
  const modificarSet = (
    partido: Partido,
    setKey: 'set1_a' | 'set2_a' | 'set3_a' | 'set1_b' | 'set2_b' | 'set3_b',
    delta: number
  ) => {
    const valorActual = Number(partido[setKey]) || 0;
    const nuevoValor = Math.max(0, valorActual + delta);

    handleActualizar(partido.id, { [setKey]: nuevoValor });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
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
              Gestión visual para Fútbol 5 (goles) y Pádel (tabla de sets 1, 2 y 3 con definición de ganador).
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Polling SWR cada 5s activo
          </div>
        </header>

        {/* Formulario de Alta */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-indigo-600 text-xl font-black">+</span>
            Crear Nuevo Partido
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {formError}
            </div>
          )}

          <form onSubmit={handleCrearPartido} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Deporte *
              </label>
              <select
                value={deporte}
                onChange={(e) => setDeporte(e.target.value as 'Fútbol 5' | 'Pádel')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Fútbol 5">Fútbol 5</option>
                <option value="Pádel">Pádel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Fase / Horario *
              </label>
              <input
                type="text"
                placeholder="Ej. Cuartos de final - 19:30"
                value={fase}
                onChange={(e) => setFase(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Equipo A (Local) *
              </label>
              <input
                type="text"
                placeholder="Ej. Bela / Coello"
                value={equipoA}
                onChange={(e) => setEquipoA(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Equipo B (Visitante) *
              </label>
              <input
                type="text"
                placeholder="Ej. Galán / Chingotto"
                value={equipoB}
                onChange={(e) => setEquipoB(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? 'Creando...' : 'Crear Partido'}
              </button>
            </div>
          </form>
        </section>

        {/* Lista de Partidos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Partidos Registrados ({partidos.length})
            </h2>
            {isLoading && (
              <span className="text-xs text-slate-500 animate-pulse">Sincronizando...</span>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              Error al consultar partidos: {error.message}
            </div>
          )}

          {partidos.length === 0 && !isLoading ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              No hay partidos dados de alta aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {partidos.map((partido) => {
                const isItemUpdating = updatingId === partido.id;
                const esDeportePadel = esPadel(partido.deporte);

                return (
                  <div
                    key={partido.id}
                    className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-sm ${
                      partido.estado === 'en_juego'
                        ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                        : partido.estado === 'finalizado'
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Barra de estado y deporte */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wider ${
                          esDeportePadel
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {partido.deporte}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          {partido.fase}
                        </span>
                        {isItemUpdating && (
                          <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                            Guardando...
                          </span>
                        )}
                      </div>

                      {/* Selector de Estado */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                          Estado:
                        </label>
                        <select
                          value={partido.estado}
                          onChange={(e) => handleActualizar(partido.id, { estado: e.target.value })}
                          className={`text-xs font-bold rounded-xl px-3 py-2 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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

                    {/* VISTA CONDICIONAL SEGÚN EL DEPORTE */}
                    {esDeportePadel ? (
                      /* ===================== MODO PÁDEL ===================== */
                      <div className="space-y-4">
                        {/* Tabla / Grilla de Pádel */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase">
                                <th className="py-2 px-3 w-1/2">Equipos / Parejas</th>
                                <th className="py-2 px-2 text-center w-1/6">Set 1</th>
                                <th className="py-2 px-2 text-center w-1/6">Set 2</th>
                                <th className="py-2 px-2 text-center w-1/6">Set 3</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 text-sm">
                              {/* Fila Equipo A */}
                              <tr className={partido.ganador === partido.equipo_a ? 'bg-amber-100/50' : ''}>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-base">
                                      {partido.equipo_a}
                                    </span>
                                    {partido.ganador === partido.equipo_a && (
                                      <span className="text-amber-500 font-extrabold text-xs flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                        👑 Ganador
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Set 1 - A */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set1_a', -1)}
                                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-black text-lg text-slate-900">
                                      {partido.set1_a ?? 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set1_a', 1)}
                                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Set 2 - A */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set2_a', -1)}
                                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-black text-lg text-slate-900">
                                      {partido.set2_a ?? 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set2_a', 1)}
                                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Set 3 - A */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set3_a', -1)}
                                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-black text-lg text-slate-900">
                                      {partido.set3_a ?? 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set3_a', 1)}
                                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Fila Equipo B */}
                              <tr className={partido.ganador === partido.equipo_b ? 'bg-amber-100/50' : ''}>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-base">
                                      {partido.equipo_b}
                                    </span>
                                    {partido.ganador === partido.equipo_b && (
                                      <span className="text-amber-500 font-extrabold text-xs flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                        👑 Ganador
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Set 1 - B */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set1_b', -1)}
                                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-black text-lg text-slate-900">
                                      {partido.set1_b ?? 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set1_b', 1)}
                                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Set 2 - B */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set2_b', -1)}
                                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-black text-lg text-slate-900">
                                      {partido.set2_b ?? 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set2_b', 1)}
                                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Set 3 - B */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set3_b', -1)}
                                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-black text-lg text-slate-900">
                                      {partido.set3_b ?? 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => modificarSet(partido, 'set3_b', 1)}
                                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-2xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Botones de Ganador */}
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Declarar Ganador:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleActualizar(partido.id, { estado: 'finalizado', ganador: partido.equipo_a })}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
                              partido.ganador === partido.equipo_a
                                ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-md'
                                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            🏆 Gana {partido.equipo_a}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActualizar(partido.id, { estado: 'finalizado', ganador: partido.equipo_b })}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
                              partido.ganador === partido.equipo_b
                                ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-md'
                                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            🏆 Gana {partido.equipo_b}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ===================== MODO FÚTBOL ===================== */
                      <div className="space-y-4">
                        <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          {/* Equipo A */}
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-800 text-sm max-w-[140px] truncate text-right">
                              {partido.equipo_a}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => modificarMarcador(partido, 'a', -1)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center active:scale-95"
                                title="Restar 1"
                              >
                                -1
                              </button>
                              <span className="w-10 text-center font-black text-2xl text-slate-900">
                                {partido.marcador_a}
                              </span>
                              <button
                                type="button"
                                onClick={() => modificarMarcador(partido, 'a', 1)}
                                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center active:scale-95"
                                title="Sumar 1"
                              >
                                +1
                              </button>
                            </div>
                          </div>

                          <span className="text-slate-400 font-bold text-lg select-none">VS</span>

                          {/* Equipo B */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => modificarMarcador(partido, 'b', -1)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center active:scale-95"
                                title="Restar 1"
                              >
                                -1
                              </button>
                              <span className="w-10 text-center font-black text-2xl text-slate-900">
                                {partido.marcador_b}
                              </span>
                              <button
                                type="button"
                                onClick={() => modificarMarcador(partido, 'b', 1)}
                                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center active:scale-95"
                                title="Sumar 1"
                              >
                                +1
                              </button>
                            </div>
                            <span className="font-semibold text-slate-800 text-sm max-w-[140px] truncate">
                              {partido.equipo_b}
                            </span>
                          </div>
                        </div>

                        {/* Botones de Ganador Opcional para Fútbol si se quiere definir */}
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Declarar Ganador:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleActualizar(partido.id, { estado: 'finalizado', ganador: partido.equipo_a })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 ${
                              partido.ganador === partido.equipo_a
                                ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-md'
                                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            🏆 {partido.equipo_a}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActualizar(partido.id, { estado: 'finalizado', ganador: partido.equipo_b })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 ${
                              partido.ganador === partido.equipo_b
                                ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-md'
                                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            🏆 {partido.equipo_b}
                          </button>
                        </div>
                      </div>
                    )}
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
