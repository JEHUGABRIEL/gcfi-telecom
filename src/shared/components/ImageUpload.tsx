'use client';
import React from 'react';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary } from '@/shared/lib/cloudinary';
import { cn } from '@/shared/lib/utils';
import { checkRateLimit, recordUpload } from '@/shared/lib/rate-limiter';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  placeholder?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'gcfi',
  className,
  placeholder = 'Cliquer ou glisser une image',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

const handleFile = async (file: File) => {
  setError(null);
  
  if (!file.type.startsWith('image/')) {
    setError('Fichier non supporté.');
    return;
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    setError(`Fichier trop volumineux. Max ${maxSizeMB} Mo.`);
    return;
  }

  // ✅ NOUVEAU : Check rate limit
    const userId = localStorage.getItem('userId') || 'anonymous';
    const { allowed, reason } = await checkRateLimit(userId);
    if (!allowed) {
      setError(reason || 'Trop d\'uploads.');
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadToCloudinary(file, folder, setProgress);
      onChange(result.secure_url);
      // ✅ NOUVEAU : Enregistrer l'upload
      await recordUpload(userId);
      setProgress(0);
    } catch (err: any) {
      setError(err?.message || "Échec de l'upload.");
      console.error('[ImageUpload]', err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // ✅ Réinitialiser l'input pour permettre de re-uploader le même fichier
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Zone d'upload */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          dragging ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-slate-200 dark:border-slate-700 hover:border-[var(--accent)] hover:bg-[var(--accent-light)]',
          value ? 'h-48' : 'h-32',
          uploading && 'pointer-events-none'
        )}
      >
        {/* Aperçu image */}
        {value && !uploading && (
          <div className="w-full h-full relative group">
            <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="text-white text-sm font-bold">Changer</span>
            </div>
          </div>
        )}

        {/* État vide */}
        {!value && !uploading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Image className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{placeholder}</p>
            <p className="text-xs text-slate-400">JPG, PNG, WebP · max {maxSizeMB} Mo</p>
          </div>
        )}

        {/* État upload */}
        <AnimatePresence>
          {uploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
              <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-[var(--accent)] rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: 'linear' }} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upload {progress}%</p>
            </motion.div>
          )}
        </AnimatePresence>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>

      {/* Bouton supprimer */}
      {value && !uploading && (
        <button onClick={e => { e.stopPropagation(); onChange(''); }}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
          <X className="w-3.5 h-3.5" /> Supprimer l'image
        </button>
      )}

      {/* Erreur */}
      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}