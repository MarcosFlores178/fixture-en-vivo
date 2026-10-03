import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Obtener todos los partidos
app.get('/api/partidos', async (_req: Request, res: Response) => {
  try {
    const partidos = await prisma.partido.findMany();
    res.json(partidos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los partidos' });
  }
});

// 2. Crear un nuevo partido
app.post('/api/partidos', async (req: Request, res: Response) => {
  try {
    const { deporte, fase, equipo_a, equipo_b } = req.body;
    const nuevoPartido = await prisma.partido.create({
      data: {
        deporte,
        fase,
        equipo_a,
        equipo_b,
      },
    });
    res.status(201).json(nuevoPartido);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el partido' });
  }
});

// 3. Actualizar marcador y estado de un partido
app.patch('/api/partidos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { marcador_a, marcador_b, estado } = req.body;

    const partidoActualizado = await prisma.partido.update({
      where: { id },
      data: {
        ...(marcador_a !== undefined && { marcador_a }),
        ...(marcador_b !== undefined && { marcador_b }),
        ...(estado !== undefined && { estado }),
      },
    });

    res.json(partidoActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el partido' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de Fixture en vivo escuchando en http://localhost:${PORT}`);
});
