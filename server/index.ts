import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { VirtualMachine, LxcContainer, IsoImage, VMStatus } from '../src/types';
import { readDb, writeDb } from './db';
import { startInstance, stopInstance } from './hypervisor';
import si from 'systeminformation';
import { startInstance, stopInstance, createInstance } from './hypervisor'; //

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- API Routes ---

// 0. System Stats (Real-time)
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

// 1. VMs
app.get('/api/vms', (req: Request, res: Response) => {
  const db = readDb(); // Read from file
  res.json(db.vms);
});

app.post('/api/vms/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const target = db.vms.find(v => v.id === id);
  
  if (!target) return res.status(404).json({ error: "VM not found" });

  try {
    const isRunning = target.status === VMStatus.RUNNING;
    
    if (isRunning) {
        await stopInstance(id); // Uses LXD Logic
    } else {
        await startInstance(id); // Uses LXD Logic
    }

    // Update DB
    target.status = isRunning ? VMStatus.STOPPED : VMStatus.RUNNING;
    writeDb(db);
    res.json(target);

  } catch (error: any) {
    console.error("LXD Error:", error.message);
    // Fallback for simulation
    target.status = target.status === VMStatus.RUNNING ? VMStatus.STOPPED : VMStatus.RUNNING;
    writeDb(db);
    res.json(target);
  }
});

// 2. Containers
app.post('/api/lxc/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const target = db.containers.find(c => c.id === id);
  
  if (!target) return res.status(404).json({ error: "Container not found" });

  try {
    const isRunning = target.status === VMStatus.RUNNING;
    
    if (isRunning) {
        await stopInstance(id);
    } else {
        await startInstance(id);
    }

    target.status = isRunning ? VMStatus.STOPPED : VMStatus.RUNNING;
    writeDb(db);
    res.json(target);

  } catch (error: any) {
    console.error("LXD Error:", error.message);
    target.status = target.status === VMStatus.RUNNING ? VMStatus.STOPPED : VMStatus.RUNNING;
    writeDb(db);
    res.json(target);
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

// Create New Instance (VM or Container)
app.post('/api/instances', async (req: Request, res: Response) => {
    try {
        const { name, type, image, cpu, ram, storage } = req.body;

        // 1. Validate inputs
        if (!name || !image) {
            return res.status(400).json({ error: "Name and Image are required" });
        }

        // 2. Trigger LXD Creation (Simulated or Real)
        await createInstance({
            name,
            type: type === 'LXC' ? 'container' : 'virtual-machine',
            imageAlias: image,
            cpu: Number(cpu),
            ramGB: Number(ram)
        });

        // 3. Update Local Database (database.json)
        // We do this so the UI updates immediately without needing to re-fetch everything from LXD
        const db = readDb();
        const newItem = {
            id: `${type.toLowerCase()}-${Date.now()}`,
            name,
            status: VMStatus.STOPPED, // New instances start stopped usually
            // Map the rest of your specific fields...
            os: image.includes('ubuntu') ? 'Ubuntu' : 'Alpine',
            cpuCores: Number(cpu), // or cpuLimit for LXC
            ramGB: Number(ram),    // or ramLimit
            diskSizeGB: Number(storage),
            attachedDevices: [],
            snapshots: [],
            // LXC specific fields if needed
            distro: image.split('/')[0], 
            ipAddress: '-',
            cpuLimit: Number(cpu),
            ramLimit: Number(ram),
            diskUsage: 0
        };

        if (type === 'ISO' || type === 'VM') { // Assuming 'VM' for virtual machines
             db.vms.push(newItem as any); // Type casting for simplicity in this tutorial
        } else {
             db.containers.push(newItem as any);
        }

        writeDb(db);
        
        // Return the new item to the frontend
        res.json(newItem);

    } catch (error: any) {
        console.error("Creation Failed:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- Serve React Frontend ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});