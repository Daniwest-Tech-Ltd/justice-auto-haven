import { ThumbsUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CarCompletenessProps {
  car: {
    make?: string;
    model?: string;
    year?: number;
    price?: number;
    color?: string | null;
    fuel_type?: string | null;
    transmission?: string | null;
    mileage?: string | null;
    engine?: string | null;
    description?: string | null;
    images?: any;
    main_images?: any;
    vin?: string | null;
    drive_type?: string | null;
    import_type?: string | null;
  };
}

const FIELDS = [
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "year", label: "Year" },
  { key: "price", label: "Price" },
  { key: "color", label: "Color" },
  { key: "fuel_type", label: "Fuel Type" },
  { key: "transmission", label: "Transmission" },
  { key: "mileage", label: "Mileage" },
  { key: "engine", label: "Engine" },
  { key: "description", label: "Description" },
  { key: "vin", label: "VIN" },
  { key: "drive_type", label: "Drive Type" },
  { key: "import_type", label: "Import Type" },
  { key: "images", label: "Images" },
];

const hasValue = (car: any, key: string): boolean => {
  if (key === "images") {
    const imgs = car.main_images || car.images;
    if (Array.isArray(imgs) && imgs.length > 0) return true;
    if (typeof imgs === "string") {
      try { return JSON.parse(imgs).length > 0; } catch { return false; }
    }
    return false;
  }
  const val = car[key];
  if (val === null || val === undefined || val === "") return false;
  if (typeof val === "number") return val > 0;
  return true;
};

const CarCompleteness = ({ car }: CarCompletenessProps) => {
  const filled = FIELDS.filter((f) => hasValue(car, f.key));
  const missing = FIELDS.filter((f) => !hasValue(car, f.key));
  const percentage = Math.round((filled.length / FIELDS.length) * 100);

  const getColor = () => {
    if (percentage === 100) return "text-green-500";
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = () => {
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 80) return "bg-green-400";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            {percentage === 100 ? (
              <ThumbsUp className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className={`h-4 w-4 ${getColor()}`} />
            )}
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${getProgressColor()}`} style={{ width: `${percentage}%` }} />
            </div>
            <span className={`text-xs font-bold ${getColor()}`}>{percentage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="font-semibold text-xs mb-1">
            {percentage === 100 ? "✅ All info complete!" : `Missing ${missing.length} field(s):`}
          </p>
          {missing.length > 0 && (
            <ul className="text-xs space-y-0.5">
              {missing.map((f) => (
                <li key={f.key} className="text-muted-foreground">• Add {f.label}</li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CarCompleteness;
