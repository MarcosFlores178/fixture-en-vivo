import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ================= PARTIDOS =================

// 1. Obtener todos los partidos
app.get('/api/partidos', async (_req: Request, res: Response) => {
  try {
    const partidos = await prisma.partido.findMany({
      orderBy: { id: 'asc' },
    });
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

// 3. Actualizar marcador, sets, ganador y estado de un partido
app.patch('/api/partidos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      marcador_a,
      marcador_b,
      estado,
      set1_a,
      set2_a,
      set3_a,
      set1_b,
      set2_b,
      set3_b,
      ganador,
    } = req.body;

    const data: any = {};
    if (marcador_a !== undefined) data.marcador_a = String(marcador_a);
    if (marcador_b !== undefined) data.marcador_b = String(marcador_b);
    if (estado !== undefined) data.estado = String(estado);
    if (ganador !== undefined) data.ganador = ganador;
    if (set1_a !== undefined) data.set1_a = Number(set1_a);
    if (set2_a !== undefined) data.set2_a = Number(set2_a);
    if (set3_a !== undefined) data.set3_a = Number(set3_a);
    if (set1_b !== undefined) data.set1_b = Number(set1_b);
    if (set2_b !== undefined) data.set2_b = Number(set2_b);
    if (set3_b !== undefined) data.set3_b = Number(set3_b);

    const partidoActualizado = await prisma.partido.update({
      where: { id },
      data,
    });

    res.json(partidoActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el partido' });
  }
});

// ================= EQUIPOS =================

// 4. Obtener todos los equipos
app.get('/api/equipos', async (_req: Request, res: Response) => {
  try {
    const equipos = await prisma.equipo.findMany({
      orderBy: { nombre: 'asc' },
    });
    res.json(equipos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los equipos' });
  }
});

// 5. Crear un nuevo equipo
app.post('/api/equipos', async (req: Request, res: Response) => {
  try {
    const { nombre, deporte } = req.body;
    const nuevoEquipo = await prisma.equipo.create({
      data: {
        nombre,
        deporte,
      },
    });
    res.status(201).json(nuevoEquipo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el equipo' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de Fixture en vivo escuchando en http://localhost:${PORT}`);
});
