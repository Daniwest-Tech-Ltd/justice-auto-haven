import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, PenLine, CheckCircle2 } from "lucide-react";

interface SignaturePadProps {
  label: string;
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
}

export const SignaturePad = ({ label, value, onChange }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const existing = canvas.toDataURL();
    const hadContent = hasDrawn;

    canvas.width = rect.width * dpr;
    canvas.height = 160 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = "160px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.2;

    // Restore previous strokes after resize
    if (hadContent) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, 160);
      img.src = existing;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setupCanvas();
    const observer = new ResizeObserver(setupCanvas);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [setupCanvas]);

  // Load an existing signature (e.g. when editing a saved draft)
  useEffect(() => {
    if (!value) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = container.getBoundingClientRect();
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, 160);
      setHasDrawn(true);
    };
    img.src = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const getPoint = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = getPoint(e);
  };

  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !last.current) return;

    const point = getPoint(e);
    const mid = {
      x: (last.current.x + point.x) / 2,
      y: (last.current.y + point.y) / 2,
    };
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    last.current = point;
    setHasDrawn(true);
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <PenLine className="h-4 w-4 text-muted-foreground" />
          {label}
          {hasDrawn && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-normal">
              <CheckCircle2 className="h-3 w-3" /> Signed
            </span>
          )}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="text-muted-foreground"
        >
          <Eraser className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      </div>
      <div
        ref={containerRef}
        className="relative border-2 border-dashed border-border rounded-lg bg-white overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair touch-none"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-muted-foreground/60 italic">
              Sign here with mouse, touch or stylus
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
