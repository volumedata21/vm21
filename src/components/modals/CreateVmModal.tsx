import React from 'react';
export const CreateVmModal: React.FC<any> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded text-white">
            <h2>Create VM Modal</h2>
            <button onClick={onClose} className="mt-4 bg-red-500 px-4 py-2 rounded">Close</button>
        </div>
    </div>
);