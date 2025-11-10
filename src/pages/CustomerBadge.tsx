import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import logo from "@/assets/logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface BadgeData {
  full_name: string;
  email: string;
  badge_type: string;
  issued_date: string;
}

const CustomerBadge = () => {
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBadge();
  }, []);

  const fetchBadge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      const { data: badgeData, error: badgeError } = await supabase
        .from("badges")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (badgeError) throw badgeError;

      setBadge({
        full_name: profileData.full_name,
        email: profileData.email,
        badge_type: badgeData.badge_type,
        issued_date: badgeData.issued_date,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!badgeRef.current) return;

    try {
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [85.6, 54],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 54);
      pdf.save(`customer-badge-${badge?.full_name}.pdf`);

      toast({
        title: "Badge Downloaded",
        description: "Your badge has been saved as PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingScreen />;
  if (!badge) return <div>No badge found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/customer-dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={downloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <Card 
          ref={badgeRef}
          className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-background/80 via-secondary/30 to-primary/20 border-2 border-primary/30 shadow-2xl"
        >
          {/* Kenyan Flag Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-1/3 bg-black"></div>
            <div className="h-1/3 bg-red-600"></div>
            <div className="h-1/3 bg-green-600"></div>
          </div>

          {/* Badge Content */}
          <div className="relative p-12 text-center">
            <div className="mb-6">
              <img src={logo} alt="Justice Ultimate Automobiles" className="h-24 mx-auto" />
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-2">
              {badge.badge_type.toUpperCase()} BADGE
            </h1>
            <p className="text-muted-foreground mb-8">Justice Ultimate Automobiles</p>

            <div className="space-y-4 mb-8">
              <div className="glass-strong p-6 rounded-lg">
                <p className="text-sm text-muted-foreground">Badge Holder</p>
                <h2 className="text-2xl font-bold text-foreground">{badge.full_name}</h2>
              </div>

              <div className="glass-strong p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground">{badge.email}</p>
              </div>

              <div className="glass-strong p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Issued Date</p>
                <p className="text-foreground">
                  {new Date(badge.issued_date).toLocaleDateString('en-KE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Nairobi, Kenya • +254 722 827 458
              </p>
              <p className="text-xs text-muted-foreground">
                www.justiceauto.com
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          This badge certifies your membership with Justice Ultimate Automobiles
        </p>
      </div>
    </div>
  );
};

export default CustomerBadge;