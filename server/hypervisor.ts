import { readDb } from './db';
import http from 'http';
import fs from 'fs';

const LXD_SOCKET_PATH = '/var/snap/lxd/common/lxd/unix.socket';

// --- Helper: Talk to LXD API ---
const callLxdApi = (path: string, method: string = 'GET', body?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(LXD_SOCKET_PATH)) {
            console.log(`[Simulation] ${method} ${path}`);
            // Return empty for simulation so app doesn't crash on Mac
            setTimeout(() => resolve({ status: 'Success', metadata: [] }), 500);
            return;
        }

        console.log(`[Real-LXD] ${method} ${path}`);

        const options: http.RequestOptions = {
            socketPath: LXD_SOCKET_PATH,
            path: `/1.0${path}`,
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                         resolve({ type: 'error', error: json.error || json.metadata?.err || 'Unknown Error' });
                    }
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (err) => {
            console.error("[LXD Connection Failed]", err.message);
            reject(err); 
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

// --- HELPER: Wait for Async Operation ---
const waitForOperation = async (operationId: string) => {
    console.log(`[LXD] Waiting for operation: ${operationId}...`);
    for (let i = 0; i < 60; i++) {
        const res = await callLxdApi(`/operations/${operationId}`, 'GET');
        const op = res.metadata;
        if (op.status === 'Success') return true;
        if (op.status === 'Failure') throw new Error(op.err || 'Operation failed');
        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error("Operation timed out");
};

// --- Actions ---

export const fetchLxdInstances = async () => {
    try {
        const response = await callLxdApi('/instances?recursion=1', 'GET');
        if (!response || !response.metadata) return [];

        return response.metadata.map((inst: any) => {
            const isVm = inst.type === 'virtual-machine';
            const ramBytes = parseInt(inst.config['limits.memory'] || '0');
            const ramGB = ramBytes > 0 ? ramBytes / 1024 / 1024 / 1024 : 0;

            return {
                id: `lxd-${inst.name}`,
                name: inst.name,
                type: isVm ? 'VM' : 'LXC',
                status: inst.status === 'Running' ? 'Running' : 'Stopped',
                os: inst.config['image.os'] || 'Linux',
                cpu: parseInt(inst.config['limits.cpu'] || '1'),
                ramGB: ramGB || 0.5,
                storage: 10, 
                ip: inst.state?.network?.eth0?.addresses?.find((a: any) => a.family === 'inet')?.address || '-'
            };
        });
    } catch (error) {
        console.error("Failed to fetch LXD instances:", error);
        return [];
    }
};

export const startInstance = async (id: string) => {
    const db = readDb();
    const target = db.vms.find(v => v.id === id) || db.containers.find(c => c.id === id);
    if (!target) throw new Error("Instance not found in DB");

    const res = await callLxdApi(`/instances/${target.name}/state`, 'PUT', { action: 'start', timeout: 30 });
    if (res.type === 'async' && res.metadata?.id) await waitForOperation(res.metadata.id);
    return true;
};

export const stopInstance = async (id: string) => {
    const db = readDb();
    const target = db.vms.find(v => v.id === id) || db.containers.find(c => c.id === id);
    if (!target) throw new Error("Instance not found");

    const res = await callLxdApi(`/instances/${target.name}/state`, 'PUT', { action: 'stop', timeout: 30, force: true });
    if (res.type === 'async' && res.metadata?.id) await waitForOperation(res.metadata.id);
    return true;
};

// --- NEW: Delete Logic ---
export const deleteInstance = async (id: string) => {
    const db = readDb();
    const target = db.vms.find(v => v.id === id) || db.containers.find(c => c.id === id);
    if (!target) throw new Error("Instance not found");

    console.log(`[LXD] Deleting ${target.name}...`);
    
    // 1. Force Stop first (LXD can't delete running instances)
    try {
        await stopInstance(id);
    } catch (e) {
        // Ignore error if it was already stopped
    }

    // 2. Delete
    const res = await callLxdApi(`/instances/${target.name}`, 'DELETE');
    if (res.type === 'async' && res.metadata?.id) await waitForOperation(res.metadata.id);
    
    return true;
};

interface CreateParams {
    name: string;
    type: 'virtual-machine' | 'container';
    imageAlias: string;
    cpu: number;
    ramGB: number;
}

export const createInstance = async (params: CreateParams) => {
    console.log(`[LXD] Creating ${params.type}: ${params.name}...`);

    let source = {};
    if (params.imageAlias.startsWith('ubuntu/')) {
        source = { type: "image", mode: "pull", server: "https://cloud-images.ubuntu.com/releases", protocol: "simplestreams", alias: params.imageAlias.replace('ubuntu/', '') };
    } else {
        source = { type: "image", mode: "pull", server: "https://images.linuxcontainers.org", protocol: "simplestreams", alias: params.imageAlias.replace('images/', '') };
    }

    const config: any = {
        "limits.cpu": params.cpu.toString(),
        "limits.memory": `${params.ramGB}GB`,
    };

    if (params.type === 'virtual-machine') {
        config["security.secureboot"] = "false";
    }

    const payload = {
        name: params.name,
        type: params.type, 
        source: source,
        profiles: ["default"],
        config: config
    };

    const res = await callLxdApi('/instances', 'POST', payload);
    
    if (res.type === 'error') throw new Error(res.error);
    if (res.type === 'async' && res.metadata?.id) await waitForOperation(res.metadata.id);
    
    return true;
};