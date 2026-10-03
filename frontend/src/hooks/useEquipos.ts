import useSWR from 'swr';

export interface Equipo {
  id: string;
  nombre: string;
  deporte: string;
}

const fetcher = async (url: string): Promise<Equipo[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener equipos: ${response.statusText}`);
  }
  return response.json();
};

export const useEquipos = () => {
  const { data, error, isLoading, mutate } = useSWR<Equipo[]>('/api/equipos', fetcher, {
    revalidateOnFocus: true,
  });

  return {
    equipos: data ?? [],
    isLoading,
    error,
    mutate,
  };
};
