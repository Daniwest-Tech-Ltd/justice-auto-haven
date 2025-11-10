import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BrandMarquee = () => {
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");
    
    if (!error && data) {
      setBrands(data);
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="flex animate-marquee gap-8 items-center">
        {[...Array(2)].map((_, groupIndex) => (
          <div key={groupIndex} className="flex gap-8 items-center flex-shrink-0">
            {brands.map((brand) => (
              <div key={`${groupIndex}-${brand.id}`} className="flex-shrink-0">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100"
                  />
                ) : (
                  <span className="text-2xl font-bold opacity-70">{brand.name}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandMarquee;
