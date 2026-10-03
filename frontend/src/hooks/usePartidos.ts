import useSWR from 'swr';

export interface Partido {
  id: string;
  deporte: string;
  fase: string;
  equipo_a: string;
  equipo_b: string;
  marcador_a: string;
  marcador_b: string;
  estado: 'pendiente' | 'en_juego' | 'finalizado' | string;
}

const fetcher = async (url: string): Promise<Partido[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.statusText}`);
  }
  return response.json();
};

export const usePartidos = () => {
  // Ajusta la URL base según corresponda a tu entorno (ej. http://localhost:3001/api/partidos o /api/partidos con proxy)
  const endpoint = '/api/partidos';

  const { data, error, isLoading, mutate } = useSWR<Partido[]>(endpoint, fetcher, {
    refreshInterval: 5000, // Polling automático cada 5 segundos
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return {
    partidos: data ?? [],
    isLoading,
    error,
    mutate,
  };
};
