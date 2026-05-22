import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';

interface ImageUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
const ACCEPT_STRING = 'image/png,image/jpeg,image/svg+xml,application/pdf';

function fileThumbnailUrl(file: File): string | null {
  if (file.type === 'image/png' || file.type === 'image/jpeg') {
    return URL.createObjectURL(file);
  }
  return null;
}

export function ImageUploader({ files, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const thumbnailUrls = useRef<Map<string, string>>(new Map());

  const getThumbnail = (file: File): string | null => {
    const key = `${file.name}-${file.size}`;
    if (!thumbnailUrls.current.has(key)) {
      const url = fileThumbnailUrl(file);
      if (url) thumbnailUrls.current.set(key, url);
    }
    return thumbnailUrls.current.get(key) ?? null;
  };

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(f => ACCEPTED_TYPES.includes(f.type));
    if (valid.length === 0) return;
    onChange([...files, ...valid]);
  }, [files, onChange]);

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    onChange(next);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${dragOver
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-gray-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}
        `}
      >
        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-4 rounded-full">
          <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Lähetä kuva tarjouspyyntöön
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            PNG, JPG, SVG tai PDF · Useita tiedostoja kerrallaan
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,application/pdf"
          multiple
          onChange={onInputChange}
          className="sr-only"
        />
      </div>

      {/* Thumbnail strip */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => {
            const thumb = getThumbnail(file);
            return (
              <div
                key={`${file.name}-${idx}`}
                className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex items-center justify-center"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 p-2">
                    {file.type === 'application/pdf'
                      ? <FileText className="w-6 h-6 text-red-500" />
                      : <ImageIcon className="w-6 h-6 text-gray-400" />
                    }
                    <span className="text-[9px] text-gray-500 text-center leading-tight truncate w-full">
                      {file.name}
                    </span>
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile(idx); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Poista ${file.name}`}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
