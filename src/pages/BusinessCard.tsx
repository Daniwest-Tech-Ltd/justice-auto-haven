import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const BusinessCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    fetchStaff();
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

  const downloadBusinessCard = async () => {
    const element = document.getElementById("business-card");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98], // Standard business card size
      });

      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 53.98);
      pdf.save(`business-card-${staff.staff_id}.pdf`);

      toast({
        title: "Success",
        description: "Business card downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate business card",
        variant: "destructive",
      });
    }
  };

  if (!staff) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Business Card</h1>
            <p className="text-muted-foreground">{staff.full_name}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className="w-[856px] h-[540px] overflow-hidden">
            <CardContent className="p-0">
              <div
                id="business-card"
                className="w-full h-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex flex-col justify-between text-white relative overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-5xl font-bold mb-2">JUSTICE</div>
                  <div className="text-3xl font-light">Ultimate Automobiles</div>
                </div>

                <div className="relative z-10">
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">{staff.full_name}</div>
                      <div className="text-xl font-light opacity-90 capitalize">
                        {staff.position.replace(/_/g, " ")}
                      </div>
                    </div>

                    <div className="space-y-2 text-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5" />
                        <span>{staff.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5" />
                        <span>{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5" />
                        <span>Nairobi, Kenya</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff ID Badge */}
                <div className="absolute top-12 right-12 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <div className="text-sm opacity-75">ID</div>
                  <div className="text-xl font-bold">{staff.staff_id}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={downloadBusinessCard} size="lg">
            <Download className="mr-2 h-5 w-5" />
            Download as PDF
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
