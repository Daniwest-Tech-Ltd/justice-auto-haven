import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CertificateModal from "@/components/CertificateModal";

const FAQs = () => {
  const [showCertificate, setShowCertificate] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-accent bg-clip-text text-transparent">
          ❓ Frequently Asked Questions
        </h1>
        
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="certified" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Is Justice Ultimate Automobiles a certified dealership?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              <p className="mb-4">
                Yes! Justice Ultimate Automobiles is a fully certified automotive dealer in Kenya, operating with officially recognized business credentials. We are registered and compliant with all regulatory requirements.
              </p>
              <Button
                onClick={() => setShowCertificate(true)}
                variant="link"
                className="p-0 h-auto inline-flex items-center gap-2 text-primary hover:underline"
              >
                View Our Company Certificate <ExternalLink className="w-4 h-4" />
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="buying-process" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              How do I buy a car from Justice Ultimate Automobiles?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              <ol className="list-decimal list-inside space-y-2">
                <li>Browse our catalogue and select your preferred vehicle</li>
                <li>Add the car to your whitelist or submit an order directly</li>
                <li>Our sales team will contact you to discuss details</li>
                <li>Schedule a physical inspection at our location (recommended)</li>
                <li>Complete payment through our secure channels</li>
                <li>Collect your vehicle or arrange delivery</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payment-options" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              What payment options do you accept?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              <p className="mb-3">We accept multiple secure payment methods:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>M-Pesa payments</li>
                <li>Bank transfers</li>
                <li>Cash payments (at our office)</li>
                <li>Installment plans (subject to approval)</li>
              </ul>
              <p className="mt-3">All payments are processed securely and you'll receive official receipts.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="inspection" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Can I inspect the vehicle before purchasing?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              Absolutely! We highly recommend physical inspections. You can visit our showroom at Mpesi Lane 11, Westlands, Nairobi to view and test drive vehicles. Schedule an appointment by calling +254 722 827 458 or emailing support@justiceultimateautomobiles.com.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="delivery" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Do you offer delivery services?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              Yes, we offer vehicle delivery services within Kenya. Delivery fees vary depending on location. Contact our sales team for a delivery quote to your specific area.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="warranty" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Do your vehicles come with a warranty?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              Yes, all our vehicles come with warranty coverage. The warranty period and terms vary by vehicle type, age, and condition. Our sales team will provide detailed warranty information for each specific vehicle.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="trade-in" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Can I trade in my current vehicle?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              Yes! We accept trade-ins. Submit your vehicle details through our Trade-In Submission page, and our team will evaluate your car and provide a fair market valuation. The trade-in value can be applied toward your new vehicle purchase.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rental" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Do you offer car rental services?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              Yes, we offer both short-term and long-term car rental services. Browse our rental catalogue, select your preferred vehicle, choose rental dates, and submit your booking. Our team will confirm availability and finalize the rental agreement.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="refunds" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              What is your refund and cancellation policy?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              <p className="mb-3">Refund and cancellation terms depend on the stage of the transaction:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Before vehicle inspection: Full refund minus processing fee</li>
                <li>After inspection but before delivery: Subject to 10% cancellation fee</li>
                <li>After delivery: No refunds, but we offer after-sales support</li>
              </ul>
              <p className="mt-3">All refunds are processed within 7-14 business days.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="vehicle-history" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Are vehicle histories verified?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              Yes! We provide 100% verified vehicle history reports including mileage verification, accident history, ownership records, and service history. All vehicles undergo thorough inspection before listing.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="location" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Where is your showroom located?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              Our showroom is located at:<br />
              <strong>Mpesi Lane 11, Westlands, Nairobi, Kenya</strong><br /><br />
              Business Hours: Monday - Saturday, 8:00 AM - 6:00 PM<br />
              Sunday: 10:00 AM - 4:00 PM
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contact" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              How can I contact customer support?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              <p className="mb-3">We offer multiple support channels:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Phone:</strong> +254 722 827 458</li>
                <li><strong>Email:</strong> support@justiceultimateautomobiles.com</li>
                <li><strong>WhatsApp:</strong> Available on request</li>
                <li><strong>Live Chat:</strong> Available on our website during business hours</li>
                <li><strong>In-Person:</strong> Visit our office at Mpesi Lane 11, Westlands</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="account" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Do I need an account to purchase a vehicle?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              While you can browse our catalogue without an account, creating an account allows you to save your whitelist, track orders, view purchase history, receive personalized notifications, and access exclusive customer benefits.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="financing" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Do you offer financing options?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              Yes, we work with trusted financial partners to offer vehicle financing solutions. Contact our sales team to discuss financing options, interest rates, and repayment terms that suit your budget.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="verify-certificate" className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              How can I verify your company certificate?
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80 pt-4">
              You can view and download our official company certificate anytime. The certificate contains our registration details, business permit, and compliance information. Click the link below to view:
              <br /><br />
              <Button
                onClick={() => setShowCertificate(true)}
                variant="link"
                className="p-0 h-auto inline-flex items-center gap-2 text-primary hover:underline font-semibold"
              >
                View Company Certificate <ExternalLink className="w-4 h-4" />
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help!
          </p>
          <a 
            href="/help-support"
            className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
          >
            Visit Help & Support →
          </a>
        </div>
      </div>
      
      {/* Certificate Modal */}
      <CertificateModal open={showCertificate} onOpenChange={setShowCertificate} />
    </div>
  );
};

export default FAQs;