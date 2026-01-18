import React, { useState } from 'react';
import { X, Globe, FileUp, DownloadCloud } from 'lucide-react';

interface UploadModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const UploadImageModal: React.FC<UploadModalProps> = ({ onClose, onSubmit }) => {
  const [uploadType, setUploadType] = useState<'file' | 'url'>('url');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900">
                <h2 className="text-xl font-bold text-white tracking-wide">Add New Image</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
            </div>

            <div className="flex border-b border-white/5">
                <button 
                    onClick={() => setUploadType('url')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${uploadType === 'url' ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Download from URL
                </button>
                <button 
                    onClick={() => setUploadType('file')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${uploadType === 'file' ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Upload File
                </button>
            </div>

            <form onSubmit={onSubmit} className="p-8 space-y-6">
                <input type="hidden" name="uploadType" value={uploadType} />
                
                {uploadType === 'url' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Source URL</label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-slate-500"><Globe size={18} /></div>
                                <input name="url" type="url" required className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600" placeholder="https://releases.ubuntu.com/..." />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Image Name</label>
                            <input name="name" required className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600" placeholder="ubuntu-22.04.iso" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                         <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group">
                            <FileUp size={48} className="mb-4 group-hover:text-amber-400 transition-colors" />
                            <p className="text-sm font-medium">Click to browse or drag file here</p>
                            <input name="file" type="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                         <div className="text-xs text-center text-slate-600">Supports .iso, .img, .qcow2, .tar.xz</div>
                    </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-300 hover:text-white transition-colors font-medium">Cancel</button>
                    <button type="submit" className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-lg shadow-amber-900/40 hover:shadow-amber-500/30 transition-all flex items-center gap-2">
                        {uploadType === 'url' ? <DownloadCloud size={18} /> : <FileUp size={18} />}
                        {uploadType === 'url' ? 'Start Download' : 'Upload Image'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};