import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { VirtualMachine, LxcContainer, IsoImage, VMStatus } from '../src/types';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This is where we will save the data
const DB_FILE = path.join(__dirname, 'database.json');

// Define the shape of our database
interface DatabaseSchema {
  vms: VirtualMachine[];
  containers: LxcContainer[];
  images: IsoImage[];
}

// Default data (used if no file exists)
const DEFAULT_DATA: DatabaseSchema = {
  vms: [
    {
        id: 'vm-seed-1',
        name: 'Seed VM (Persisted)',
        os: 'Ubuntu',
        status: VMStatus.STOPPED,
        cpuCores: 2,
        ramGB: 4,
        diskSizeGB: 20,
        attachedDevices: [],
        notes: 'This VM lives in the database.json file!',
        snapshots: []
    }
  ],
  containers: [],
  images: []
};

// --- Helper Functions ---

export const readDb = (): DatabaseSchema => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // If file doesn't exist, create it with defaults
      writeDb(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading DB:", error);
    return DEFAULT_DATA;
  }
};

export const writeDb = (data: DatabaseSchema) => {
  try {
    // 'null, 2' formats the JSON nicely with indentation
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing DB:", error);
  }
};