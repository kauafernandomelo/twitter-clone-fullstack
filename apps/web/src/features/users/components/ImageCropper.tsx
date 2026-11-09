import { ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

type ImageCropperProps = {
  src: string;
  aspect: number;
  shape: 'round' | 'rect';
  onAreaChange: (area: Area) => void;
};

// Arrastar para posicionar + zoom. Devolve a área recortada em pixels da imagem original.
export function ImageCropper({ src, aspect, shape, onAreaChange }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex flex-col">
      <div className="relative h-[60dvh] max-h-[450px] bg-black">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={shape}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, areaPixels) => onAreaChange(areaPixels)}
        />
      </div>
      <div className="flex items-center gap-3 px-12 py-4 text-muted">
        <ZoomOut className="size-5" aria-hidden="true" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          aria-label="Zoom"
          className="flex-1 accent-brand"
        />
        <ZoomIn className="size-5" aria-hidden="true" />
      </div>
    </div>
  );
}
