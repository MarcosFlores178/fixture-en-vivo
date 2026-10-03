import useSWR from 'swr';

export interface Campeon {
  id: string;
  deporte: string;
  equipo_nombre: string;
}

const fetcher = async (url: string): Promise<Campeon[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener los campeones: ${response.statusText}`);
  }
  return response.json();
};

export const useCampeones = () => {
  const { data, error, isLoading, mutate } = useSWR<Campeon[]>('/api/campeones', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });

  return {
    campeones: data ?? [],
    isLoading,
    error,
    mutate,
  };
};
