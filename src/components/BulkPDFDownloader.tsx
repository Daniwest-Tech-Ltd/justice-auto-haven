import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { format, subDays, subWeeks, subMonths, subYears } from "date-fns";

interface BulkPDFDownloaderProps {
  type: "receipts" | "invoices" | "orders" | "sales";
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
}

const DURATION_OPTIONS = [
  { label: "Last 24 Hours", days: 1 },
  { label: "Last 72 Hours", days: 3 },
  { label: "Last 1 Week", days: 7 },
  { label: "Last 3 Weeks", days: 21 },
  { label: "Last 1 Month", days: 30 },
  { label: "Last 3 Months", days: 90 },
  { label: "Last 5 Months", days: 150 },
  { label: "Last 7 Months", days: 210 },
  { label: "Last 1 Year", days: 365 },
  { label: "Last 2 Years", days: 730 },
];

// Company details
const COMPANY = {
  name: "Justice Ultimate Automobiles",
  tagline: "Premier Car Dealership in Kenya",
  phone1: "0722 827 458",
  phone2: "0751555544",
  email: "info@justiceultimateautomobiles.com",
  web: "www.justiceultimateautomobiles.com",
};

const formatCurrency = (amount: number) => {
  return "KES " + new Intl.NumberFormat("en-KE").format(amount);
};

export const BulkPDFDownloader = ({ type, onDownloadStart, onDownloadComplete }: BulkPDFDownloaderProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addPageWithBranding = (pdf: jsPDF, isFirstPage: boolean = false) => {
    if (!isFirstPage) {
      pdf.addPage();
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Watermark
    pdf.saveGraphicsState();
    pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
    pdf.setFontSize(50);
    pdf.setTextColor(30, 64, 175);
    pdf.text("JUSTICE ULTIMATE", pageWidth / 2, pageHeight / 2 - 20, {
      align: "center",
      angle: 45,
    });
    pdf.text("AUTOMOBILES", pageWidth / 2, pageHeight / 2 + 20, {
      align: "center",
      angle: 45,
    });
    pdf.restoreGraphicsState();

    // Header
    pdf.setFillColor(30, 64, 175);
    pdf.rect(0, 0, pageWidth, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(COMPANY.name, pageWidth / 2, 12, { align: "center" });
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(COMPANY.tagline, pageWidth / 2, 20, { align: "center" });
    pdf.text(`Phone: ${COMPANY.phone1} | ${COMPANY.phone2}`, pageWidth / 2, 27, { align: "center" });

    // Footer
    pdf.setFillColor(30, 64, 175);
    pdf.rect(0, pageHeight - 20, pageWidth, 20, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text(`${COMPANY.name} | ${COMPANY.tagline}`, pageWidth / 2, pageHeight - 13, { align: "center" });
    pdf.text(`Email: ${COMPANY.email} | Web: ${COMPANY.web}`, pageWidth / 2, pageHeight - 6, { align: "center" });

    return { contentTop: 40, contentBottom: pageHeight - 30 };
  };

  const generateReceiptPage = (pdf: jsPDF, receipt: any, pageNum: number, totalPages: number) => {
    const { contentTop } = addPageWithBranding(pdf, pageNum === 1);
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = contentTop;

    // Title
    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("PAYMENT RECEIPT", pageWidth / 2, y, { align: "center" });
    y += 12;

    // Receipt number badge
    pdf.setFillColor(240, 244, 255);
    pdf.roundedRect(pageWidth / 2 - 40, y - 5, 80, 12, 3, 3, "F");
    pdf.setFontSize(10);
    pdf.setTextColor(30, 64, 175);
    pdf.text(receipt.receipt_no, pageWidth / 2, y + 3, { align: "center" });
    y += 20;

    // Receipt details box
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 50, 3, 3, "F");
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.5);
    pdf.line(15, y, 15, y + 50);

    pdf.setTextColor(51, 51, 51);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    y += 12;
    pdf.text(`Customer: ${receipt.customer_name}`, 25, y);
    y += 10;
    pdf.text(`Date: ${format(new Date(receipt.created_at), "dd MMMM yyyy, HH:mm")}`, 25, y);
    y += 10;
    pdf.text(`Payment Method: ${receipt.payment_method.toUpperCase()}`, 25, y);
    y += 10;
    pdf.text(`Reference: ${receipt.payment_reference || "N/A"}`, 25, y);
    y += 25;

    // Amount box
    pdf.setFillColor(30, 64, 175);
    pdf.roundedRect(pageWidth / 2 - 50, y, 100, 35, 3, 3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text("Amount Paid", pageWidth / 2, y + 12, { align: "center" });
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatCurrency(receipt.amount_paid), pageWidth / 2, y + 27, { align: "center" });

    // Page number
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pdf.internal.pageSize.getHeight() - 25, { align: "right" });
  };

  const generateInvoicePage = (pdf: jsPDF, invoice: any, pageNum: number, totalPages: number) => {
    const { contentTop } = addPageWithBranding(pdf, pageNum === 1);
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = contentTop;

    // Title
    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVOICE", pageWidth / 2, y, { align: "center" });
    y += 10;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(invoice.invoice_no, pageWidth / 2, y, { align: "center" });
    y += 15;

    // Customer and invoice details
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, (pageWidth - 40) / 2, 45, 3, 3, "F");
    pdf.roundedRect(pageWidth / 2 + 5, y, (pageWidth - 40) / 2, 45, 3, 3, "F");

    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("BILL TO", 20, y + 10);
    pdf.text("INVOICE DETAILS", pageWidth / 2 + 10, y + 10);

    pdf.setTextColor(51, 51, 51);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(invoice.customer_name, 20, y + 22);
    pdf.text(invoice.customer_email || "", 20, y + 32);
    pdf.text(invoice.customer_phone || "", 20, y + 42);

    pdf.text(`Date: ${format(new Date(invoice.created_at), "dd MMM yyyy")}`, pageWidth / 2 + 10, y + 22);
    pdf.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth / 2 + 10, y + 32);
    y += 55;

    // Items table header
    pdf.setFillColor(30, 64, 175);
    pdf.rect(15, y, pageWidth - 30, 10, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Description", 20, y + 7);
    pdf.text("Qty", 120, y + 7);
    pdf.text("Price", 145, y + 7);
    pdf.text("Amount", 175, y + 7);
    y += 12;

    // Items
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    pdf.setTextColor(51, 51, 51);
    pdf.setFont("helvetica", "normal");
    items.forEach((item: any, idx: number) => {
      if (idx % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(15, y - 2, pageWidth - 30, 10, "F");
      }
      pdf.text(String(item.description || "Item").substring(0, 40), 20, y + 5);
      pdf.text(String(item.quantity || 1), 120, y + 5);
      pdf.text(formatCurrency(item.unit_price || 0), 145, y + 5);
      pdf.text(formatCurrency(item.amount || 0), 175, y + 5);
      y += 10;
    });
    y += 10;

    // Totals
    pdf.setFillColor(240, 244, 255);
    pdf.roundedRect(pageWidth - 95, y, 80, 45, 3, 3, "F");
    pdf.setFontSize(10);
    pdf.text("Subtotal:", pageWidth - 90, y + 12);
    pdf.text(formatCurrency(invoice.subtotal), pageWidth - 20, y + 12, { align: "right" });
    pdf.text(`VAT (${invoice.vat_rate}%):`, pageWidth - 90, y + 24);
    pdf.text(formatCurrency(invoice.vat_amount), pageWidth - 20, y + 24, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 64, 175);
    pdf.text("Grand Total:", pageWidth - 90, y + 38);
    pdf.text(formatCurrency(invoice.grand_total), pageWidth - 20, y + 38, { align: "right" });

    // Page number
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pdf.internal.pageSize.getHeight() - 25, { align: "right" });
  };

  const generateOrderPage = (pdf: jsPDF, order: any, pageNum: number, totalPages: number) => {
    const { contentTop } = addPageWithBranding(pdf, pageNum === 1);
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = contentTop;

    // Title
    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("ORDER REPORT", pageWidth / 2, y, { align: "center" });
    y += 15;

    // Order ID
    pdf.setFillColor(240, 244, 255);
    pdf.roundedRect(15, y, pageWidth - 30, 12, 3, 3, "F");
    pdf.setFontSize(10);
    pdf.setTextColor(30, 64, 175);
    pdf.text(`Order ID: ${order.id?.substring(0, 8).toUpperCase() || "N/A"}`, pageWidth / 2, y + 8, { align: "center" });
    y += 22;

    // Order details
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 70, 3, 3, "F");
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.5);
    pdf.line(15, y, 15, y + 70);

    pdf.setTextColor(51, 51, 51);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    y += 15;
    pdf.text(`Customer: ${order.customer_name || order.profiles?.full_name || "N/A"}`, 25, y);
    y += 12;
    pdf.text(`Email: ${order.customer_email || order.profiles?.email || "N/A"}`, 25, y);
    y += 12;
    pdf.text(`Phone: ${order.customer_phone || order.profiles?.phone || "N/A"}`, 25, y);
    y += 12;
    pdf.text(`Date: ${format(new Date(order.created_at), "dd MMMM yyyy, HH:mm")}`, 25, y);
    y += 12;
    pdf.text(`Status: ${(order.status || "pending").toUpperCase()}`, 25, y);
    y += 25;

    // Vehicle info if available
    if (order.cars || order.car_make) {
      pdf.setFillColor(30, 64, 175);
      pdf.roundedRect(15, y, pageWidth - 30, 10, 3, 3, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("VEHICLE DETAILS", 20, y + 7);
      y += 15;

      pdf.setTextColor(51, 51, 51);
      pdf.setFont("helvetica", "normal");
      const vehicle = order.cars || {};
      pdf.text(`Make: ${order.car_make || vehicle.make || "N/A"}`, 20, y);
      y += 10;
      pdf.text(`Model: ${order.car_model || vehicle.model || "N/A"}`, 20, y);
      y += 10;
      pdf.text(`Year: ${order.car_year || vehicle.year || "N/A"}`, 20, y);
      y += 10;
      pdf.text(`Price: ${formatCurrency(order.car_price || vehicle.price || 0)}`, 20, y);
    }

    // Page number
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pdf.internal.pageSize.getHeight() - 25, { align: "right" });
  };

  const generateSalePage = (pdf: jsPDF, sale: any, pageNum: number, totalPages: number) => {
    const { contentTop } = addPageWithBranding(pdf, pageNum === 1);
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = contentTop;

    // Title
    pdf.setTextColor(30, 64, 175);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("SALES RECORD", pageWidth / 2, y, { align: "center" });
    y += 15;

    // Sale ID
    pdf.setFillColor(34, 197, 94);
    pdf.roundedRect(pageWidth / 2 - 30, y, 60, 10, 3, 3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text("COMPLETED", pageWidth / 2, y + 7, { align: "center" });
    y += 20;

    // Sale details
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 60, 3, 3, "F");
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.5);
    pdf.line(15, y, 15, y + 60);

    pdf.setTextColor(51, 51, 51);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    y += 15;
    pdf.text(`Sale Date: ${format(new Date(sale.sale_date || sale.created_at), "dd MMMM yyyy")}`, 25, y);
    y += 12;
    pdf.text(`Customer ID: ${sale.customer_id?.substring(0, 8).toUpperCase() || "N/A"}`, 25, y);
    y += 12;
    pdf.text(`Payment Method: ${(sale.payment_method || "N/A").toUpperCase()}`, 25, y);
    y += 12;
    pdf.text(`Notes: ${sale.notes || "No additional notes"}`, 25, y);
    y += 25;

    // Amount box
    pdf.setFillColor(30, 64, 175);
    pdf.roundedRect(pageWidth / 2 - 55, y, 110, 35, 3, 3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text("Sale Amount", pageWidth / 2, y + 12, { align: "center" });
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatCurrency(sale.sale_price || sale.amount || 0), pageWidth / 2, y + 27, { align: "center" });

    // Page number
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pdf.internal.pageSize.getHeight() - 25, { align: "right" });
  };

  const handleDownload = async (days: number, label: string) => {
    setLoading(true);
    onDownloadStart?.();

    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const fromDateStr = fromDate.toISOString();

      let data: any[] = [];
      let tableName = "";

      switch (type) {
        case "receipts":
          tableName = "receipts";
          const { data: receiptsData } = await supabase
            .from("receipts")
            .select("*")
            .gte("created_at", fromDateStr)
            .order("created_at", { ascending: false });
          data = receiptsData || [];
          break;

        case "invoices":
          tableName = "invoices";
          const { data: invoicesData } = await supabase
            .from("invoices")
            .select("*")
            .gte("created_at", fromDateStr)
            .order("created_at", { ascending: false });
          data = invoicesData || [];
          break;

        case "orders":
          tableName = "whitelist_orders";
          const { data: ordersData } = await supabase
            .from("whitelist_orders")
            .select("*, cars(*), profiles(full_name, email, phone)")
            .gte("created_at", fromDateStr)
            .order("created_at", { ascending: false });
          data = ordersData || [];
          break;

        case "sales":
          tableName = "sales";
          const { data: salesData } = await supabase
            .from("sales")
            .select("*")
            .gte("created_at", fromDateStr)
            .order("created_at", { ascending: false });
          data = salesData || [];
          break;
      }

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: `No ${type} found for ${label.toLowerCase()}`,
          variant: "destructive",
        });
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const totalPages = data.length;

      data.forEach((item, index) => {
        const pageNum = index + 1;
        switch (type) {
          case "receipts":
            generateReceiptPage(pdf, item, pageNum, totalPages);
            break;
          case "invoices":
            generateInvoicePage(pdf, item, pageNum, totalPages);
            break;
          case "orders":
            generateOrderPage(pdf, item, pageNum, totalPages);
            break;
          case "sales":
            generateSalePage(pdf, item, pageNum, totalPages);
            break;
        }
      });

      const filename = `${type.charAt(0).toUpperCase() + type.slice(1)}-${label.replace(/\s/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);

      toast({
        title: "Download Complete",
        description: `Downloaded ${data.length} ${type} for ${label.toLowerCase()}`,
      });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      onDownloadComplete?.();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {loading ? "Generating..." : "Bulk Download"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Select Duration
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DURATION_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.days}
            onClick={() => handleDownload(option.days, option.label)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BulkPDFDownloader;
