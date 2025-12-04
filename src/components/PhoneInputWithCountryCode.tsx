import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import { africanCountryCodes, defaultCountryCode, type CountryCode } from "@/data/african-country-codes";

interface PhoneInputWithCountryCodeProps {
  value: string;
  onChange: (phone: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  showHint?: boolean;
}

export const PhoneInputWithCountryCode = ({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  placeholder = "Phone number",
  required = false,
  className = "",
  showHint = true,
}: PhoneInputWithCountryCodeProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const selectedCountry = africanCountryCodes.find(c => c.dialCode === countryCode) || defaultCountryCode;

  const filteredCountries = africanCountryCodes.filter(
    (country) =>
      country.country.toLowerCase().includes(search.toLowerCase()) ||
      country.dialCode.includes(search) ||
      country.code.toLowerCase().includes(search.toLowerCase())
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let phone = e.target.value.replace(/[^\d]/g, '');
    
    // Auto-remove leading zero for Kenya (+254)
    if (countryCode === '+254' && phone.startsWith('0')) {
      phone = phone.substring(1);
    }
    
    // Also handle if user pastes full number with country code
    const codeDigits = countryCode.replace(/\D/g, '');
    if (phone.startsWith(codeDigits)) {
      phone = phone.substring(codeDigits.length);
    }
    
    onChange(phone);
  };

  // Get expected digit length for validation hint
  const getExpectedLength = () => {
    if (countryCode === '+254') return 9;
    return 9; // Default for most African countries
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex gap-2">
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

        <div className="flex-1 relative">
          <Input
            type="tel"
            placeholder={countryCode === '+254' ? "7XX XXX XXX" : placeholder}
            value={value}
            onChange={handlePhoneChange}
            required={required}
            className="h-12 px-4 pr-10 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white/30 dark:focus:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200"
            maxLength={10}
          />
          
          {/* Help button */}
          <Dialog open={showGuide} onOpenChange={setShowGuide}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCountry.flag}</span>
                  How to Enter Your Phone Number
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-accent/50 rounded-lg p-4">
                  <p className="font-semibold text-sm mb-2">For {selectedCountry.country} ({selectedCountry.dialCode}):</p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Enter your number <strong>without</strong> the country code</li>
                    <li>• You can type with or without leading zero</li>
                    <li>• We will auto-correct the format for you</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Examples:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground">You type:</span>
                      <p className="font-mono font-medium">0790293895</p>
                    </div>
                    <div className="bg-primary/10 rounded p-2">
                      <span className="text-muted-foreground">We save:</span>
                      <p className="font-mono font-medium text-primary">{selectedCountry.dialCode}790293895</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground">You type:</span>
                      <p className="font-mono font-medium">790293895</p>
                    </div>
                    <div className="bg-primary/10 rounded p-2">
                      <span className="text-muted-foreground">We save:</span>
                      <p className="font-mono font-medium text-primary">{selectedCountry.dialCode}790293895</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>Note:</strong> This number will be used for WhatsApp notifications, OTP verification, and important updates.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Hint text */}
      {showHint && (
        <p className="text-xs text-muted-foreground pl-1">
          {countryCode === '+254' 
            ? "Enter 9 digits (e.g., 7XXXXXXXX). Leading 0 will be auto-removed."
            : `Enter your number without ${countryCode}. Click (?) for help.`
          }
        </p>
      )}
    </div>
  );
};
