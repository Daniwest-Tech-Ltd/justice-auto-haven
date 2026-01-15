import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorOption {
  name: string;
  hex: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Grey", hex: "#808080" },
  { name: "Blue", hex: "#0066CC" },
  { name: "Red", hex: "#CC0000" },
  { name: "Green", hex: "#006600" },
  { name: "Yellow", hex: "#FFCC00" },
  { name: "Orange", hex: "#FF6600" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Beige", hex: "#F5DEB3" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Purple", hex: "#6600CC" },
  { name: "Maroon", hex: "#800000" },
  { name: "Wine", hex: "#722F37" },
  { name: "Pink", hex: "#FF69B4" },
];

interface ColorSelectorProps {
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  label?: string;
}

export const ColorSelector = ({ 
  selectedColors, 
  onColorsChange, 
  label = "Other Colors Available (Optional)" 
}: ColorSelectorProps) => {
  const toggleColor = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
      onColorsChange(selectedColors.filter(c => c !== colorName));
    } else {
      onColorsChange([...selectedColors, colorName]);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground mb-2">
        Select other colors this same car model is available in
      </p>
      <div className="flex flex-col gap-2">
        {COLOR_OPTIONS.map((color) => {
          const isSelected = selectedColors.includes(color.name);
          const isLight = ["White", "Yellow", "Beige", "Silver"].includes(color.name);
          
          return (
            <button
              key={color.name}
              type="button"
              onClick={() => toggleColor(color.name)}
              className={cn(
                "relative flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300",
                "border-2 shadow-lg hover:shadow-xl hover:scale-[1.02]",
                // Glassmorphism effect
                "backdrop-blur-md",
                isSelected 
                  ? "border-primary ring-2 ring-primary/30" 
                  : "border-white/30 hover:border-white/50"
              )}
              style={{
                background: `linear-gradient(145deg, ${color.hex}dd, ${color.hex}99)`,
                boxShadow: isSelected 
                  ? `0 8px 32px ${color.hex}50, inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.1)` 
                  : `0 4px 20px ${color.hex}30, inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.1)`,
              }}
            >
              {/* Glass shine overlay */}
              <div 
                className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)",
                }}
              />
              
              {/* Check indicator */}
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-white shadow-md" 
                  : "bg-white/20 border border-white/30"
              )}>
                {isSelected && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </div>
              
              {/* Color name */}
              <span 
                className={cn(
                  "font-medium text-sm relative z-10",
                  isLight ? "text-gray-800" : "text-white",
                  "drop-shadow-sm"
                )}
              >
                {color.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Display component for showing available colors (used in CarDetails and Catalogue)
interface ColorDisplayProps {
  colors: string[];
  size?: "sm" | "md";
}

export const ColorDisplay = ({ colors, size = "md" }: ColorDisplayProps) => {
  if (!colors || colors.length === 0) return null;

  const getColorHex = (name: string) => {
    return COLOR_OPTIONS.find(c => c.name.toLowerCase() === name.toLowerCase())?.hex || "#808080";
  };

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((colorName) => {
        const hex = getColorHex(colorName);
        const isLight = ["White", "Yellow", "Beige", "Silver"].includes(colorName);
        
        return (
          <div
            key={colorName}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
              "border-2 border-white/30 shadow-lg backdrop-blur-md",
              size === "sm" ? "text-xs" : "text-sm"
            )}
            style={{
              background: `linear-gradient(145deg, ${hex}dd, ${hex}99)`,
              boxShadow: `0 4px 20px ${hex}30, inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.1)`,
            }}
          >
            {/* Glass shine overlay */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)",
              }}
            />
            <span 
              className={cn(
                "font-medium relative z-10 drop-shadow-sm",
                isLight ? "text-gray-800" : "text-white"
              )}
            >
              {colorName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Fuel type icon component for catalogue
interface FuelTypeIconProps {
  fuelType: string | null;
}

export const FuelTypeIcon = ({ fuelType }: FuelTypeIconProps) => {
  if (!fuelType) return null;
  
  const getFuelIcon = (type: string) => {
    const normalized = type.toLowerCase();
    if (normalized.includes("diesel")) return "⛽";
    if (normalized.includes("petrol") || normalized.includes("gasoline")) return "⛽";
    if (normalized.includes("electric")) return "⚡";
    if (normalized.includes("hybrid")) return "🔋";
    if (normalized.includes("lpg") || normalized.includes("cng")) return "🔥";
    return "⛽";
  };

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
      <span>{getFuelIcon(fuelType)}</span>
      <span className="uppercase">{fuelType}</span>
    </div>
  );
};
