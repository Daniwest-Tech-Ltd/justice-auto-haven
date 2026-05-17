import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CertificateModal from "@/components/CertificateModal";

const TermsOfUse = () => {
  const [showCertificate, setShowCertificate] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-accent bg-clip-text text-transparent">
          📜 Terms of Use
        </h1>
        
        <div className="space-y-6 text-foreground/90">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Introduction</h2>
            <p className="leading-relaxed mb-3">
              Welcome to Justice Ultimate Automobiles, a certified automotive dealership operating in Kenya. By accessing and using our platform (website, services, and applications), you accept and agree to be bound by the terms and provisions of this agreement.
            </p>
            <p className="leading-relaxed">
              If you do not agree to these terms, please discontinue use of our services immediately. These Terms of Use constitute a legally binding agreement between you and Justice Ultimate Automobiles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">2. Company Certification & Regulatory Compliance</h2>
            <p className="leading-relaxed mb-3">
              <strong>Justice Ultimate Automobiles is a certified automotive dealer in Kenya</strong>, operating with officially recognized business credentials. We are fully registered and compliant with all regulatory requirements including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Business Registration Certificate</li>
              <li>KRA PIN and Tax Compliance</li>
              <li>NTSA Motor Dealer License</li>
              <li>Valid Business Permits</li>
            </ul>
            <p className="leading-relaxed mb-3 font-semibold">
              Our operations are certified and verified by the following Kenya authorities:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>National Transport and Safety Authority (NTSA)</strong> - Vehicle registration and transfer compliance</li>
              <li><strong>Kenya Bureau of Standards (KEBS)</strong> - Quality and safety standards</li>
              <li><strong>Kenya Revenue Authority (KRA)</strong> - Tax compliance and documentation</li>
              <li><strong>Kenya Roads Board (KRB)</strong> - Road transport regulations</li>
              <li><strong>Kenya National Highways Authority (KeNHA)</strong> - Highway transport compliance</li>
              <li><strong>Kenya Urban Roads Authority (KURA)</strong> - Urban transport standards</li>
              <li><strong>Competition Authority of Kenya</strong> - Consumer protection compliance</li>
              <li><strong>Local County Business Permit Authority</strong> - Business operations permit</li>
            </ul>
            <Button
              onClick={() => setShowCertificate(true)}
              variant="link"
              className="p-0 h-auto text-primary hover:underline font-semibold inline-flex items-center gap-2"
            >
              View Our Company Certificate <ExternalLink className="w-4 h-4" />
            </Button>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">3. Service Description</h2>
            <p className="leading-relaxed mb-3">
              Justice Ultimate Automobiles provides the following services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>New and pre-owned vehicle sales</li>
              <li>Vehicle rental services (short-term and long-term)</li>
              <li>Trade-in valuation and processing</li>
              <li>Vehicle financing assistance through partner institutions</li>
              <li>Vehicle inspection and verification services</li>
              <li>Vehicle delivery and logistics coordination</li>
              <li>After-sales support and warranty services</li>
              <li>Automotive information, resources, and consultation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">4. User Responsibilities</h2>
            <p className="leading-relaxed mb-3">
              As a user of our platform, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration and transactions</li>
              <li>Maintain the confidentiality and security of your account credentials</li>
              <li>Use our services in compliance with all applicable Kenyan laws and regulations</li>
              <li>Not engage in any fraudulent, illegal, or harmful activities</li>
              <li>Not impersonate others or misrepresent your identity</li>
              <li>Respect intellectual property rights</li>
              <li>Not interfere with or disrupt the platform's functionality</li>
              <li>Notify us immediately of any unauthorized account access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">5. Vehicle Purchase Terms</h2>
            <p className="leading-relaxed mb-3">
              All vehicle purchases, rentals, and trade-ins are governed by the following terms:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Availability:</strong> All vehicles are subject to prior sale and availability</li>
              <li><strong>Pricing:</strong> Prices are subject to change without notice. The price at time of order confirmation is final</li>
              <li><strong>Vehicle Condition:</strong> All descriptions are provided in good faith. We strongly recommend physical inspection before purchase</li>
              <li><strong>Inspection Rights:</strong> Customers have the right to inspect vehicles before final payment</li>
              <li><strong>Documentation:</strong> All vehicles come with proper transfer documentation and verified history</li>
              <li><strong>Delivery:</strong> Delivery timelines and costs vary by location and are confirmed at time of purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">6. Payment Terms & Secure Payment Methods</h2>
            <p className="leading-relaxed mb-3">
              Payment terms and conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Approved Payment Methods:</strong> M-Pesa, bank transfer, cash (in-office), Pesapal secure gateway, and approved financing partners</li>
              <li><strong>Security:</strong> All transactions are processed through secure, encrypted channels certified by Kenya authorities</li>
              <li><strong>Deposits:</strong> Non-refundable deposits may be required to reserve vehicles</li>
              <li><strong>Full Payment:</strong> Required before vehicle delivery or transfer of ownership</li>
              <li><strong>Receipts:</strong> Official receipts are issued for all payments</li>
              <li><strong>Refunds:</strong> Subject to specific refund policy (detailed below)</li>
              <li><strong>Currency:</strong> All prices are in Kenyan Shillings (KES) unless otherwise stated</li>
            </ul>
            <p className="leading-relaxed mt-3 mb-3">
              <strong>Refund Policy:</strong> Refunds are processed based on transaction stage: Full refund (minus processing fee) before inspection; 10% cancellation fee after inspection but before delivery; No refunds after delivery (after-sales support available). Refunds are processed within 7-14 business days.
            </p>
            <p className="leading-relaxed mb-3 font-semibold">
              Our secure payment methods are certified and verified by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Kenya Revenue Authority (KRA)</strong> - Tax compliance</li>
              <li><strong>Kenya Bureau of Standards (KEBS)</strong> - Quality standards</li>
              <li><strong>National Transport and Safety Authority (NTSA)</strong> - Vehicle transaction compliance</li>
              <li><strong>Competition Authority of Kenya</strong> - Consumer protection</li>
              <li><strong>Central Bank of Kenya</strong> - Payment systems regulation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">7. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content on this platform, including but not limited to text, graphics, logos, images, videos, software, design elements, and trademarks, is the exclusive property of Justice Ultimate Automobiles and is protected by Kenyan and international intellectual property laws. Unauthorized use, reproduction, distribution, or modification is strictly prohibited and may result in legal action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">8. Limitation of Liability</h2>
            <p className="leading-relaxed mb-3">
              To the fullest extent permitted by law, Justice Ultimate Automobiles shall not be liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Third-party financing decisions or terms</li>
              <li>Delays caused by circumstances beyond our reasonable control</li>
              <li>Typographical errors or inaccuracies in listings</li>
              <li>Vehicle performance issues arising after delivery (warranty terms apply)</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Our total liability for any claim shall not exceed the amount paid for the specific service or product in question.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">9. Account Terms & User Conduct</h2>
            <p className="leading-relaxed mb-3">
              If you create an account on our platform:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You are responsible for all activities under your account</li>
              <li>You must keep your login credentials secure</li>
              <li>You must immediately notify us of unauthorized access</li>
              <li>We reserve the right to suspend or terminate accounts for violations</li>
              <li>One person or entity per account (no account sharing)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">10. Governing Law & Dispute Resolution</h2>
            <p className="leading-relaxed">
              These Terms of Use are governed by and construed in accordance with the laws of the Republic of Kenya. Any disputes arising from these terms or your use of our services shall be subject to the exclusive jurisdiction of the courts of Kenya. We encourage good-faith resolution of disputes through direct communication before legal action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">11. Modification of Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify, update, or change these Terms of Use at any time without prior notice. Continued use of our services after changes constitutes acceptance of the modified terms. We will notify users of significant changes via email, platform notifications, or prominent website announcements. It is your responsibility to review these terms periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">12. Contact Information</h2>
            <p className="leading-relaxed mb-4">
              For questions, concerns, or clarifications regarding these Terms of Use, please contact us:
            </p>
            <div className="bg-background/50 p-4 rounded-lg border border-border">
              <p className="font-semibold mb-2">Justice Ultimate Automobiles</p>
              <p><strong>CEO:</strong> Justice Vincent</p>
              <p><strong>Email:</strong> <a href="mailto:support@justiceultimateautomobiles.com" className="text-primary hover:underline">support@justiceultimateautomobiles.com</a></p>
              <p><strong>Phone:</strong> <a href="tel:+254722827458" className="text-primary hover:underline">+254 722 827 458</a></p>
              <p><strong>Address:</strong> Mpesi Lane 11, Westlands, Nairobi, Kenya</p>
              <p className="mt-3">
                <Button
                  onClick={() => setShowCertificate(true)}
                  variant="link"
                  className="p-0 h-auto text-primary hover:underline font-semibold inline-flex items-center gap-2"
                >
                  View Company Certificate <ExternalLink className="w-4 h-4" />
                </Button>
              </p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Last Updated: January 2025<br />
              © 2025 Justice Ultimate Automobiles. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      
      {/* Certificate Modal */}
      <CertificateModal open={showCertificate} onOpenChange={setShowCertificate} />
    </div>
  );
};

export default TermsOfUse;