import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CertificateModal from "@/components/CertificateModal";

const PrivacyPolicy = () => {
  const [showCertificate, setShowCertificate] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-accent bg-clip-text text-transparent">
          🔒 Privacy Policy
        </h1>
        
        <div className="space-y-6 text-foreground/90">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Information We Collect</h2>
            <p className="leading-relaxed mb-3">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Personal identification information (name, email, phone number)</li>
              <li>Account credentials and authentication data</li>
              <li>Vehicle preferences and search history</li>
              <li>Transaction and payment information</li>
              <li>Communication records and support inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">2. How We Use Your Information</h2>
            <p className="leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Provide personalized vehicle recommendations</li>
              <li>Monitor and analyze trends and usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">3. Information Sharing</h2>
            <p className="leading-relaxed">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
              <li>With your consent or at your direction</li>
              <li>With service providers who perform services on our behalf</li>
              <li>To comply with legal obligations</li>
              <li>To protect the rights and safety of our users and the public</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">4. Data Security & Regulatory Compliance</h2>
            <p className="leading-relaxed mb-3">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, access controls, and secure data storage practices.
            </p>
            <p className="leading-relaxed mb-3 font-semibold">
              Our data security and payment systems are certified and verified by Kenya's regulatory authorities:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>National Transport and Safety Authority (NTSA)</strong> - Vehicle data and registration compliance</li>
              <li><strong>Kenya Bureau of Standards (KEBS)</strong> - Quality and security standards</li>
              <li><strong>Kenya Revenue Authority (KRA)</strong> - Financial data and tax compliance</li>
              <li><strong>Kenya Roads Board (KRB)</strong> - Transport data regulations</li>
              <li><strong>Kenya National Highways Authority (KeNHA)</strong> - Highway transport data compliance</li>
              <li><strong>Kenya Urban Roads Authority (KURA)</strong> - Urban transport data standards</li>
              <li><strong>Competition Authority of Kenya</strong> - Consumer data protection compliance</li>
              <li><strong>Local County Business Permit Authority</strong> - Business data compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">5. Your Rights</h2>
            <p className="leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">6. Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">7. Third-Party Services</h2>
            <p className="leading-relaxed">
              Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">8. Children's Privacy</h2>
            <p className="leading-relaxed">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">9. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">10. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:<br />
              Email: justicevincentt@gmail.com<br />
              Phone: +254 722 827 458<br />
              Address: Mpesi Lane 11, Westlands, Nairobi, Kenya
            </p>
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

export default PrivacyPolicy;
