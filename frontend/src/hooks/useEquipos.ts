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

  const eliminarEquipo = async (id: number | string) => {
    try {
      const response = await fetch(`/api/equipos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Error al eliminar el equipo');
      }
      // Actualizar el estado local para quitar el equipo de la lista
      await mutate(
        (current) => (current || []).filter((eq) => String(eq.id) !== String(id)),
        { revalidate: true }
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    equipos: data ?? [],
    isLoading,
    error,
    mutate,
    eliminarEquipo,
  };
};
