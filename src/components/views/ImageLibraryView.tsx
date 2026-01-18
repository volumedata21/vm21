import React from 'react';
import { 
  Disc, DownloadCloud, Archive, Loader2, CheckCircle, Trash2 
} from 'lucide-react';
import { IsoImage } from '../../types';

interface ImageLibraryProps {
  images: IsoImage[];
  onDeleteImage: (id: string) => void;
  onOpenUploadModal: () => void;
}

export const ImageLibraryView: React.FC<ImageLibraryProps> = ({ 
  images = [], 
  onDeleteImage, 
  onOpenUploadModal 
}) => {
  // Safety check
  const safeImages = Array.isArray(images) ? images : [];

  return (
      <div className="h-[calc(100vh-8rem)] glass-panel rounded-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-900/50">
              <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <Disc className="text-amber-500" /> Image Library
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Manage ISO installation media and container templates.</p>
              </div>
              <div className="flex gap-3">
                  <button 
                      onClick={onOpenUploadModal}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2 font-medium text-sm"
                  >
                      <DownloadCloud size={18} /> Upload / Download
                  </button>
              </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {safeImages.map(image => (
                  <div key={image.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center group">
                      <div className="col-span-4 flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${image.type === 'ISO' ? 'bg-amber-500/20 text-amber-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                              {image.type === 'ISO' ? <Disc size={18} /> : <Archive size={18} />}
                          </div>
                          <div className="truncate">
                              <div className="font-medium text-slate-200 truncate" title={image.name}>{image.name}</div>
                              <div className="text-xs text-slate-500">Added: {image.addedDate}</div>
                          </div>
                      </div>
                      <div className="col-span-2">
                          <span className={`text-xs px-2 py-1 rounded border ${image.type === 'ISO' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10'}`}>
                              {image.type.replace('_', ' ')}
                          </span>
                      </div>
                      <div className="col-span-2 text-sm text-slate-300 font-mono">
                          {image.sizeGB > 0 ? `${image.sizeGB} GB` : '-'}
                      </div>
                      <div className="col-span-2">
                           {image.status === 'Downloading' ? (
                               <div className="flex items-center gap-2 text-blue-400 text-sm">
                                   <Loader2 size={14} className="animate-spin" /> Downloading...
                               </div>
                           ) : (
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                   <CheckCircle size={14} /> Ready
                               </div>
                           )}
                      </div>
                      <div className="col-span-2 text-right">
                          <button 
                            onClick={() => onDeleteImage(image.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove Image"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>
              ))}
              {safeImages.length === 0 && (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                      <Disc size={48} className="opacity-20 mb-4" />
                      <p>No images found in library.</p>
                  </div>
              )}
          </div>
      </div>
  );
};