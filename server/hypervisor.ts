import { readDb } from './db';

// --- Configuration ---
// In a real setup, LXD exposes a Unix socket or an HTTPS port.
// For now, we will simulate the connection unless you have a real LXD IP.
const LXD_CONFIG = {
  host: process.env.LXD_HOST || 'https://192.168.1.50:8443', // Your Linux Server IP
  cert: process.env.LXD_CERT, // Client certificate (needed later)
  key: process.env.LXD_KEY,   // Client key (needed later)
};

// --- Helper: Talk to LXD API ---
const callLxdApi = async (path: string, method: string = 'GET', body?: any) => {
    // NOTE: This requires setup on the real server (exposing LXD to network).
    // For this step, we are just defining the structure.
    
    // In a real app, you would use an https agent with the certificates here.
    const url = `${LXD_CONFIG.host}/1.0${path}`;
    
    console.log(`[LXD] ${method} ${url}`);

    // Mocking the call for now because you are on Mac M3
    // In production, you would do:
    // const res = await fetch(url, { method, body: JSON.stringify(body) ... });
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    
    // Return fake success
    return { status: 'Success', metadata: {} };
};

// --- Instance Actions (Works for both VMs and Containers in LXD) ---

export const startInstance = async (id: string) => {
    const db = readDb();
    
    // Check both VMs and Containers lists
    const vm = db.vms.find(v => v.id === id);
    const container = db.containers.find(c => c.id === id);
    const target = vm || container;

    if (!target) throw new Error("Instance not found in DB");

    console.log(`[LXD] Requesting start for: ${target.name}`);

    // LXD API: PUT /1.0/instances/<name>/state
    await callLxdApi(`/instances/${target.name}/state`, 'PUT', {
        action: 'start',
        timeout: 30
    });

    return true;
};

export const stopInstance = async (id: string) => {
    const db = readDb();
    const vm = db.vms.find(v => v.id === id);
    const container = db.containers.find(c => c.id === id);
    const target = vm || container;

    if (!target) throw new Error("Instance not found");

    console.log(`[LXD] Requesting stop for: ${target.name}`);

    // LXD API: PUT /1.0/instances/<name>/state
    await callLxdApi(`/instances/${target.name}/state`, 'PUT', {
        action: 'stop',
        timeout: 30,
        force: false
    });

    return true;
};

// New Type definition for Creation Params
interface CreateParams {
    name: string;
    type: 'virtual-machine' | 'container';
    imageAlias: string; // e.g., "ubuntu/22.04"
    cpu: number;
    ramGB: number;
}

export const createInstance = async (params: CreateParams) => {
    console.log(`[LXD] Creating ${params.type}: ${params.name} (Image: ${params.imageAlias})...`);

    // LXD API Payload Structure
    const payload = {
        name: params.name,
        type: params.type, 
        source: {
            type: "image",
            alias: params.imageAlias
        },
        profiles: ["default"], // We assume a 'default' profile exists in LXD
        config: {
            "limits.cpu": params.cpu.toString(),
            "limits.memory": `${params.ramGB}GB`
        }
    };

    // Call LXD API (POST /1.0/instances)
    await callLxdApi('/instances', 'POST', payload);

    return true;
};