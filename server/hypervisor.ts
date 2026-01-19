import { readDb } from './db';
import http from 'http';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
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

const waitForOperation = async (operationId: string) => {
    for (let i = 0; i < 60; i++) {
        const res = await callLxdApi(`/operations/${operationId}`, 'GET');
        const op = res.metadata;
        if (op.status === 'Success') return true;
        if (op.status === 'Failure') throw new Error(op.err || 'Operation failed');
        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error("Operation timed out");
};

// ==========================================
// CORE INSTANCE FUNCTIONS
// ==========================================

export const fetchLxdInstances = async () => {
    try {
        const response = await callLxdApi('/instances?recursion=1', 'GET');
        if (!response || !response.metadata) return [];

        return response.metadata.map((inst: any) => {
            const isVm = inst.type === 'virtual-machine';
            
            // --- FIX RAM CALCULATION ---
            // LXD might return "4GB" (string) or "4294967296" (bytes)
            let ramBytes = 0;
            const rawLimit = inst.config['limits.memory'];
            
            if (rawLimit) {
                if (rawLimit.endsWith('GB')) ramBytes = parseFloat(rawLimit) * 1024 * 1024 * 1024;
                else if (rawLimit.endsWith('MB')) ramBytes = parseFloat(rawLimit) * 1024 * 1024;
                else ramBytes = parseInt(rawLimit); // Assume bytes if no suffix
            }

            // Convert to GB, rounded to 1 decimal
            const ramGB = ramBytes > 0 ? Math.round((ramBytes / 1024 / 1024 / 1024) * 10) / 10 : 0.5;

            return {
                id: `lxd-${inst.name}`,
                name: inst.name,
                type: isVm ? 'VM' : 'LXC',
                status: inst.status === 'Running' ? 'Running' : 'Stopped',
                os: inst.config['image.os'] || 'Linux',
                cpu: parseInt(inst.config['limits.cpu'] || '1'),
                ramGB: ramGB,
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

export const deleteInstance = async (id: string) => {
    const db = readDb();
    const target = db.vms.find(v => v.id === id) || db.containers.find(c => c.id === id);
    if (!target) throw new Error("Instance not found");

    console.log(`[LXD] Deleting ${target.name}...`);
    
    try {
        await stopInstance(id);
    } catch (e) { /* ignore */ }

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
    
    // --- FIX: Handle "ubuntu/lts" correctly ---
    if (params.imageAlias === 'ubuntu/lts') {
         source = { 
            type: "image", 
            mode: "pull", 
            server: "https://cloud-images.ubuntu.com/releases", 
            protocol: "simplestreams", 
            alias: "lts" 
        };
    } else if (params.imageAlias.startsWith('ubuntu/')) {
        source = { 
            type: "image", 
            mode: "pull", 
            server: "https://cloud-images.ubuntu.com/releases", 
            protocol: "simplestreams", 
            alias: params.imageAlias.replace('ubuntu/', '') 
        };
    } else {
        source = { 
            type: "image", 
            mode: "pull", 
            server: "https://images.linuxcontainers.org", 
            protocol: "simplestreams", 
            alias: params.imageAlias.replace('images/', '') 
        };
    }

    // --- FIX: Send RAM as Bytes to avoid "Invalid Value" error ---
    const ramBytes = Math.floor(params.ramGB * 1024 * 1024 * 1024);

    const config: any = {
        "limits.cpu": params.cpu.toString(),
        "limits.memory": `${ramBytes}`, // Send raw bytes string
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

// ==========================================
// HARDWARE PASSTHROUGH LOGIC
// ==========================================

export const getHostDevices = async () => {
    try {
        const { stdout } = await execPromise('lsusb');
        const lines = stdout.split('\n').filter(line => line.length > 0);
        const instances = await fetchLxdInstances();
        const attachedMap = new Map<string, string>(); 

        for (const inst of instances) {
             const res = await callLxdApi(`/instances/${inst.name}`, 'GET');
             const devices = res.metadata?.devices || {};
             
             for (const [devName, config] of Object.entries(devices) as [string, any][]) {
                 if (config.type === 'usb' && config.vendorid && config.productid) {
                     const key = `${config.vendorid}:${config.productid}`;
                     attachedMap.set(key, inst.name);
                 }
             }
        }

        return lines.map(line => {
            const parts = line.split(' ');
            const idIndex = parts.findIndex(p => p.includes(':') && p.length === 9);
            if (idIndex === -1) return null;

            const id = parts[idIndex];
            const [vendor, product] = id.split(':');
            const name = parts.slice(idIndex + 1).join(' ');

            if (name.includes('root hub')) return null;

            return {
                id: id,
                name: name || 'Unknown USB Device',
                type: 'USB',
                vendorId: vendor,
                productId: product,
                inUseBy: attachedMap.get(id) || null
            };
        }).filter(Boolean); 

    } catch (error) {
        console.error("Failed to scan USB devices:", error);
        return [];
    }
};

export const attachUsbDevice = async (vmName: string, device: any) => {
    console.log(`[LXD] Attaching USB ${device.id} to ${vmName}...`);
    const res = await callLxdApi(`/instances/${vmName}`, 'GET');
    const currentConfig = res.metadata;
    const devName = `usb-${device.vendorId}-${device.productId}`;
    
    const newDevices = {
        ...currentConfig.devices,
        [devName]: {
            type: 'usb',
            vendorid: device.vendorId,
            productid: device.productId,
        }
    };

    const updateRes = await callLxdApi(`/instances/${vmName}`, 'PUT', {
        ...currentConfig,
        devices: newDevices
    });

    if (updateRes.type === 'async' && updateRes.metadata?.id) {
        await waitForOperation(updateRes.metadata.id);
    }
    return true;
};

export const detachUsbDevice = async (vmName: string, deviceId: string) => {
    console.log(`[LXD] Detaching USB ${deviceId} from ${vmName}...`);
    const res = await callLxdApi(`/instances/${vmName}`, 'GET');
    const currentConfig = res.metadata;
    const [vendor, product] = deviceId.split(':');
    const targetDevName = `usb-${vendor}-${product}`;

    if (!currentConfig.devices[targetDevName]) return false;

    delete currentConfig.devices[targetDevName];

    const updateRes = await callLxdApi(`/instances/${vmName}`, 'PUT', currentConfig);

    if (updateRes.type === 'async' && updateRes.metadata?.id) {
        await waitForOperation(updateRes.metadata.id);
    }
    return true;
};