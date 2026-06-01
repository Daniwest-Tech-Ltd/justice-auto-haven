import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Minimize2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  title?: string;
  startIndex?: number;
}

const FullscreenImageViewer = ({ open, onOpenChange, images, title, startIndex = 0 }: Props) => {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => { if (open) setIdx(startIndex); }, [open, startIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onOpenChange]);

  if (!images.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/95 border-0 rounded-none flex flex-col" onContextMenu={(e) => e.preventDefault()}>
        <div className="absolute top-3 left-4 z-50 text-white text-sm font-mono bg-black/40 backdrop-blur px-3 py-1 rounded">
          {title} <span className="opacity-70">· {idx + 1} / {images.length}</span>
        </div>
        <div className="absolute top-3 right-3 z-50 flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
            <Minimize2 className="h-4 w-4 mr-1" /> Exit Fullscreen
          </Button>
          <Button size="icon" variant="secondary" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center select-none">
          <img
            src={images[idx]}
            alt={`${title || "image"} ${idx + 1}`}
            className="max-h-[92vh] max-w-[96vw] object-contain pointer-events-none"
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full z-50"
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full z-50"
              onClick={() => setIdx((i) => (i + 1) % images.length)}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex gap-2 px-3 py-2 bg-black/50 backdrop-blur rounded-lg max-w-[90vw] overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-14 w-20 rounded overflow-hidden border-2 flex-shrink-0 transition-all ${i === idx ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover pointer-events-none" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenImageViewer;
