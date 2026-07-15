import { useState, useRef } from 'react';
import { Camera, X, ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxSizeMB = 0.5,
  maxWidthOrHeight = 1920,
  label = 'Photo',
}: Props) {
  const { t } = useTranslation('common');
  const [progress, setProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setCompressing(true);
    setProgress(0);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        preserveExif: false,
        onProgress: (p) => setProgress(p),
        fileType: 'image/webp',
      });
      const renamed = new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), {
        type: 'image/webp',
      });
      setPreview(URL.createObjectURL(renamed));
      onChange(renamed);
    } catch {
      onChange(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') setPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  }

  function clear(e: { stopPropagation(): void }) {
    e.stopPropagation();
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</p>
      )}
      <label className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors overflow-hidden">
        {preview ? (
          <>
            <img
              src={preview}
              alt="preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={clear}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <X size={12} />
            </button>
            {value && (
              <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                {(value.size / 1024).toFixed(0)} KB
              </span>
            )}
          </>
        ) : compressing ? (
          <div className="flex flex-col items-center gap-2 px-4 w-full">
            <ImageIcon size={24} className="text-gray-400 dark:text-slate-500" />
            <div className="w-full max-w-[160px] h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-150 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('compressing', { percent: progress })}
            </p>
          </div>
        ) : (
          <>
            <Camera size={28} className="text-gray-400 dark:text-slate-500 mb-1" />
            <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
              {t('tap_to_photo')}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{t('verify_waste')}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
          className="sr-only"
        />
      </label>
    </div>
  );
}