import React, { useState, useEffect, useMemo } from 'react';
import { usePartidos, Partido } from '../hooks/usePartidos';
import { useEquipos, Equipo } from '../hooks/useEquipos';
import { useCampeones, Campeon } from '../hooks/useCampeones';

export type CategoriaDeporte = 'futbol_masculino' | 'futbol_femenino' | 'padel';

export const normalizarDeporte = (dep: string): CategoriaDeporte => {
  const d = dep.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (d.includes('fem')) return 'futbol_femenino';
  if (d.includes('masc')) return 'futbol_masculino';
  if (d.includes('padel')) return 'padel';
  if (d.includes('futbol')) return 'futbol_masculino';
  return 'futbol_masculino';
};

export const getDeporteLabel = (dep: string): string => {
  const norm = normalizarDeporte(dep);
  if (norm === 'futbol_masculino') return 'Fútbol 5 Masculino';
  if (norm === 'futbol_femenino') return 'Fútbol 5 Femenino';
  return 'Pádel';
};

// Componente interno que contiene la lógica y llamadas a la API.
// Solo se monta cuando autorizado === true, garantizando cero peticiones si el PIN falla.
const PanelAdminContenido: React.FC = () => {
  const { partidos, isLoading: isLoadingPartidos, error: errorPartidos, mutate: mutatePartidos } = usePartidos();
  const { equipos, isLoading: isLoadingEquipos, error: errorEquipos, mutate: mutateEquipos } = useEquipos();
  const { campeones, isLoading: isLoadingCampeones, mutate: mutateCampeones } = useCampeones();

  // ================= ESTADO DE GESTIÓN DE EQUIPOS =================
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [deporteEquipo, setDeporteEquipo] = useState<CategoriaDeporte>('futbol_masculino');
  const [isSubmittingEquipo, setIsSubmittingEquipo] = useState(false);
  const [equipoFormError, setEquipoFormError] = useState<string | null>(null);
  const [equipoFormSuccess, setEquipoFormSuccess] = useState<string | null>(null);

  // ================= ESTADO DE CREACIÓN DE PARTIDOS =================
  const [deporte, setDeporte] = useState<CategoriaDeporte>('futbol_masculino');
  const [fase, setFase] = useState('');
  const [equipoA, setEquipoA] = useState('');
  const [equipoB, setEquipoB] = useState('');
  const [isSubmittingPartido, setIsSubmittingPartido] = useState(false);
  const [partidoFormError, setPartidoFormError] = useState<string | null>(null);

  // Retroalimentación visual de actualización de partidos
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ================= ESTADO DE CORONAR CAMPEONES (3 CATEGORÍAS) =================
  const [seleccionFutbolMasc, setSeleccionFutbolMasc] = useState<string>('');
  const [seleccionFutbolFem, setSeleccionFutbolFem] = useState<string>('');
  const [seleccionPadel, setSeleccionPadel] = useState<string>('');
  const [savingCampeon, setSavingCampeon] = useState<string | null>(null);
  const [mensajeCampeon, setMensajeCampeon] = useState<string | null>(null);

  // Campeones actuales registrados en BD
  const campeonFutbolMasc = useMemo(
    () => campeones.find((c) => normalizarDeporte(c.deporte) === 'futbol_masculino'),
    [campeones]
  );
  const campeonFutbolFem = useMemo(
    () => campeones.find((c) => normalizarDeporte(c.deporte) === 'futbol_femenino'),
    [campeones]
  );
  const campeonPadel = useMemo(
    () => campeones.find((c) => normalizarDeporte(c.deporte) === 'padel'),
    [campeones]
  );

  // Inicializar selección con los datos existentes
  useEffect(() => {
    if (campeonFutbolMasc && !seleccionFutbolMasc) {
      setSeleccionFutbolMasc(campeonFutbolMasc.equipo_nombre);
    }
  }, [campeonFutbolMasc]);

  useEffect(() => {
    if (campeonFutbolFem && !seleccionFutbolFem) {
      setSeleccionFutbolFem(campeonFutbolFem.equipo_nombre);
    }
  }, [campeonFutbolFem]);

  useEffect(() => {
    if (campeonPadel && !seleccionPadel) {
      setSeleccionPadel(campeonPadel.equipo_nombre);
    }
  }, [campeonPadel]);

  // Listas de equipos por categoría
  const equiposFutbolMasc = useMemo(
    () => equipos.filter((eq) => normalizarDeporte(eq.deporte) === 'futbol_masculino'),
    [equipos]
  );
  const equiposFutbolFem = useMemo(
    () => equipos.filter((eq) => normalizarDeporte(eq.deporte) === 'futbol_femenino'),
    [equipos]
  );
  const equiposPadel = useMemo(
    () => equipos.filter((eq) => normalizarDeporte(eq.deporte) === 'padel'),
    [equipos]
  );

  // Filtrar catálogo de equipos para el nuevo partido según el deporte seleccionado
  const equiposFiltrados = useMemo(() => {
    return equipos.filter((eq) => normalizarDeporte(eq.deporte) === normalizarDeporte(deporte));
  }, [equipos, deporte]);

  // Cambiar deporte del partido y resetear selecciones de equipos
  const handleCambioDeporte = (nuevoDeporte: CategoriaDeporte) => {
    setDeporte(nuevoDeporte);
    setEquipoA('');
    setEquipoB('');
  };

  // 1. Guardar nuevo Equipo (POST /api/equipos)
  const handleCrearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreEquipo.trim()) {
      setEquipoFormError('Ingresa un nombre para el equipo o pareja.');
      return;
    }

    try {
      setIsSubmittingEquipo(true);
      setEquipoFormError(null);
      setEquipoFormSuccess(null);

      const res = await fetch('/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreEquipo.trim(),
          deporte: deporteEquipo,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      setNombreEquipo('');
      setEquipoFormSuccess(`¡Equipo registrado en ${getDeporteLabel(deporteEquipo)} con éxito!`);
      await mutateEquipos();

      setTimeout(() => setEquipoFormSuccess(null), 3000);
    } catch (err: any) {
      setEquipoFormError(err.message || 'Error al guardar el equipo');
    } finally {
      setIsSubmittingEquipo(false);
    }
  };

  // 2. Crear nuevo Partido (POST /api/partidos)
  const handleCrearPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fase.trim() || !equipoA || !equipoB) {
      setPartidoFormError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (equipoA === equipoB) {
      setPartidoFormError('El Equipo A y el Equipo B deben ser distintos.');
      return;
    }

    try {
      setIsSubmittingPartido(true);
      setPartidoFormError(null);

      const res = await fetch('/api/partidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deporte,
          fase: fase.trim(),
          equipo_a: equipoA,
          equipo_b: equipoB,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      setFase('');
      setEquipoA('');
      setEquipoB('');
      await mutatePartidos();
    } catch (err: any) {
      setPartidoFormError(err.message || 'Error al crear el partido');
    } finally {
      setIsSubmittingPartido(false);
    }
  };

  // 3. Actualizar partido (PATCH /api/partidos/:id + mutate)
  const handleActualizar = async (id: string, updates: Partial<Partido>) => {
    try {
      setUpdatingId(id);

      mutatePartidos(
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

      await mutatePartidos();
    } catch (err) {
      console.error('Error al actualizar:', err);
      await mutatePartidos();
    } finally {
      setUpdatingId(null);
    }
  };

  // Modificar marcador de fútbol (+1 / -1)
  const modificarMarcador = (partido: Partido, equipo: 'a' | 'b', delta: number) => {
    const clave = equipo === 'a' ? 'marcador_a' : 'marcador_b';
    const valorActual = parseInt(partido[clave], 10) || 0;
    const nuevoValor = Math.max(0, valorActual + delta).toString();

    handleActualizar(partido.id, { [clave]: nuevoValor });
  };

  // Modificar set de pádel (+1 / -1)
  const modificarSet = (
    partido: Partido,
    setKey: 'set1_a' | 'set2_a' | 'set3_a' | 'set1_b' | 'set2_b' | 'set3_b',
    delta: number
  ) => {
    const valorActual = Number(partido[setKey]) || 0;
    const nuevoValor = Math.max(0, valorActual + delta);

    handleActualizar(partido.id, { [setKey]: nuevoValor });
  };

  // 4. Guardar Campeón (POST /api/campeones con upsert)
  const handleGuardarCampeon = async (deporteKey: CategoriaDeporte, nombreLabel: string, equipoSeleccionado: string) => {
    if (!equipoSeleccionado) {
      alert(`Selecciona un equipo para coronar como campeón de ${nombreLabel}.`);
      return;
    }

    try {
      setSavingCampeon(deporteKey);
      const res = await fetch('/api/campeones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deporte: deporteKey,
          equipo_nombre: equipoSeleccionado,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al registrar el campeón en el servidor');
      }

      await mutateCampeones();
      setMensajeCampeon(`¡Campeón de ${nombreLabel} actualizado a "${equipoSeleccionado}"!`);
      setTimeout(() => setMensajeCampeon(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al guardar campeón');
    } finally {
      setSavingCampeon(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera Principal */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Admin
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Panel de Control de Fixture
              </h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Fútbol 5 Masculino, Fútbol 5 Femenino y Pádel: equipos, programación, marcadores en vivo y campeones.
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Polling SWR cada 5s activo
          </div>
        </header>

        {/* ================= SECCIÓN: GESTIÓN DE EQUIPOS ================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600" />
              Gestión de Equipos
            </h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">
              {equipos.length} {equipos.length === 1 ? 'equipo registrado' : 'equipos registrados'}
            </span>
          </div>

          {equipoFormError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {equipoFormError}
            </div>
          )}

          {equipoFormSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
              {equipoFormSuccess}
            </div>
          )}

          <form onSubmit={handleCrearEquipo} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nombre del Equipo o Pareja *
              </label>
              <input
                type="text"
                placeholder="Ej. Los Leones, Las Leonas o Galán / Chingotto"
                value={nombreEquipo}
                onChange={(e) => setNombreEquipo(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Deporte *
              </label>
              <select
                value={deporteEquipo}
                onChange={(e) => setDeporteEquipo(e.target.value as CategoriaDeporte)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
              >
                <option value="futbol_masculino">Fútbol 5 Masculino</option>
                <option value="futbol_femenino">Fútbol 5 Femenino</option>
                <option value="padel">Pádel</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={isSubmittingEquipo}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmittingEquipo ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Equipo'
                )}
              </button>
            </div>
          </form>

          {/* Badges de equipos registrados */}
          {equipos.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Catálogo disponible:</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {equipos.map((eq) => (
                  <span
                    key={eq.id}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                  >
                    <span className="font-semibold">{eq.nombre}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">({getDeporteLabel(eq.deporte)})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ================= SECCIÓN: CREAR NUEVO PARTIDO ================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-indigo-600 text-xl font-black">+</span>
            Crear Nuevo Partido
          </h2>

          {partidoFormError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {partidoFormError}
            </div>
          )}

          <form onSubmit={handleCrearPartido} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Deporte *
              </label>
              <select
                value={deporte}
                onChange={(e) => handleCambioDeporte(e.target.value as CategoriaDeporte)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="futbol_masculino">Fútbol 5 Masculino</option>
                <option value="futbol_femenino">Fútbol 5 Femenino</option>
                <option value="padel">Pádel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Fase / Horario *
              </label>
              <input
                type="text"
                placeholder="Ej. Fecha 1 - 20:30"
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
              <select
                value={equipoA}
                onChange={(e) => setEquipoA(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Selecciona Equipo A --</option>
                {equiposFiltrados.map((eq) => (
                  <option key={eq.id} value={eq.nombre}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Equipo B (Visitante) *
              </label>
              <select
                value={equipoB}
                onChange={(e) => setEquipoB(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Selecciona Equipo B --</option>
                {equiposFiltrados.map((eq) => (
                  <option key={eq.id} value={eq.nombre}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
            </div>

            {equiposFiltrados.length === 0 && (
              <div className="md:col-span-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
                ⚠️ No hay equipos registrados para <strong>{getDeporteLabel(deporte)}</strong>. Puedes crearlos en la sección <strong>Gestión de Equipos</strong> superior.
              </div>
            )}

            <div className="md:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmittingPartido || equiposFiltrados.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                {isSubmittingPartido ? (
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

        {/* ================= SECCIÓN: LISTA DE PARTIDOS ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Partidos Registrados ({partidos.length})
            </h2>
            {isLoadingPartidos && (
              <span className="text-xs text-slate-500 animate-pulse">Sincronizando...</span>
            )}
          </div>

          {errorPartidos && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              Error al consultar partidos: {errorPartidos.message}
            </div>
          )}

          {partidos.length === 0 && !isLoadingPartidos ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              No hay partidos dados de alta aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {partidos.map((partido) => {
                const isItemUpdating = updatingId === partido.id;
                const esDeportePadel = normalizarDeporte(partido.deporte) === 'padel';

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
                        <span
                          className={`px-3 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wider ${
                            esDeportePadel
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : normalizarDeporte(partido.deporte) === 'futbol_femenino'
                              ? 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {getDeporteLabel(partido.deporte)}
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
                      /* ===================== MODO FÚTBOL (MASCULINO O FEMENINO) ===================== */
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

                        {/* Botones de Ganador para Fútbol */}
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

        {/* ================= SECCIÓN: 👑 CORONAR CAMPEONES (3 CATEGORÍAS) ================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>👑</span>
                Coronar Campeones
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Define o actualiza a los campeones oficiales para Fútbol 5 Masculino, Fútbol 5 Femenino y Pádel.
              </p>
            </div>
            {isLoadingCampeones && (
              <span className="text-xs text-slate-500 animate-pulse">Sincronizando campeones...</span>
            )}
          </div>

          {mensajeCampeon && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium text-center">
              {mensajeCampeon}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bloque 1: Fútbol 5 Masculino */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
                  ⚽ Fútbol Masculino
                </span>
                {campeonFutbolMasc && (
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={campeonFutbolMasc.equipo_nombre}>
                    👑 {campeonFutbolMasc.equipo_nombre}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipo Campeón Masculino:
                </label>
                <select
                  value={seleccionFutbolMasc || campeonFutbolMasc?.equipo_nombre || ''}
                  onChange={(e) => setSeleccionFutbolMasc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Elige el Campeón --</option>
                  {equiposFutbolMasc.map((eq) => (
                    <option key={eq.id} value={eq.nombre}>
                      {eq.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleGuardarCampeon('futbol_masculino', 'Fútbol 5 Masculino', seleccionFutbolMasc || campeonFutbolMasc?.equipo_nombre || '')}
                disabled={savingCampeon === 'futbol_masculino' || !(seleccionFutbolMasc || campeonFutbolMasc?.equipo_nombre)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {savingCampeon === 'futbol_masculino' ? 'Guardando...' : 'Guardar Campeón'}
              </button>
            </div>

            {/* Bloque 2: Fútbol 5 Femenino */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider bg-fuchsia-100 text-fuchsia-800 px-3 py-1 rounded-lg border border-fuchsia-200">
                  ⚽ Fútbol Femenino
                </span>
                {campeonFutbolFem && (
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={campeonFutbolFem.equipo_nombre}>
                    👑 {campeonFutbolFem.equipo_nombre}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipo Campeón Femenino:
                </label>
                <select
                  value={seleccionFutbolFem || campeonFutbolFem?.equipo_nombre || ''}
                  onChange={(e) => setSeleccionFutbolFem(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="">-- Elige la Campeona --</option>
                  {equiposFutbolFem.map((eq) => (
                    <option key={eq.id} value={eq.nombre}>
                      {eq.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleGuardarCampeon('futbol_femenino', 'Fútbol 5 Femenino', seleccionFutbolFem || campeonFutbolFem?.equipo_nombre || '')}
                disabled={savingCampeon === 'futbol_femenino' || !(seleccionFutbolFem || campeonFutbolFem?.equipo_nombre)}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {savingCampeon === 'futbol_femenino' ? 'Guardando...' : 'Guardar Campeona'}
              </button>
            </div>

            {/* Bloque 3: Pádel */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 px-3 py-1 rounded-lg border border-sky-200">
                  🎾 Pádel
                </span>
                {campeonPadel && (
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={campeonPadel.equipo_nombre}>
                    👑 {campeonPadel.equipo_nombre}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pareja Campeona de Pádel:
                </label>
                <select
                  value={seleccionPadel || campeonPadel?.equipo_nombre || ''}
                  onChange={(e) => setSeleccionPadel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Elige la Pareja Campeona --</option>
                  {equiposPadel.map((eq) => (
                    <option key={eq.id} value={eq.nombre}>
                      {eq.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleGuardarCampeon('padel', 'Pádel', seleccionPadel || campeonPadel?.equipo_nombre || '')}
                disabled={savingCampeon === 'padel' || !(seleccionPadel || campeonPadel?.equipo_nombre)}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {savingCampeon === 'padel' ? 'Guardando...' : 'Guardar Campeón'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Componente principal exportado con validación de PIN en el cliente
export const PanelAdmin: React.FC = () => {
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const pin = window.prompt('Ingrese el PIN de administrador:');
    if (pin === '9173000') {
      setAutorizado(true);
    }
  }, []);

  // Si no está autorizado o se canceló el prompt, no monta el contenido ni ejecuta peticiones
  if (!autorizado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-red-500 tracking-tight text-center">
          ⛔ ACCESO DENEGADO
        </h1>
      </div>
    );
  }

  return <PanelAdminContenido />;
};
