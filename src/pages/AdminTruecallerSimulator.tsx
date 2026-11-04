import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { triggerTruecallerAlert } from '@/components/TruecallerAlert';
import { PhoneInputWithCountryCode } from '@/components/PhoneInputWithCountryCode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Loader2, Link as LinkIcon } from 'lucide-react';

const AdminTruecallerSimulator = () => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+254');
  const [amount, setAmount] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      const templates = [
        "Hello! Great news, your newly imported Toyota Landcruiser Prado has just arrived at our Westlands showroom. Let us know when you're available for pickup! https://justiceultimateautomobiles.com",
        "Hi there, your monthly Lipa Mdogo Mdogo installment for the Mazda Demio is approaching. Ensure your balance is updated to avoid penalties. View statement here: https://justiceultimateautomobiles.com",
        "Exclusive offer! Trade-in your current vehicle for a brand new Mercedes Benz C200 this week and get 10% off. Contact our sales team today."
      ];
      setMessageBody(templates[Math.floor(Math.random() * templates.length)]);
      setSubject('Important Update');
      setIsGenerating(false);
      toast.success("AI generated a professional message!");
    }, 1500);
  };

  const handleAddLink = () => {
    setMessageBody(prev => prev + " https://justiceultimateautomobiles.com");
  };

  const handleSimulate = async (type: 'mpesa' | 'custom') => {
    const fullPhone = phone.startsWith('0')
      ? countryCode + phone.substring(1)
      : (phone.startsWith('+') ? phone : countryCode + phone);

    if (!phone) {
      toast.error('Please fill in a phone number');
      return;
    }

    if (type === 'mpesa' && !amount) {
      toast.error('Please enter an amount for the MPESA receipt');
      return;
    }

    if (type === 'custom' && !messageBody) {
      toast.error('Please enter a message body');
      return;
    }

    const payloadAmount = type === 'mpesa' ? amount : '';
    const payloadMessage = type === 'custom' ? messageBody : '';
    const payloadSubject = type === 'custom' ? subject : '';

    setIsSimulating(true);
    try {
      // Trigger locally for the admin to see it themselves if they put their own phone number
      triggerTruecallerAlert(fullPhone, payloadAmount, payloadMessage, payloadSubject);

      // Broadcast to all clients (the target client will filter by phone number)
      await supabase.channel('truecaller-channel').send({
        type: 'broadcast',
        event: 'trigger-alert',
        payload: { phone: fullPhone, amount: payloadAmount, messageBody: payloadMessage, subject: payloadSubject }
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
        <CardContent className="space-y-6">
          <div className="space-y-2 border-b pb-6">
            <Label htmlFor="phone" className="text-base font-semibold">Target Phone Number</Label>
            <PhoneInputWithCountryCode
              value={phone}
              onChange={setPhone}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              placeholder="e.g. 712345678 or 0712345678"
            />
            <p className="text-xs text-muted-foreground">Select a country code or enter the full number to send the simulation to.</p>
          </div>

          <Tabs defaultValue="custom" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="custom">Custom Text SMS</TabsTrigger>
              <TabsTrigger value="mpesa">M-PESA Receipt</TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject / Title (Optional)</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="e.g. Vehicle Arrival Notice"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="message">Message Body</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleAddLink} className="h-8 gap-1 px-2">
                      <LinkIcon className="h-3 w-3" /> Add Link
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                      className="h-8 gap-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                    >
                      {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate with AI
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="message"
                  placeholder="e.g. Hello, your vehicle is ready for pickup! https://..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <Button onClick={() => handleSimulate('custom')} disabled={isSimulating} className="w-full">
                {isSimulating ? 'Simulating...' : 'Send Custom SMS'}
              </Button>
            </TabsContent>

            <TabsContent value="mpesa" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g. 1300000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Type the exact amount in KES. This will render the M-PESA branded SMS.</p>
              </div>

              <Button onClick={() => handleSimulate('mpesa')} disabled={isSimulating} className="w-full">
                {isSimulating ? 'Simulating...' : 'Send M-PESA Receipt'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTruecallerSimulator;
