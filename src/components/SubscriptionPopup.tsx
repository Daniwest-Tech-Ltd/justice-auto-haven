import { useState, useEffect } from "react";
import { X, Facebook, Instagram, Youtube, Twitter, Send, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SubscriptionPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user has already seen the popup in this session
    const hasSeenPopup = localStorage.getItem("hasSeenSubscriptionPopup");

    const handleOpen = () => {
      setIsOpen(true);
      setIsSubmitted(false);
    };
    window.addEventListener('open-subscription-popup', handleOpen);

    if (!hasSeenPopup) {
      // Show popup after 5 seconds for first-time visitors
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-subscription-popup', handleOpen);
      };
    } else {
      // For returning visitors, show after staying for a while (e.g., 60 seconds)
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 60000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-subscription-popup', handleOpen);
      };
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenSubscriptionPopup", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("mailing_list")
        .insert([{ email }]);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Subscribed",
            description: "You are already on our institutional mailing list.",
          });
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "Successfully Subscribed",
          description: "You will now receive real-time inventory updates.",
        });
        setTimeout(handleClose, 5000);
      }
    } catch (error: any) {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative w-full max-w-lg bg-[#0a101f] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-white/10">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-50 p-1.5 rounded-full bg-black/40 hover:bg-white/20 text-white transition-all border border-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Section: Image - Compact */}
        <div className="relative h-48 sm:h-56 bg-black overflow-hidden">
          <img
            src="/catalogue.png"
            alt="Justice Ultimate Terminal"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a101f] via-transparent to-transparent" />
        </div>

        {/* Bottom Section: Content - Condensed */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center min-h-[300px] justify-center">
          {isSubmitted ? (
            <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-500 w-full text-center">
               <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle className="h-10 w-10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Access Granted</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">
                     Official Notice: You are now synced to our terminal logs. <br/>
                     Receive new updates on every unit arrival.
                  </p>
               </div>
               <Button onClick={handleClose} variant="outline" className="h-10 px-8 rounded-xl border-white/10 text-white font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                  Continue Browsing
               </Button>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-red">Institutional Hub</p>
                <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-white">
                  Join Our <span className="text-brand-red">Mailing List.</span>
                </h2>
              </div>

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Updates, new arrivals & insider only discounts.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="EMAIL ADDRESS..."
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 px-5 rounded-xl border-white/10 focus:border-brand-red/50 text-[10px] font-black uppercase tracking-widest text-white bg-white/5"
                />
                <Button
                  disabled={loading}
                  type="submit"
                  className="w-full h-12 rounded-xl bg-white hover:bg-brand-red text-[#0a101f] hover:text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg"
                >
                  {loading ? "SENDING..." : "SUBMIT"}
                </Button>
              </form>

              <div className="flex flex-col items-center gap-4 pt-2">
                <div className="flex gap-3">
                  {[
                    { icon: Facebook, href: "https://www.facebook.com/justiceultimateautomobiles" },
                    { icon: Instagram, href: "https://www.instagram.com/justiceultimateautomobiles" },
                    { icon: Youtube, href: "https://www.youtube.com/@justiceultimateautomobiles" },
                    { icon: Twitter, href: "https://twitter.com/justiceultimate" },
                    { icon: MessageCircle, href: "https://wa.me/254722827458" }
                  ].map((social, i) => (
                    <a
                      key={i}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-brand-red transition-all flex items-center justify-center border border-white/10"
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>

                <button
                  onClick={handleClose}
                  className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all underline underline-offset-4"
                >
                  No, Thanks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPopup;
