import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "@/assets/logo.png";

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
      .maybeSingle();

    if (!error && data) {
      setStaff(data);
    }
  };

  const downloadPDF = async () => {
    if (!badgeRef.current) return;

    try {
      const canvas = await html2canvas(badgeRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
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
    <div className="min-h-screen p-4 lg:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/hr")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Staff Badge</h1>
              <p className="text-muted-foreground text-lg uppercase">{staff.full_name}</p>
            </div>
          </div>
          <Button onClick={downloadPDF} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Badge Preview */}
        <div className="flex justify-center p-8">
          <div
            ref={badgeRef}
            className="w-[400px] h-[250px] relative overflow-hidden rounded-xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #006400 40%, #BC0000 100%)",
            }}
          >
            {/* Card Content */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent p-8 flex flex-col justify-between">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="bg-white rounded-full p-3 shadow-lg">
                  <img src={logo} alt="Logo" className="h-12 w-12 object-contain" />
                </div>
              </div>

              {/* Staff Info */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-lg">
                <div className="text-center mb-3">
                  <h2 className="text-gray-900 font-bold text-xl mb-1">{staff.full_name.toUpperCase()}</h2>
                  <p className="text-gray-700 text-sm font-semibold capitalize">
                    {staff.position.replace('_', ' ')}
                  </p>
                </div>
                
                <div className="border-t border-gray-300 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">ID:</span>
                    <span className="text-gray-900 font-bold font-mono">{staff.staff_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Department:</span>
                    <span className="text-gray-900 font-semibold">{staff.department}</span>
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div className="text-center">
                <p className="text-white font-bold text-xs tracking-wider drop-shadow-lg">
                  JUSTICE ULTIMATE AUTOMOBILES
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffBadge;
