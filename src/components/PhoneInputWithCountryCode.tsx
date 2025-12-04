import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Search } from "lucide-react";
import { africanCountryCodes, defaultCountryCode, type CountryCode } from "@/data/african-country-codes";

interface PhoneInputWithCountryCodeProps {
  value: string;
  onChange: (phone: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const PhoneInputWithCountryCode = ({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  placeholder = "Phone number",
  required = false,
  className = "",
}: PhoneInputWithCountryCodeProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = africanCountryCodes.find(c => c.dialCode === countryCode) || defaultCountryCode;

  const filteredCountries = africanCountryCodes.filter(
    (country) =>
      country.country.toLowerCase().includes(search.toLowerCase()) ||
      country.dialCode.includes(search) ||
      country.code.toLowerCase().includes(search.toLowerCase())
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digit characters except for leading digits
    let phone = e.target.value.replace(/[^\d]/g, '');
    // Remove leading zero if present
    if (phone.startsWith('0')) {
      phone = phone.substring(1);
    }
    onChange(phone);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[130px] justify-between h-12 px-3 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground hover:bg-white/30 dark:hover:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-200 shrink-0"
          >
            <span className="flex items-center gap-1.5 text-sm truncate">
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="font-medium">{selectedCountry.dialCode}</span>
              <span className="text-xs text-muted-foreground">{selectedCountry.code}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0 bg-background border border-border shadow-xl z-[100]" align="start">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {filteredCountries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No country found</p>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onCountryCodeChange(country.dialCode);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-accent transition-colors ${
                      selectedCountry.code === country.code ? "bg-accent" : ""
                    }`}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="flex-1 text-left font-medium">{country.country}</span>
                    <span className="text-muted-foreground font-mono">
                      {country.dialCode} {country.code}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Input
        type="tel"
        placeholder={placeholder}
        value={value}
        onChange={handlePhoneChange}
        required={required}
        className="flex-1 h-12 px-4 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white/30 dark:focus:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200"
        maxLength={10}
      />
    </div>
  );
};
