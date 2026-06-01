// Dynamic monthly sale label utility — always reflects the CURRENT month and year.
// Usage:
//   import { getCurrentSale } from "@/lib/currentSale";
//   const sale = getCurrentSale();
//   sale.short    -> "April Special Offer Sale 2026"
//   sale.banner   -> "🎉 APRIL SPECIAL OFFER SALE 2026"
//   sale.headline -> "April Special Offer Sale 2026 – Drive Your Dream Car Today!"
//   sale.tagline  -> "April Special Offer Sale 2026 – Kenya's Trusted Car Dealership"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Some months get a more festive label, otherwise default to "Special Offer Sale"
const MONTH_SALE_LABELS: Record<number, string> = {
  0: "New Year Mega Sale",       // January
  1: "Valentine Special Sale",   // February
  2: "March Special Offer Sale", // March
  3: "April Special Offer Sale", // April
  4: "May Special Offer Sale",   // May
  5: "June Special Offer Sale",  // June
  6: "Mid-Year Mega Sale",       // July
  7: "August Special Offer Sale",// August
  8: "September Special Sale",   // September
  9: "Mashujaa Mega Sale",       // October
  10: "November Special Sale",   // November
  11: "Christmas Mega Sale",     // December
};

export interface CurrentSale {
  month: string;        // e.g. "April"
  year: number;         // e.g. 2026
  short: string;        // e.g. "April Special Offer Sale 2026"
  banner: string;       // e.g. "🎉 APRIL SPECIAL OFFER SALE 2026"
  headline: string;     // for hero h1
  tagline: string;      // for sub-hero/SEO
  badge: string;        // small chip text
}

export const getCurrentSale = (): CurrentSale => {
  const now = new Date();
  const monthIdx = now.getMonth();
  const year = now.getFullYear();
  const monthName = MONTH_NAMES[monthIdx];
  const baseLabel = MONTH_SALE_LABELS[monthIdx] || `${monthName} Special Offer Sale`;
  const short = `${baseLabel} ${year}`;

  return {
    month: monthName,
    year,
    short,
    banner: `🎉 ${short.toUpperCase()}`,
    headline: `${short} – Drive Your Dream Car Today!`,
    tagline: `${short} – Kenya's Trusted Car Dealership`,
    badge: `🎉 ${short}`,
  };
};
