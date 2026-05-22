import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';

interface ImageUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '28px 16px',
          border: dragOver ? '2px solid var(--crimson)' : '2px dashed var(--ink)',
          background: dragOver ? 'var(--field)' : 'var(--paper)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          borderRadius: '2px',
          minHeight: '120px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '2px solid var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: dragOver ? 'var(--crimson)' : 'var(--paper-2)',
            transition: 'background 0.15s, border-color 0.15s',
            borderColor: dragOver ? 'var(--crimson)' : 'var(--ink)',
          }}
        >
          <Upload className="w-6 h-6" style={{ color: dragOver ? 'var(--paper)' : 'var(--ink)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--serif)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: '2px',
          }}>
            Lähetä kuva tarjouspyyntöön
          </p>
          <p className="kicker" style={{ opacity: 0.7 }}>
            PNG · JPG · SVG · PDF — useita tiedostoja
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,application/pdf"
          multiple
          onChange={onInputChange}
          style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
        />
      </div>

      {/* Thumbnail strip */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {files.map((file, idx) => {
            const thumb = getThumbnail(file);
            return (
              <div
                key={`${file.name}-${idx}`}
                style={{
                  position: 'relative',
                  width: '72px',
                  height: '72px',
                  border: '2px solid var(--ink)',
                  overflow: 'hidden',
                  background: 'var(--paper-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="group"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={file.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px' }}>
                    {file.type === 'application/pdf'
                      ? <FileText className="w-5 h-5" style={{ color: 'var(--crimson)' }} />
                      : <ImageIcon className="w-5 h-5" style={{ color: 'var(--ink-soft)' }} />
                    }
                    <span style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '8px',
                      color: 'var(--ink-soft)',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      whiteSpace: 'nowrap',
                    }}>
                      {file.name}
                    </span>
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile(idx); }}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '20px',
                    height: '20px',
                    background: 'var(--ink)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                    borderRadius: '0',
                    minHeight: 'auto',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  onFocus={e => (e.currentTarget.style.opacity = '1')}
                  onBlur={e => (e.currentTarget.style.opacity = '0')}
                  aria-label={`Poista ${file.name}`}
                >
                  <X className="w-3 h-3" style={{ color: 'var(--paper)' }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
