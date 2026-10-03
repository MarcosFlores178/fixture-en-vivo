import React, { useMemo } from 'react';
import { usePartidos, Partido } from '../hooks/usePartidos';
import { useCampeones, Campeon } from '../hooks/useCampeones';

export const VistaPublica: React.FC = () => {
  const { partidos, isLoading, error } = usePartidos();
  const { campeones } = useCampeones();

  // Función para determinar si el partido corresponde a Pádel
  const esPadel = (dep: string) => {
    return dep.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'padel';
  };

  // Agrupamiento dinámico por deporte
  const partidosPorDeporte = useMemo(() => {
    return partidos.reduce<Record<string, Partido[]>>((acc, partido) => {
      const dep = partido.deporte || 'General';
      if (!acc[dep]) {
        acc[dep] = [];
      }
      acc[dep].push(partido);
      return acc;
    }, {});
  }, [partidos]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl font-medium text-gray-300">Cargando fixture en tiempo real...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-red-950/50 border border-red-500/40 p-6 rounded-2xl max-w-md text-center">
          <p className="text-xl font-semibold text-red-400 mb-2">Error de conexión</p>
          <p className="text-sm text-gray-300">{error.message || 'No se pudieron sincronizar los partidos.'}</p>
        </div>
      </div>
    );
  }

  const deportes = Object.keys(partidosPorDeporte);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4 sm:px-8 lg:px-12 font-sans">
      {/* Encabezado Principal */}
      <header className="max-w-7xl mx-auto mb-10 pb-6 border-b border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="w-3 h-8 bg-emerald-500 rounded-full inline-block" />
            Fixture en Vivo
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Tablero en directo para Fútbol 5 y Pádel actualizado cada 5 segundos
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-800/80 px-4 py-2 rounded-full border border-gray-700 w-fit">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          Sincronización activa
        </div>
      </header>

      {/* Secciones por Deporte */}
      <main className="max-w-7xl mx-auto space-y-12">
        {deportes.length === 0 ? (
          <div className="space-y-8">
            <div className="text-center py-20 bg-gray-800/40 rounded-2xl border border-gray-800">
              <p className="text-gray-400 text-lg">No hay partidos programados en este momento.</p>
            </div>
            {/* Si no hay partidos pero ya hay campeones coronados */}
            {campeones.length > 0 && (
              <div className="space-y-6">
                {campeones.map((c) => (
                  <div
                    key={c.id}
                    className="mt-10 p-8 rounded-2xl text-center shadow-2xl shadow-yellow-500/40 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 transform hover:scale-105 transition-transform"
                  >
                    <p className="text-yellow-900 font-black tracking-widest text-xl mb-4">
                      🏆 CAMPEÓN DE {c.deporte.toUpperCase()} 🏆
                    </p>
                    <h3 className="text-6xl font-extrabold text-white drop-shadow-lg">
                      {c.equipo_nombre}
                    </h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          deportes.map((deporte) => {
            // Verificar si existe campeón para este deporte
            const campeonDeporte = campeones.find(
              (c) => esPadel(c.deporte) === esPadel(deporte)
            );

            return (
              <section key={deporte} className="space-y-6">
                {/* Título de Deporte */}
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-wide uppercase text-gray-200">
                    {deporte}
                  </h2>
                  <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full font-semibold border border-gray-700">
                    {partidosPorDeporte[deporte].length} {partidosPorDeporte[deporte].length === 1 ? 'partido' : 'partidos'}
                  </span>
                </div>

                {/* Grid de Tarjetas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {partidosPorDeporte[deporte].map((partido) => {
                    const enJuego = partido.estado === 'en_juego';
                    const pendiente = partido.estado === 'pendiente';
                    const finalizado = partido.estado === 'finalizado';
                    const esDeportePadel = esPadel(partido.deporte);

                    const esGanadorA = finalizado && partido.ganador === partido.equipo_a;
                    const esGanadorB = finalizado && partido.ganador === partido.equipo_b;

                    // Lógica para color de sets en pádel
                    const getColorSet = (scorePropio: number, scoreRival: number) => {
                      if (enJuego) return 'text-emerald-400';
                      if (finalizado) {
                        return scorePropio > scoreRival ? 'text-amber-400' : 'text-white';
                      }
                      return 'text-gray-600';
                    };

                    return (
                      <div
                        key={partido.id}
                        className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 border ${
                          enJuego
                            ? 'bg-gray-800/90 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                            : finalizado
                            ? 'bg-gray-800/40 border-amber-500/30'
                            : 'bg-gray-800/30 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        {/* Cabecera de la tarjeta: Fase y Estado */}
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-700/60">
                          <span className="text-xs font-semibold tracking-wider uppercase text-gray-400 bg-gray-900/60 px-3 py-1 rounded-md border border-gray-800">
                            {partido.fase}
                          </span>

                          {enJuego ? (
                            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-3 py-1 rounded-full animate-pulse">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                              <span className="text-xs font-extrabold tracking-widest text-red-400">
                                EN VIVO
                              </span>
                            </div>
                          ) : finalizado ? (
                            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full text-amber-300">
                              <span className="text-xs font-extrabold tracking-wider">FINALIZADO</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-amber-400/90 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                              Pendiente
                            </span>
                          )}
                        </div>

                        {/* CUERPO DEL PARTIDO: CONDICIONAL SEGÚN DEPORTE */}
                        {esDeportePadel ? (
                          /* ===================== VISTA PÁDEL ===================== */
                          <div className="space-y-4">
                            <div className="bg-gray-900/90 rounded-2xl border border-gray-800/90 p-4">
                              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase pb-2 border-b border-gray-800">
                                <div className="col-span-6">Pareja / Jugadores</div>
                                <div className="col-span-2 text-center">Set 1</div>
                                <div className="col-span-2 text-center">Set 2</div>
                                <div className="col-span-2 text-center">Set 3</div>
                              </div>

                              {/* Fila Equipo A */}
                              <div className="grid grid-cols-12 items-center gap-2 py-3 border-b border-gray-800/60">
                                <div className="col-span-6 flex items-center gap-2">
                                  <span
                                    className={`text-base sm:text-lg font-bold truncate ${
                                      esGanadorA
                                        ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                                        : 'text-white'
                                    }`}
                                    title={partido.equipo_a}
                                  >
                                    {partido.equipo_a}
                                  </span>
                                  {esGanadorA && <span className="text-xl" title="Ganador">👑</span>}
                                </div>

                                <div className="col-span-2 text-center">
                                  <span className={`text-2xl sm:text-3xl font-black ${getColorSet(partido.set1_a ?? 0, partido.set1_b ?? 0)}`}>
                                    {partido.set1_a ?? 0}
                                  </span>
                                </div>
                                <div className="col-span-2 text-center">
                                  <span className={`text-2xl sm:text-3xl font-black ${getColorSet(partido.set2_a ?? 0, partido.set2_b ?? 0)}`}>
                                    {partido.set2_a ?? 0}
                                  </span>
                                </div>
                                <div className="col-span-2 text-center">
                                  <span className={`text-2xl sm:text-3xl font-black ${getColorSet(partido.set3_a ?? 0, partido.set3_b ?? 0)}`}>
                                    {partido.set3_a ?? 0}
                                  </span>
                                </div>
                              </div>

                              {/* Fila Equipo B */}
                              <div className="grid grid-cols-12 items-center gap-2 py-3 pt-4">
                                <div className="col-span-6 flex items-center gap-2">
                                  <span
                                    className={`text-base sm:text-lg font-bold truncate ${
                                      esGanadorB
                                        ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                                        : 'text-white'
                                    }`}
                                    title={partido.equipo_b}
                                  >
                                    {partido.equipo_b}
                                  </span>
                                  {esGanadorB && <span className="text-xl" title="Ganador">👑</span>}
                                </div>

                                <div className="col-span-2 text-center">
                                  <span className={`text-2xl sm:text-3xl font-black ${getColorSet(partido.set1_b ?? 0, partido.set1_a ?? 0)}`}>
                                    {partido.set1_b ?? 0}
                                  </span>
                                </div>
                                <div className="col-span-2 text-center">
                                  <span className={`text-2xl sm:text-3xl font-black ${getColorSet(partido.set2_b ?? 0, partido.set2_a ?? 0)}`}>
                                    {partido.set2_b ?? 0}
                                  </span>
                                </div>
                                <div className="col-span-2 text-center">
                                  <span className={`text-2xl sm:text-3xl font-black ${getColorSet(partido.set3_b ?? 0, partido.set3_a ?? 0)}`}>
                                    {partido.set3_b ?? 0}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Mensaje de ganador si está finalizado */}
                            {finalizado && partido.ganador && (
                              <div className="mt-3 text-center bg-amber-500/10 border border-amber-500/30 rounded-xl py-2 px-3">
                                <p className="text-xs text-amber-300 font-semibold flex items-center justify-center gap-1.5">
                                  👑 Ganador del partido: <span className="font-extrabold text-amber-400">{partido.ganador}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ===================== VISTA FÚTBOL ===================== */
                          <div>
                            <div className="flex items-center justify-between gap-4 my-2">
                              {/* Equipo A */}
                              <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center gap-1.5 sm:justify-start justify-center">
                                  {esGanadorA && <span className="text-xl">👑</span>}
                                  <p
                                    className={`text-lg sm:text-xl font-bold tracking-tight truncate ${
                                      esGanadorA ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'text-white'
                                    }`}
                                    title={partido.equipo_a}
                                  >
                                    {partido.equipo_a}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400 block mt-0.5">Local</span>
                              </div>

                              {/* Marcador Central Gigante */}
                              <div className="flex items-center justify-center px-4 py-2 bg-gray-900/80 rounded-xl border border-gray-800/80 min-w-[130px]">
                                {enJuego ? (
                                  <div className="flex items-center gap-2 text-5xl sm:text-6xl font-black text-white tracking-tight">
                                    <span className="text-emerald-400">{partido.marcador_a}</span>
                                    <span className="text-gray-600 text-3xl font-light select-none">-</span>
                                    <span className="text-emerald-400">{partido.marcador_b}</span>
                                  </div>
                                ) : finalizado ? (
                                  <div className="flex items-center gap-2 text-4xl sm:text-5xl font-black text-gray-200 tracking-tight">
                                    <span className={esGanadorA ? 'text-amber-400' : 'text-gray-300'}>{partido.marcador_a}</span>
                                    <span className="text-gray-600 text-3xl font-light select-none">-</span>
                                    <span className={esGanadorB ? 'text-amber-400' : 'text-gray-300'}>{partido.marcador_b}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-2xl font-bold text-gray-600 select-none">
                                    <span>{partido.marcador_a}</span>
                                    <span className="text-gray-700">-</span>
                                    <span>{partido.marcador_b}</span>
                                  </div>
                                )}
                              </div>

                              {/* Equipo B */}
                              <div className="flex-1 text-center sm:text-right">
                                <div className="flex items-center gap-1.5 sm:justify-end justify-center">
                                  <p
                                    className={`text-lg sm:text-xl font-bold tracking-tight truncate ${
                                      esGanadorB ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'text-white'
                                    }`}
                                    title={partido.equipo_b}
                                  >
                                    {partido.equipo_b}
                                  </p>
                                  {esGanadorB && <span className="text-xl">👑</span>}
                                </div>
                                <span className="text-xs text-gray-400 block mt-0.5">Visitante</span>
                              </div>
                            </div>

                            {/* Mensaje de ganador o pendiente */}
                            {finalizado && partido.ganador && (
                              <div className="mt-4 text-center bg-amber-500/10 border border-amber-500/30 rounded-xl py-2 px-3">
                                <p className="text-xs text-amber-300 font-semibold flex items-center justify-center gap-1.5">
                                  👑 Ganador del encuentro: <span className="font-extrabold text-amber-400">{partido.ganador}</span>
                                </p>
                              </div>
                            )}

                            {pendiente && (
                              <div className="mt-4 pt-3 border-t border-gray-800/80 text-center">
                                <p className="text-xs text-gray-400 italic">
                                  Partido programado para la fase {partido.fase}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Banner de Campeón Espectacular al final de la lista del deporte */}
                {campeonDeporte && (
                  <div className="mt-10 p-8 rounded-2xl text-center shadow-2xl shadow-yellow-500/40 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 transform hover:scale-105 transition-transform">
                    <p className="text-yellow-900 font-black tracking-widest text-xl mb-4">
                      🏆 CAMPEÓN DE {campeonDeporte.deporte.toUpperCase()} 🏆
                    </p>
                    <h3 className="text-6xl font-extrabold text-white drop-shadow-lg">
                      {campeonDeporte.equipo_nombre}
                    </h3>
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
};
