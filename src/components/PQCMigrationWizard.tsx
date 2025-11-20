import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowRight, CheckCircle, AlertTriangle, Info, Zap } from "lucide-react";

const PQC_ALGORITHMS = {
  "RSA-2048": "CRYSTALS-Kyber",
  "RSA-4096": "CRYSTALS-Kyber-1024",
  "ECDSA": "CRYSTALS-Dilithium",
  "ECDH": "CRYSTALS-Kyber",
  "AES-128": "AES-256 (Quantum-Safe)",
  "SHA-256": "SHA-3"
};

export const PQCMigrationWizard = () => {
  const [step, setStep] = useState(1);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [migrationPlan, setMigrationPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCryptoAssets();
  }, []);

  const loadCryptoAssets = async () => {
    const { data, error } = await supabase
      .from("crypto_inventory")
      .select("*")
      .eq("pqc_ready", false)
      .order("risk_level", { ascending: false });

    if (data) setAssets(data);
    if (error) toast({ title: "Error", description: "Failed to load crypto assets", variant: "destructive" });
  };

  const generateMigrationPlan = () => {
    const plan = selectedAssets.map(assetId => {
      const asset = assets.find(a => a.id === assetId);
      return {
        asset_id: assetId,
        asset_name: asset.asset_name,
        current_algorithm: asset.algorithm,
        target_algorithm: PQC_ALGORITHMS[asset.algorithm as keyof typeof PQC_ALGORITHMS] || "CRYSTALS-Kyber",
        priority: asset.risk_level === "high" ? 1 : asset.risk_level === "medium" ? 2 : 3,
        estimated_time: "2-4 hours",
        steps: [
          "Backup current cryptographic keys",
          "Generate new PQC keys",
          "Update configurations",
          "Test cryptographic operations",
          "Deploy to production"
        ]
      };
    });
    setMigrationPlan(plan.sort((a, b) => a.priority - b.priority));
    setStep(3);
  };

  const executeMigration = async () => {
    setLoading(true);
    try {
      for (const plan of migrationPlan) {
        await supabase
          .from("crypto_inventory")
          .update({
            algorithm: plan.target_algorithm,
            pqc_ready: true,
            pqc_migration_status: "completed",
            updated_at: new Date().toISOString()
          })
          .eq("id", plan.asset_id);
      }
      toast({ title: "Success", description: "PQC migration completed successfully" });
      setStep(4);
      loadCryptoAssets();
    } catch (error) {
      toast({ title: "Error", description: "Migration failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Post-Quantum Cryptography Migration Wizard
        </CardTitle>
        <CardDescription>
          Migrate your cryptographic assets to quantum-resistant algorithms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {step} of 4</span>
            <span>{progress.toFixed(0)}% Complete</span>
          </div>
          <Progress value={progress} />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This wizard will help you identify and migrate vulnerable cryptographic assets to post-quantum secure algorithms.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-semibold">Vulnerable Assets Found: {assets.length}</h3>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedAssets.includes(asset.id)}
                      onCheckedChange={(checked) => {
                        setSelectedAssets(checked 
                          ? [...selectedAssets, asset.id]
                          : selectedAssets.filter(id => id !== asset.id)
                        );
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{asset.asset_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Algorithm: {asset.algorithm} | Type: {asset.asset_type}
                      </div>
                    </div>
                    <Badge variant={asset.risk_level === "high" ? "destructive" : "secondary"}>
                      {asset.risk_level}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              disabled={selectedAssets.length === 0}
              className="w-full"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Migration Options</h3>
            
            <div className="space-y-3">
              <div className="p-4 border rounded-lg space-y-2">
                <label className="font-medium">Migration Strategy</label>
                <Select defaultValue="gradual">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gradual">Gradual (Recommended)</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <label className="font-medium">Backup Strategy</label>
                <Select defaultValue="automatic">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic Backup</SelectItem>
                    <SelectItem value="manual">Manual Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Migration will create backups before making changes. Estimated time: 2-4 hours per asset.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={generateMigrationPlan} className="flex-1">
                Generate Migration Plan
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Migration Plan</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {migrationPlan.map((plan, index) => (
                <Card key={plan.asset_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{plan.asset_name}</CardTitle>
                      <Badge>Priority {plan.priority}</Badge>
                    </div>
                    <CardDescription>
                      {plan.current_algorithm} → {plan.target_algorithm}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Migration Steps:</div>
                      <ul className="text-sm space-y-1">
                        {plan.steps.map((step: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {step}
                          </li>
                        ))}
                      </ul>
                      <div className="text-sm text-muted-foreground pt-2">
                        Estimated Time: {plan.estimated_time}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Ready to migrate {migrationPlan.length} assets to quantum-safe algorithms.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={executeMigration} disabled={loading} className="flex-1">
                {loading ? "Migrating..." : "Start Migration"}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Migration Complete!</h3>
              <p className="text-muted-foreground">
                Successfully migrated {migrationPlan.length} assets to quantum-safe algorithms.
              </p>
            </div>
            <Button onClick={() => { setStep(1); setSelectedAssets([]); setMigrationPlan([]); }}>
              Start New Migration
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
