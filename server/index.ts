import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { VirtualMachine, LxcContainer, IsoImage, VMStatus } from '../src/types';
import { readDb, writeDb } from './db';
import si from 'systeminformation';
// Updated Import to include deleteInstance and fetchLxdInstances
import { startInstance, stopInstance, createInstance, deleteInstance, fetchLxdInstances } from './hypervisor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- SYNC FUNCTION (Runs on Startup) ---
const syncWithLxd = async () => {
    console.log("🔄 Syncing with LXD...");
    const realInstances = await fetchLxdInstances();
    
    if (realInstances.length > 0) {
        const db = readDb();
        
        // Convert LXD data to App Schema
        const newVms = realInstances.filter((i: any) => i.type === 'VM').map((i: any) => ({
            id: i.id,
            name: i.name,
            os: i.os,
            status: i.status === 'Running' ? VMStatus.RUNNING : VMStatus.STOPPED,
            cpuCores: i.cpu,
            ramGB: i.ramGB,
            diskSizeGB: i.storage,
            attachedDevices: [],
            snapshots: [],
            ipAddress: i.ip
        }));

        const newContainers = realInstances.filter((i: any) => i.type === 'LXC').map((i: any) => ({
            id: i.id,
            name: i.name,
            distro: i.os,
            status: i.status === 'Running' ? VMStatus.RUNNING : VMStatus.STOPPED,
            ipAddress: i.ip,
            cpuLimit: i.cpu,
            ramLimit: i.ramGB,
            diskUsage: 0,
            snapshots: []
        }));

        // Overwrite DB with real data
        db.vms = newVms;
        db.containers = newContainers;
        
        writeDb(db);
        console.log(`✅ Sync Complete: Found ${newVms.length} VMs and ${newContainers.length} Containers.`);
    } else {
        console.log("⚠️ No instances found in LXD (or connection failed).");
    }
};

// --- API Routes ---

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const [cpu, mem] = await Promise.all([si.currentLoad(), si.mem()]);
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

app.get('/api/vms', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.vms);
});

app.post('/api/vms/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const target = db.vms.find(v => v.id === id);
  
  if (!target) return res.status(404).json({ error: "VM not found" });

  try {
    const isRunning = target.status === VMStatus.RUNNING;
    if (isRunning) await stopInstance(id);
    else await startInstance(id);

    target.status = isRunning ? VMStatus.STOPPED : VMStatus.RUNNING;
    writeDb(db);
    res.json(target);
  } catch (error: any) {
    console.error("LXD Error:", error.message);
    writeDb(db); // Still sync DB
    res.json(target);
  }
});

app.get('/api/lxc', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.containers);
});

app.post('/api/lxc/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const target = db.containers.find(c => c.id === id);
  if (!target) return res.status(404).json({ error: "Container not found" });

  try {
    const isRunning = target.status === VMStatus.RUNNING;
    if (isRunning) await stopInstance(id);
    else await startInstance(id);

    target.status = isRunning ? VMStatus.STOPPED : VMStatus.RUNNING;
    writeDb(db);
    res.json(target);
  } catch (error: any) {
    console.error("LXD Error:", error.message);
    res.json(target);
  }
});

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

// --- NEW: Delete Instance Route ---
app.delete('/api/instances/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = readDb();
    
    const isVm = db.vms.some(v => v.id === id);
    const isContainer = db.containers.some(c => c.id === id);

    if (!isVm && !isContainer) return res.status(404).json({ error: "Instance not found" });

    try {
        // Call the Hypervisor Delete Logic
        await deleteInstance(id);

        if (isVm) db.vms = db.vms.filter(v => v.id !== id);
        else db.containers = db.containers.filter(c => c.id !== id);
        
        writeDb(db);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Delete Failed:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/instances', async (req: Request, res: Response) => {
    try {
        const { name, type, image, cpu, ram, storage } = req.body;
        if (!name || !image) return res.status(400).json({ error: "Name and Image required" });

        await createInstance({
            name,
            type: type === 'LXC' ? 'container' : 'virtual-machine',
            imageAlias: image,
            cpu: Number(cpu),
            ramGB: Number(ram)
        });

        // Run a sync after create to ensure DB is perfect
        await syncWithLxd();
        const db = readDb();
        
        // Find the new item that Sync just added
        const newItem = db.vms.find(v => v.name === name) || db.containers.find(c => c.name === name);
        res.json(newItem);
    } catch (error: any) {
        console.error("Creation Failed:", error);
        res.status(500).json({ error: error.message });
    }
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Sync on startup
syncWithLxd();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});