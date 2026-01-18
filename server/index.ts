import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { VirtualMachine, LxcContainer, IsoImage, VMStatus } from '../src/types';
import { readDb, writeDb } from './db';
import si from 'systeminformation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- API Routes ---

// 1. VMs
app.get('/api/vms', (req: Request, res: Response) => {
  const db = readDb(); // Read from file
  res.json(db.vms);
});

app.post('/api/vms/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const target = db.vms.find(v => v.id === id);
  
  if (target) {
    target.status = target.status === VMStatus.RUNNING ? VMStatus.STOPPED : VMStatus.RUNNING;
    writeDb(db); // Save changes to file
    res.json(target);
  } else {
    res.status(404).json({ error: "VM not found" });
  }
});

// 2. Containers
app.get('/api/lxc', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.containers);
});

app.post('/api/lxc/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const target = db.containers.find(c => c.id === id);
  
  if (target) {
    target.status = target.status === VMStatus.RUNNING ? VMStatus.STOPPED : VMStatus.RUNNING;
    writeDb(db);
    res.json(target);
  } else {
    res.status(404).json({ error: "Container not found" });
  }
});

// 3. Images
app.get('/api/images', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.images);
});

app.delete('/api/images/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = readDb();
    db.images = db.images.filter(i => i.id !== id);
    writeDb(db);
    res.json({ success: true });
});



// --- Serve React Frontend ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 4. System Stats (Real-time)
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const [cpu, mem] = await Promise.all([
      si.currentLoad(),
      si.mem()
    ]);

    res.json({
      cpu: Math.round(cpu.currentLoad),
      ram: Math.round((mem.active / mem.total) * 100),
      totalMemGB: Math.round(mem.total / 1024 / 1024 / 1024)
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to read system stats" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});