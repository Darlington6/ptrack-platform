import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import client from '../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function getCroppedImg(imageSrc: string, cropArea: CropArea): Promise<Blob> {
  const response = await fetch(imageSrc);
  const blob = await response.blob();
  const img = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, 512, 512);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas is empty'))),
      'image/jpeg',
      0.85
    );
  });
}

export function AvatarUploadModal({ isOpen, onClose, onSuccess }: Props) {
  const { t } = useTranslation('common');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('photo_too_large'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setCroppedArea(areaPixels);
  }, []);

  async function handleUpload() {
    if (!imageSrc || !croppedArea) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedArea);
      const compressed = await imageCompression(
        new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' }),
        { maxSizeMB: 0.15, maxWidthOrHeight: 512, useWebWorker: true }
      );
      const fd = new FormData();
      fd.append('avatar', compressed, 'avatar.jpg');
      const res = await client.post<{ profile_picture: string }>('/auth/me/avatar/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess(res.data.profile_picture ?? '');
      toast.success(t('photo_updated'));
      setImageSrc(null);
      onClose();
    } catch {
      toast.error(t('upload_failed'));
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setImageSrc(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('update_photo_title')}>
      {!imageSrc ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Upload size={32} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-slate-400">{t('click_to_select')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('photo_max_size')}</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              className="sr-only"
            />
          </label>
        </div>
      ) : (
        <>
          <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full mt-3 accent-green-600"
            aria-label="Zoom"
          />
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setImageSrc(null)} className="flex-1">
              {t('change')}
            </Button>
            <Button onClick={handleUpload} disabled={uploading} className="flex-1">
              {uploading ? t('uploading') : t('save_photo')}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
