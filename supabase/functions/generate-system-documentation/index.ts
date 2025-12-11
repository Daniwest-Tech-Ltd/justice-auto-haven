import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin_id } = await req.json();
    
    if (!admin_id) {
      throw new Error("Admin ID is required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Gather system metadata
    const systemMetadata = await gatherSystemMetadata(supabase);

    // Generate documentation content using AI
    const documentationContent = await generateDocumentationWithAI(systemMetadata);

    // Generate HTML for PDF
    const htmlContent = generateDocumentationHTML(documentationContent);

    // Store the document record
    const { data: docRecord, error: insertError } = await supabase
      .from("generated_documents")
      .insert({
        generated_by: admin_id,
        type: "documentation",
        title: "Justice Ultimate Automobiles - System Documentation",
        description: "Complete system documentation generated automatically",
        version: "v2.0",
        pages: 35,
        word_count: documentationContent.split(/\s+/).length,
        metadata: {
          generated_method: "AI-powered analysis",
          sections: [
            "Cover Page",
            "Table of Contents",
            "Executive Summary",
            "System Architecture",
            "Installation Guide",
            "User Guide",
            "Developer Guide",
            "Security Features",
            "API Reference",
            "Database Schema",
            "Appendices"
          ]
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting document record:", insertError);
    }

    // Return the HTML content for client-side PDF generation
    return new Response(
      JSON.stringify({
        success: true,
        html_content: htmlContent,
        document_id: docRecord?.id,
        message: "Documentation generated successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating documentation:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate documentation" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function gatherSystemMetadata(supabase: any) {
  // Get table counts
  const [
    { count: carsCount },
    { count: usersCount },
    { count: ordersCount },
    { count: rentalsCount },
    { count: staffCount }
  ] = await Promise.all([
    supabase.from("cars").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("contact_submissions").select("*", { count: "exact", head: true }),
    supabase.from("rental_bookings").select("*", { count: "exact", head: true }),
    supabase.from("staff").select("*", { count: "exact", head: true })
  ]);

  return {
    systemName: "Justice Ultimate Automobiles",
    version: "v2.0",
    developer: "Daniwest Tech Sol",
    developerContact: {
      phone: "0701460110",
      email: "Daniwesttechnologies@gmail.com"
    },
    company: {
      name: "Justice Ultimate Automobiles",
      website: "www.justiceultimateautomobiles.com",
      phone: "0722827458",
      manager: "Justice Vincent",
      salesManager: "Daniel Maina"
    },
    developmentPeriod: "8+ months",
    technologies: {
      frontend: ["React 18", "TypeScript", "Tailwind CSS", "Vite", "Shadcn/UI"],
      backend: ["Supabase", "PostgreSQL", "Edge Functions (Deno)"],
      authentication: ["Supabase Auth", "2FA (Email OTP, TOTP, Fingerprint)", "Google OAuth"],
      apis: ["Resend (Email)", "Brevo (SMS)", "WhatsApp Cloud API", "Lovable AI Gateway"],
      security: ["Row Level Security (RLS)", "AI Threat Detection", "Quantum-Ready Cryptography"],
      deployment: ["Vercel", "Cloudflare"]
    },
    statistics: {
      totalVehicles: carsCount || 0,
      totalUsers: usersCount || 0,
      totalOrders: ordersCount || 0,
      totalRentals: rentalsCount || 0,
      totalStaff: staffCount || 0
    },
    features: [
      "Vehicle Catalogue Management",
      "Car Rental System",
      "Trade-In Submission Portal",
      "Customer Dashboard",
      "Admin Dashboard",
      "Staff Management & HR",
      "Payroll Management",
      "Attendance Tracking",
      "Job Card System",
      "CRM & Lead Management",
      "Multi-Channel Notifications (Email, SMS, WhatsApp)",
      "Two-Factor Authentication",
      "AI Security Dashboard",
      "Vehicle Analytics",
      "Sales Forecasting",
      "Daily Report Generation",
      "PDF Export Functionality",
      "Real-time Session Management"
    ],
    pages: [
      { path: "/", name: "Home Page" },
      { path: "/catalogue", name: "Vehicle Catalogue" },
      { path: "/car/:id", name: "Car Details" },
      { path: "/rentals", name: "Rental Catalogue" },
      { path: "/trade-in", name: "Trade-In Submission" },
      { path: "/about", name: "About Us" },
      { path: "/contact", name: "Contact" },
      { path: "/services", name: "Services" },
      { path: "/videos", name: "Videos" },
      { path: "/blogs", name: "Blog" },
      { path: "/auth", name: "Login/Register" },
      { path: "/customer-dashboard", name: "Customer Dashboard" },
      { path: "/admin-dashboard", name: "Admin Dashboard" },
      { path: "/admin/cars", name: "Car Management" },
      { path: "/admin/customers", name: "Customer Management" },
      { path: "/admin/orders", name: "Orders Management" },
      { path: "/admin/rentals", name: "Rentals Management" },
      { path: "/admin/trade-ins", name: "Trade-Ins Management" },
      { path: "/admin/staff", name: "Staff Management" },
      { path: "/admin/hr", name: "HR Management" },
      { path: "/admin/payroll", name: "Payroll" },
      { path: "/admin/attendance", name: "Attendance" },
      { path: "/admin/security", name: "AI Security Dashboard" },
      { path: "/admin/sales", name: "Sales Analytics" },
      { path: "/admin/reports", name: "Daily Reports" },
      { path: "/admin/settings", name: "Settings" }
    ]
  };
}

async function generateDocumentationWithAI(metadata: any): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.log("No AI API key available, using template-based generation");
    return generateTemplateDocumentation(metadata);
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional technical writer. Generate comprehensive system documentation for a web application. The documentation should be detailed, professional, and suitable for developers, system administrators, and end users. Include installation instructions, user guides, API references, and security information.`
          },
          {
            role: "user",
            content: `Generate comprehensive system documentation for the following system:

System: ${metadata.systemName}
Version: ${metadata.version}
Developer: ${metadata.developer}
Development Period: ${metadata.developmentPeriod}

Technologies Used:
- Frontend: ${metadata.technologies.frontend.join(", ")}
- Backend: ${metadata.technologies.backend.join(", ")}
- Authentication: ${metadata.technologies.authentication.join(", ")}
- APIs: ${metadata.technologies.apis.join(", ")}
- Security: ${metadata.technologies.security.join(", ")}

Key Features:
${metadata.features.map((f: string) => `- ${f}`).join("\n")}

Pages and Routes:
${metadata.pages.map((p: any) => `- ${p.path}: ${p.name}`).join("\n")}

Statistics:
- Total Vehicles: ${metadata.statistics.totalVehicles}
- Total Users: ${metadata.statistics.totalUsers}
- Total Staff: ${metadata.statistics.totalStaff}

Company Details:
- Name: ${metadata.company.name}
- Website: ${metadata.company.website}
- Phone: ${metadata.company.phone}

Please generate detailed documentation covering:
1. Executive Summary
2. System Architecture
3. Installation & Setup Guide
4. User Guide (for customers)
5. Admin Guide
6. Developer Guide
7. Security Features & Best Practices
8. API Documentation
9. Database Schema Overview
10. Troubleshooting Guide
11. Appendices

Make it professional, detailed, and at least 30+ pages worth of content.`
          }
        ],
        max_completion_tokens: 8000
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return generateTemplateDocumentation(metadata);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (aiContent) {
      return aiContent;
    }
    
    return generateTemplateDocumentation(metadata);
  } catch (error) {
    console.error("AI generation error:", error);
    return generateTemplateDocumentation(metadata);
  }
}

function generateTemplateDocumentation(metadata: any): string {
  const generatedDate = new Date().toLocaleString();
  
  return `
# ${metadata.systemName}
## Complete System Documentation
### Version ${metadata.version}

---

**Generated:** ${generatedDate}
**Document Version:** DOC-${Date.now().toString(36).toUpperCase()}
**Developed by:** ${metadata.developer}
**Contact:** ${metadata.developerContact.email} | ${metadata.developerContact.phone}

---

## Table of Contents

1. Executive Summary
2. System Architecture
3. Technology Stack
4. Installation Guide
5. User Guide
6. Administrator Guide
7. Developer Guide
8. Security Features
9. API Reference
10. Database Schema
11. Troubleshooting
12. Appendices

---

## 1. Executive Summary

${metadata.systemName} is a comprehensive automotive dealership management system developed over ${metadata.developmentPeriod} of intensive development. This enterprise-grade solution provides end-to-end management capabilities for vehicle sales, rentals, trade-ins, and customer relationship management.

### Key Highlights:
- **Total Vehicles:** ${metadata.statistics.totalVehicles}
- **Registered Users:** ${metadata.statistics.totalUsers}
- **Staff Members:** ${metadata.statistics.totalStaff}
- **Active Rentals:** ${metadata.statistics.totalRentals}
- **Orders Processed:** ${metadata.statistics.totalOrders}

### Business Benefits:
- Streamlined vehicle inventory management
- Automated customer notifications via Email, SMS, and WhatsApp
- Real-time analytics and reporting
- Enhanced security with AI-powered threat detection
- Multi-channel communication platform

---

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a modern JAMstack architecture with:

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React     │  │  TypeScript │  │ Tailwind CSS│         │
│  │   SPA       │  │   (Strict)  │  │  Styling    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Supabase   │  │   Edge      │  │  External   │         │
│  │  Client     │  │  Functions  │  │   APIs      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │   Storage   │  │    RLS      │         │
│  │  Database   │  │   Buckets   │  │  Policies   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 2.2 Component Diagram

The frontend is organized into:
- **Pages:** ${metadata.pages.length} distinct routes
- **Components:** 100+ reusable React components
- **Hooks:** Custom hooks for authentication, analytics, and data fetching
- **Utilities:** Helper functions for validation, formatting, and API calls

---

## 3. Technology Stack

### 3.1 Frontend Technologies
${metadata.technologies.frontend.map((tech: string) => `- **${tech}**`).join("\n")}

### 3.2 Backend Technologies
${metadata.technologies.backend.map((tech: string) => `- **${tech}**`).join("\n")}

### 3.3 Authentication
${metadata.technologies.authentication.map((tech: string) => `- **${tech}**`).join("\n")}

### 3.4 Third-Party Integrations
${metadata.technologies.apis.map((api: string) => `- **${api}**`).join("\n")}

### 3.5 Security Features
${metadata.technologies.security.map((sec: string) => `- **${sec}**`).join("\n")}

---

## 4. Installation Guide

### 4.1 Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Git version control
- Supabase account (for backend)
- Vercel account (for deployment)

### 4.2 Local Development Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/your-repo/justice-ultimate-automobiles.git

# Navigate to project directory
cd justice-ultimate-automobiles

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
\`\`\`

### 4.3 Environment Variables

\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
\`\`\`

### 4.4 Database Setup
The database schema is automatically managed through Supabase migrations.

---

## 5. User Guide

### 5.1 Customer Portal

#### Registration
1. Navigate to ${metadata.company.website}/auth
2. Click "Create Account"
3. Fill in required details (name, email, phone, location)
4. Complete 2FA verification
5. Access your dashboard

#### Browsing Vehicles
- Visit the Catalogue page to view all available vehicles
- Use filters to narrow down by brand, year, price range
- Click on any vehicle to view detailed specifications

#### Making Inquiries
- Use the Contact form for general inquiries
- Submit trade-in requests through the Trade-In portal
- Book rental vehicles through the Rentals section

### 5.2 Available Pages

${metadata.pages.map((page: any) => `| ${page.path} | ${page.name} |`).join("\n")}

---

## 6. Administrator Guide

### 6.1 Admin Dashboard Overview
The admin dashboard provides centralized control over all system operations.

### 6.2 Key Admin Functions
${metadata.features.map((feature: string) => `- ${feature}`).join("\n")}

### 6.3 User Management
- View all registered customers
- Suspend/activate user accounts
- Send notifications to users

### 6.4 Vehicle Management
- Add new vehicles with images
- Edit vehicle details
- Mark vehicles as sold/available
- Feature vehicles on homepage

### 6.5 Order & Rental Management
- Process customer orders
- Manage rental bookings
- Handle trade-in submissions

---

## 7. Developer Guide

### 7.1 Project Structure

\`\`\`
src/
├── components/     # Reusable UI components
├── pages/          # Route-based page components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── integrations/   # External service integrations
├── assets/         # Static assets
└── data/           # Static data files

supabase/
├── functions/      # Edge functions
├── migrations/     # Database migrations
└── config.toml     # Supabase configuration
\`\`\`

### 7.2 Coding Standards
- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Component-based architecture

### 7.3 Adding New Features
1. Create component in appropriate directory
2. Add route in App.tsx if needed
3. Implement data fetching with React Query
4. Add necessary database tables via migrations
5. Write edge functions for server-side logic

---

## 8. Security Features

### 8.1 Authentication Security
- Multi-factor authentication (Email OTP, TOTP, Fingerprint)
- Session management with automatic timeout
- Password strength enforcement
- Brute-force protection

### 8.2 Data Security
- Row-Level Security (RLS) on all tables
- Encrypted data transmission (HTTPS)
- Secure cookie handling
- Input validation and sanitization

### 8.3 AI-Powered Security
- Real-time threat detection
- Anomaly detection in user behavior
- Automated suspicious activity alerts
- Security event logging and auditing

### 8.4 Quantum-Ready Cryptography
The system is designed with future-proof cryptographic standards to ensure data remains secure against emerging quantum computing threats.

---

## 9. API Reference

### 9.1 Authentication Endpoints
- POST /auth/signup - User registration
- POST /auth/signin - User login
- POST /auth/signout - User logout
- POST /auth/reset-password - Password reset

### 9.2 Vehicle Endpoints
- GET /rest/v1/cars - List all vehicles
- GET /rest/v1/cars?id=eq.{id} - Get single vehicle
- POST /rest/v1/cars - Create vehicle (admin)
- PATCH /rest/v1/cars?id=eq.{id} - Update vehicle (admin)

### 9.3 Edge Functions
- send-notifications - Multi-channel notifications
- send-2fa-code - 2FA code generation
- generate-daily-reports - Report generation
- ai-threat-scoring - Security analysis

---

## 10. Database Schema

### 10.1 Core Tables
- **profiles** - User profile information
- **cars** - Vehicle inventory
- **rental_cars** - Rental fleet
- **rental_bookings** - Rental reservations
- **contact_submissions** - Customer inquiries
- **orders** - Purchase orders

### 10.2 Staff Management
- **staff** - Employee records
- **attendance** - Attendance tracking
- **payroll** - Salary information
- **job_cards** - Work assignments

### 10.3 Security Tables
- **audit_logs** - Activity logging
- **security_events** - Security incidents
- **sessions** - User sessions
- **two_factor_auth** - 2FA records

---

## 11. Troubleshooting

### Common Issues

**Issue: Unable to login**
- Clear browser cache and cookies
- Ensure email/password are correct
- Check if account is suspended

**Issue: Images not loading**
- Verify Supabase storage bucket permissions
- Check image URL format

**Issue: Notifications not sending**
- Verify API keys are configured
- Check edge function logs

---

## 12. Appendices

### A. Company Information

**${metadata.company.name}**
- Website: ${metadata.company.website}
- Phone: ${metadata.company.phone}
- General Manager: ${metadata.company.manager}
- Sales Manager: ${metadata.company.salesManager}

### B. Developer Information

**${metadata.developer}**
- Email: ${metadata.developerContact.email}
- Phone: ${metadata.developerContact.phone}
- Development Period: ${metadata.developmentPeriod}
- System Version: ${metadata.version}

### C. Version History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2024 | Initial release (Training) |
| v2.0 | 2025 | Production release (Total Perfection) |

---

**© ${new Date().getFullYear()} ${metadata.company.name}. All rights reserved.**
**Developed by ${metadata.developer}**
`;
}

function generateDocumentationHTML(content: string): string {
  const generatedDate = new Date().toLocaleString();
  
  // Convert markdown-like content to HTML
  let htmlContent = content
    .replace(/^# (.+)$/gm, '<h1 class="text-4xl font-bold mb-6 text-primary">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-3xl font-bold mb-4 mt-8 text-primary border-b-2 border-primary pb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-2xl font-semibold mb-3 mt-6">$3</h3>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-xl font-medium mb-2 mt-4">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^\| (.+) \|$/gm, (match, content) => {
      const cells = content.split(' | ').map((cell: string) => `<td class="border px-4 py-2">${cell.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/---/g, '<hr class="my-8 border-t-2 border-primary/20">');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Justice Ultimate Automobiles - System Documentation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
    }
    
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      text-align: center;
      padding: 40px;
      page-break-after: always;
    }
    
    .cover-page .logo {
      width: 200px;
      height: 200px;
      margin-bottom: 40px;
    }
    
    .cover-page h1 {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    
    .cover-page h2 {
      font-size: 32px;
      font-weight: 500;
      margin-bottom: 40px;
      opacity: 0.9;
    }
    
    .cover-page .meta {
      font-size: 18px;
      opacity: 0.8;
    }
    
    .cover-page .watermark {
      position: absolute;
      font-size: 120px;
      font-weight: 700;
      opacity: 0.05;
      transform: rotate(-30deg);
      white-space: nowrap;
    }
    
    .header {
      background: #dc2626;
      color: white;
      padding: 15px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
    }
    
    .header .company {
      font-weight: 600;
    }
    
    .header .version {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .footer {
      background: #f3f4f6;
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 2px solid #dc2626;
    }
    
    .content {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
    }
    
    .text-primary { color: #dc2626; }
    .text-4xl { font-size: 2.25rem; }
    .text-3xl { font-size: 1.875rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-xl { font-size: 1.25rem; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .mt-8 { margin-top: 2rem; }
    .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
    .my-8 { margin-top: 2rem; margin-bottom: 2rem; }
    .ml-4 { margin-left: 1rem; }
    .pb-2 { padding-bottom: 0.5rem; }
    .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .p-4 { padding: 1rem; }
    .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
    .border-primary { border-color: #dc2626; }
    .rounded { border-radius: 0.25rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .overflow-x-auto { overflow-x: auto; }
    .bg-gray-100 { background-color: #f3f4f6; }
    .bg-gray-900 { background-color: #111827; }
    .text-green-400 { color: #4ade80; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    
    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.75rem;
      text-align: left;
    }
    
    th {
      background: #f9fafb;
      font-weight: 600;
    }
    
    ul, ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    
    li {
      margin-bottom: 0.5rem;
    }
    
    hr {
      border: none;
      border-top: 2px solid #fecaca;
      margin: 2rem 0;
    }
    
    @media print {
      .header { position: relative; }
      .content { padding: 20px; }
      .cover-page { page-break-after: always; }
      h2 { page-break-before: always; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="watermark">JUSTICE ULTIMATE</div>
    <img src="https://www.justiceultimateautomobiles.com/logo.png" alt="Logo" class="logo" onerror="this.style.display='none'">
    <h1>Justice Ultimate Automobiles</h1>
    <h2>System Documentation</h2>
    <div class="meta">
      <p>Version 2.0</p>
      <p>Generated: ${generatedDate}</p>
      <p>Document ID: DOC-${Date.now().toString(36).toUpperCase()}</p>
    </div>
    <div style="margin-top: 60px; opacity: 0.7;">
      <p>Developed by Daniwest Tech Sol</p>
      <p>Contact: Daniwesttechnologies@gmail.com | 0701460110</p>
    </div>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="company">Justice Ultimate Automobiles - System Documentation</div>
    <div class="version">v2.0 | ${generatedDate}</div>
  </div>

  <!-- Content -->
  <div class="content" style="margin-top: 80px;">
    <p class="mb-4">${htmlContent}</p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p><strong>Justice Ultimate Automobiles</strong> | www.justiceultimateautomobiles.com | Phone: 0722827458</p>
    <p>Developed by <strong>Daniwest Tech Sol</strong> | Email: Daniwesttechnologies@gmail.com | Phone: 0701460110</p>
    <p>© ${new Date().getFullYear()} All Rights Reserved</p>
  </div>
</body>
</html>
`;
}
