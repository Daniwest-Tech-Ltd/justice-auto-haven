import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

interface TradeIn {
  id: string;
  car_make: string;
  car_model: string;
  car_year: number;
  car_mileage: string;
  car_condition: string;
  estimated_value: number | null;
  status: string;
  admin_notes: string | null;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
}

const TradeInsManagement = () => {
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTradeIns();
  }, []);

  const fetchTradeIns = async () => {
    try {
      const { data: tradeInsData, error: tradeInsError } = await supabase
        .from("trade_ins")
        .select("*")
        .order("created_at", { ascending: false });

      if (tradeInsError) throw tradeInsError;

      // Fetch related profile data
      const tradeInsWithProfiles = await Promise.all(
        (tradeInsData || []).map(async (tradeIn) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("user_id", tradeIn.user_id)
            .single();

          return {
            ...tradeIn,
            profiles: profileData || { full_name: "", email: "", phone: "" }
          };
        })
      );

      setTradeIns(tradeInsWithProfiles);
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

  const updateTradeIn = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("trade_ins")
        .update({
          status,
          admin_notes: adminNotes || null,
          estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trade-in updated successfully",
      });
      setEditingId(null);
      setAdminNotes("");
      setEstimatedValue("");
      fetchTradeIns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/cars")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Car Management
      </Button>

      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Trade-In Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tradeIns.map((tradeIn) => (
              <Card key={tradeIn.id} className="glass">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Vehicle Details</h3>
                      <p><strong>Car:</strong> {tradeIn.car_make} {tradeIn.car_model} ({tradeIn.car_year})</p>
                      <p><strong>Mileage:</strong> {tradeIn.car_mileage}</p>
                      <p><strong>Condition:</strong> {tradeIn.car_condition}</p>
                      {tradeIn.estimated_value && (
                        <p><strong>Estimated Value:</strong> KSh {tradeIn.estimated_value.toLocaleString()}</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Customer Details</h3>
                      <p><strong>Name:</strong> {tradeIn.profiles?.full_name}</p>
                      <p><strong>Email:</strong> {tradeIn.profiles?.email}</p>
                      <p><strong>Phone:</strong> {tradeIn.profiles?.phone}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Badge
                      variant={
                        tradeIn.status === "approved"
                          ? "default"
                          : tradeIn.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {tradeIn.status}
                    </Badge>
                  </div>

                  {editingId === tradeIn.id ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label>Estimated Value (KSh)</Label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded border border-border bg-background"
                          value={estimatedValue}
                          onChange={(e) => setEstimatedValue(e.target.value)}
                          placeholder="Enter estimated value"
                        />
                      </div>
                      <div>
                        <Label>Admin Notes</Label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes for the customer..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => updateTradeIn(tradeIn.id, "approved")}>
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateTradeIn(tradeIn.id, "rejected")}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setAdminNotes("");
                            setEstimatedValue("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      {tradeIn.admin_notes && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Notes:</strong> {tradeIn.admin_notes}
                        </p>
                      )}
                      {tradeIn.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingId(tradeIn.id);
                            setAdminNotes(tradeIn.admin_notes || "");
                            setEstimatedValue(tradeIn.estimated_value?.toString() || "");
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeInsManagement;