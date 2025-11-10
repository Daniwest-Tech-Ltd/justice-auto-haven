import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const StaffBadge = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const badgeRef = useRef<HTMLDivElement>(null);
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchStaff();
    }
  }, [id]);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setStaff(data);
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
      pdf.save(`${staff.staff_id}-badge.pdf`);

      toast({
        title: "Badge Downloaded",
        description: "Staff badge has been saved as PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/hr")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Staff Badge</h1>
              <p className="text-muted-foreground">{staff.full_name}</p>
            </div>
          </div>
          <Button onClick={downloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Badge Preview */}
        <div className="flex justify-center">
          <div
            ref={badgeRef}
            className="w-[320px] h-[200px] relative overflow-hidden rounded-lg"
            style={{
              background: "linear-gradient(135deg, #000000 0%, #006400 33.33%, #006400 66.66%, #BC0000 100%)",
            }}
          >
            {/* Card Content */}
            <div className="absolute inset-0 backdrop-blur-sm bg-white/10 p-6 flex flex-col justify-between">
              {/* Top Section */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {staff.full_name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-white font-bold text-lg">{staff.full_name}</h2>
                <p className="text-white/90 text-sm capitalize">{staff.position.replace('_', ' ')}</p>
              </div>

              {/* Middle Section */}
              <div className="bg-white/20 backdrop-blur-md rounded p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">ID:</span>
                  <span className="text-white font-mono font-semibold">{staff.staff_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Dept:</span>
                  <span className="text-white font-semibold">{staff.department}</span>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="text-center">
                <p className="text-white/90 font-bold text-xs">JUSTICE ULTIMATE AUTOMOBILES</p>
                <p className="text-white/70 text-xs">Kenya's Trusted Auto Dealer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffBadge;