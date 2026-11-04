import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { triggerTruecallerAlert } from '@/components/TruecallerAlert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminTruecallerSimulator = () => {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    if (!userId || !amount) {
      toast.error('Please fill in both user ID and amount');
      return;
    }

    setIsSimulating(true);
    try {
      // Trigger locally for the admin to see it themselves if they put their own ID
      triggerTruecallerAlert(userId, Number(amount));

      // Broadcast to all clients (the target client will filter by userId)
      await supabase.channel('truecaller-channel').send({
        type: 'broadcast',
        event: 'trigger-alert',
        payload: { userId, amount: Number(amount) }
      });

      toast.success('Simulation triggered and broadcasted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to trigger simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="container py-8 space-y-6 max-w-4xl mx-auto mt-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Truecaller SMS Simulator</h1>
        <p className="text-muted-foreground">
          Simulate a real Truecaller MPESA receipt SMS for a user.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trigger SMS</CardTitle>
          <CardDescription>
            Enter the details to simulate a Truecaller MPESA notification popup on the client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD to convert to KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button onClick={handleSimulate} disabled={isSimulating}>
            {isSimulating ? 'Simulating...' : 'Trigger Simulation'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTruecallerSimulator;
