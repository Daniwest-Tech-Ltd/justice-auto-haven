/**
 * Professional Motor Vehicle Sale Agreement PDF generator
 * Justice Ultimate Automobiles — official branded document
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";
import logoUrl from "@/assets/agreement-logo.png";
import stampUrl from "@/assets/stamp.png";

export interface SalesAgreementData {
  id?: string;
  agreement_number?: string | null;
  agreement_date?: string | null;
  // Seller
  seller_name?: string | null;
  seller_id_no?: string | null;
  seller_address?: string | null;
  seller_phone?: string | null;
  seller_kra_pin?: string | null;
  // Buyer
  buyer_name?: string | null;
  buyer_id_no?: string | null;
  buyer_address?: string | null;
  buyer_phone?: string | null;
  buyer_kra_pin?: string | null;
  // Vehicle
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_registration?: string | null;
  vehicle_vin?: string | null;
  vehicle_engine_no?: string | null;
  vehicle_body?: string | null;
  vehicle_transmission?: string | null;
  vehicle_fuel?: string | null;
  vehicle_color?: string | null;
  vehicle_seats?: number | null;
  vehicle_condition?: string | null;
  // Sale terms
  purchase_price?: number | null;
  deposit_paid?: number | null;
  balance_payable?: number | null;
  payment_method?: string | null;
  payment_terms?: string | null;
  instalment_count?: number | null;
  instalment_amount?: number | null;
  // Confirmations
  condition_accepted?: boolean | null;
  accessories?: string[] | null;
  other_accessories?: string | null;
  documents?: string[] | null;
  other_documents?: string | null;
  terms_accepted?: boolean | null;
  // Signatures
  seller_signature?: string | null;
  buyer_signature?: string | null;
  witness_name?: string | null;
  witness_signature?: string | null;
  status?: string | null;
}

const RED: [number, number, number] = [178, 18, 28];
const DARK: [number, number, number] = [25, 25, 25];
const GREY: [number, number, number] = [110, 110, 110];

const fmtMoney = (n?: number | null) =>
  n != null && !isNaN(Number(n)) ? `KSh ${Number(n).toLocaleString("en-KE")}` : "________________";

const fmtDate = (d?: string | null) => {
  if (!d) return "________________";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const v = (val?: string | number | null) =>
  val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : "_____________________";

const toDataUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

const TERMS_CLAUSES = [
  "The Seller warrants that they are the legal owner of the vehicle and that it is free from any encumbrances, loans, or third-party claims.",
  "The Buyer confirms having inspected, viewed and test-driven the vehicle, and accepts it in its present condition.",
  "Full ownership of the vehicle shall pass to the Buyer upon receipt of the full purchase price by the Seller.",
  "The Seller shall execute and deliver all NTSA transfer documents to the Buyer within fourteen (14) days of full payment.",
  "Any deposit paid is non-refundable except where the Seller fails to deliver the vehicle as agreed.",
  "This Agreement is governed by and construed in accordance with the laws of the Republic of Kenya.",
];

/**
 * Build the agreement PDF and return it as a Blob
 */
export const buildSalesAgreementPdf = async (data: SalesAgreementData): Promise<Blob> => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 15; // margin
  const CW = W - M * 2; // content width
  let y = 0;

  const [logoData, stampData] = await Promise.all([toDataUrl(logoUrl), toDataUrl(stampUrl)]);

  // ULTIMATE watermark — diagonal (~40°). Drawn BEFORE any page content
  // so all text/tables render on top of it, while staying clearly visible.
  const drawWatermark = () => {
    doc.setTextColor(226, 226, 226);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(92);
    doc.text("ULTIMATE", W / 2, 170, { align: "center", angle: 40 });
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > 278) {
      doc.addPage();
      drawWatermark(); // watermark under the new page's content
      y = 18;
    }
  };

  const sectionBar = (title: string) => {
    ensureSpace(14);
    doc.setFillColor(...RED);
    doc.rect(M, y, CW, 7.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), M + 3, y + 5.2);
    y += 10.5;
  };

  const pairTable = (rows: [string, string][]) => {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      body: rows,
      styles: { fontSize: 9, cellPadding: 2.2, textColor: DARK, lineColor: [220, 220, 220], lineWidth: 0.2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 52, textColor: GREY } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  };

  const quadTable = (rows: [string, string, string, string][]) => {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      body: rows,
      styles: { fontSize: 9, cellPadding: 2.2, textColor: DARK, lineColor: [220, 220, 220], lineWidth: 0.2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 30, textColor: GREY },
        2: { fontStyle: "bold", cellWidth: 34, textColor: GREY },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  };

  // ============ HEADER ============
  // Draw the watermark first so all page-1 content sits on top of it
  drawWatermark();
  y = 14;
  // Logo (795x295 ratio ≈ 2.69)
  doc.addImage(logoData, "PNG", M, y, 56, 20.8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(`Agreement No: ${v(data.agreement_number)}`, W - M, y + 6, { align: "right" });
  doc.text(`Date: ${fmtDate(data.agreement_date)}`, W - M, y + 11, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Westlands, Nairobi, Kenya", W - M, y + 16, { align: "right" });
  y += 25;

  // Red rule
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.9);
  doc.line(M, y, W - M, y);
  y += 8;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...RED);
  doc.text("MOTOR VEHICLE SALE AGREEMENT", W / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text(
    `This Motor Vehicle Sale Agreement ("the Agreement") is made and entered into on ${fmtDate(data.agreement_date)} by and between the Seller and the Buyer named below.`,
    W / 2,
    y,
    { align: "center", maxWidth: CW }
  );
  y += 10;

  // ============ 1. SELLER ============
  sectionBar("1. Seller Details");
  pairTable([
    ["Full Name", v(data.seller_name)],
    ["ID / Passport No.", v(data.seller_id_no)],
    ["Address", v(data.seller_address)],
    ["Phone", v(data.seller_phone)],
    ["KRA PIN", v(data.seller_kra_pin)],
  ]);

  // ============ 2. BUYER ============
  sectionBar("2. Buyer Details");
  pairTable([
    ["Full Name", v(data.buyer_name)],
    ["ID / Passport No.", v(data.buyer_id_no)],
    ["Address", v(data.buyer_address)],
    ["Phone", v(data.buyer_phone)],
    ["KRA PIN", v(data.buyer_kra_pin)],
  ]);

  // ============ 3. VEHICLE ============
  sectionBar("3. Vehicle Details");
  quadTable([
    ["Make", v(data.vehicle_make), "Model", v(data.vehicle_model)],
    ["Year", v(data.vehicle_year), "Registration", v(data.vehicle_registration)],
    ["VIN / Chassis", v(data.vehicle_vin), "Engine No.", v(data.vehicle_engine_no)],
    ["Body Type", v(data.vehicle_body), "Transmission", v(data.vehicle_transmission)],
    ["Fuel", v(data.vehicle_fuel), "Colour", v(data.vehicle_color)],
    ["Seats", v(data.vehicle_seats), "Condition", v(data.vehicle_condition)],
  ]);

  // ============ 4. SALE TERMS ============
  sectionBar("4. Sale Terms & Payment");
  pairTable([
    ["Purchase Price", fmtMoney(data.purchase_price)],
    ["Deposit Paid", fmtMoney(data.deposit_paid)],
    ["Balance Payable", fmtMoney(data.balance_payable)],
    ["Payment Method", v(data.payment_method)],
    ["Payment Terms", v(data.payment_terms)],
    [
      "Instalments",
      data.instalment_count && data.instalment_amount
        ? `${data.instalment_count} × ${fmtMoney(data.instalment_amount)} per month`
        : "_____________________",
    ],
  ]);

  // ============ 5. CONDITION ============
  sectionBar("5. Vehicle Condition & Disclosure");
  ensureSpace(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Declared condition: ${v(data.vehicle_condition)}. The Buyer acknowledges that the vehicle has been inspected and is sold as viewed and described above.`,
    M,
    y,
    { maxWidth: CW }
  );
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text(data.condition_accepted ? "[X] Condition & disclosure accepted by the Buyer" : "[  ] Condition & disclosure accepted by the Buyer", M, y);
  y += 9;

  // ============ 6. ACCESSORIES ============
  sectionBar("6. Included Accessories");
  const acc = data.accessories ?? [];
  ensureSpace(10 + Math.ceil(acc.length / 2) * 5 + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  if (acc.length === 0 && !data.other_accessories) {
    doc.text("• ____________________", M, y);
    y += 6;
  } else {
    for (let i = 0; i < acc.length; i += 2) {
      const left = `• ${acc[i]}`;
      const right = acc[i + 1] ? `• ${acc[i + 1]}` : "";
      doc.text(left, M, y);
      if (right) doc.text(right, M + CW / 2, y);
      y += 5.5;
    }
  }
  if (data.other_accessories) {
    doc.setFont("helvetica", "bold");
    doc.text(`Other: ${data.other_accessories}`, M, y, { maxWidth: CW });
    y += 6;
  }
  y += 3;

  // ============ 7. DOCUMENTS ============
  sectionBar("7. Documents to be Transferred");
  const docs = data.documents ?? [];
  ensureSpace(10 + Math.ceil(docs.length / 2) * 5 + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  if (docs.length === 0 && !data.other_documents) {
    doc.text("• ____________________", M, y);
    y += 6;
  } else {
    for (let i = 0; i < docs.length; i += 2) {
      const left = `• ${docs[i]}`;
      const right = docs[i + 1] ? `• ${docs[i + 1]}` : "";
      doc.text(left, M, y);
      if (right) doc.text(right, M + CW / 2, y);
      y += 5.5;
    }
  }
  if (data.other_documents) {
    doc.setFont("helvetica", "bold");
    doc.text(`Other: ${data.other_documents}`, M, y, { maxWidth: CW });
    y += 6;
  }
  y += 3;

  // ============ 8. TERMS ============
  sectionBar("8. Additional Terms & Conditions");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  TERMS_CLAUSES.forEach((clause, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${clause}`, CW - 2);
    ensureSpace(lines.length * 4.4 + 2);
    doc.text(lines, M, y);
    y += lines.length * 4.4 + 2;
  });
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(data.terms_accepted ? "[X] Both parties accept the above terms & conditions" : "[  ] Both parties accept the above terms & conditions", M, y);
  y += 10;

  // ============ 9. SIGNATURES ============
  sectionBar("9. Signatures");
  ensureSpace(52);
  const boxW = (CW - 12) / 3;
  const boxH = 38;
  const boxes: { label: string; name?: string | null; sig?: string | null }[] = [
    { label: "SELLER", name: data.seller_name, sig: data.seller_signature },
    { label: "BUYER", name: data.buyer_name, sig: data.buyer_signature },
    { label: "WITNESS", name: data.witness_name, sig: data.witness_signature },
  ];
  boxes.forEach((b, i) => {
    const x = M + i * (boxW + 6);
    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.3);
    doc.rect(x, y, boxW, boxH);
    if (b.sig) {
      try {
        doc.addImage(b.sig, "PNG", x + 3, y + 3, boxW - 6, 14);
      } catch {
        /* ignore bad image */
      }
    } else {
      doc.setDrawColor(150, 150, 150);
      doc.setLineDashPattern([1, 1.4], 0);
      doc.line(x + 5, y + 15, x + boxW - 5, y + 15);
      doc.setLineDashPattern([], 0);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...RED);
    doc.text(b.label, x + boxW / 2, y + 21.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(`Name: ${b.name ? String(b.name) : "________________"}`, x + 3, y + 28, { maxWidth: boxW - 6 });
    doc.text(`Date: ${fmtDate(data.agreement_date)}`, x + 3, y + 34);
  });

  // Official stamp overlapping the signature row (left)
  const stampSize = 46;
  const stampX = M + 2;
  const stampY = y - 14;
  try {
    doc.addImage(stampData, "PNG", stampX, stampY, stampSize, stampSize);
    // Dynamic date centered inside the stamp
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(178, 18, 28);
    const stampDate = data.agreement_date
      ? new Date(data.agreement_date).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");
    doc.text(stampDate, stampX + stampSize / 2, stampY + stampSize / 2 + 2.5, { align: "center" });
  } catch {
    /* stamp optional */
  }
  y += boxH + 8;

  // ============ FOOTER ON EVERY PAGE ============
  // (watermark is drawn beneath the content when each page is created)
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    // Footer
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.5);
    doc.line(M, 285, W - M, 285);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    doc.text(
      "© 2026 Justice Ultimate Automobiles • Westlands, Nairobi • 0722 827 458 / 0751 555 544 • www.justiceultimateautomobiles.com",
      W / 2,
      289.5,
      { align: "center" }
    );
    doc.setFont("helvetica", "bold");
    doc.text(`Page ${p} of ${pages}`, W - M, 289.5, { align: "right" });
    doc.setFont("helvetica", "italic");
    doc.text("Trusted. Reliable. With you every step of the way.", M, 289.5);
  }

  return doc.output("blob");
};

export const downloadSalesAgreementPdf = async (data: SalesAgreementData) => {
  const blob = await buildSalesAgreementPdf(data);
  const name = data.agreement_number
    ? `Sales_Agreement_${data.agreement_number}.pdf`
    : `Sales_Agreement_${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadBlob(blob, name);
};

export const downloadBlankPdfTemplate = async () => {
  const blob = await buildSalesAgreementPdf({ agreement_date: new Date().toISOString().slice(0, 10) });
  downloadBlob(blob, "Sales_Agreement_Blank_Template.pdf");
};

/**
 * Blank Word (.docx) template
 */
export const downloadWordTemplate = async () => {
  const line = (label: string) =>
    new Paragraph({
      children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun("________________________________________")],
      spacing: { after: 160 },
    });

  const heading = (text: string) =>
    new Paragraph({
      text: text.toUpperCase(),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 160 },
    });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: "JUSTICE ULTIMATE AUTOMOBILES", bold: true, size: 36, color: "B2121C" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [new TextRun({ text: "MOTOR VEHICLE SALE AGREEMENT", bold: true, size: 28 })],
          }),
          new Paragraph({ text: `Date: ____ / ____ / ________`, spacing: { after: 240 } }),
          heading("1. Seller Details"),
          line("Full Name"),
          line("ID / Passport No."),
          line("Address"),
          line("Phone"),
          line("KRA PIN"),
          heading("2. Buyer Details"),
          line("Full Name"),
          line("ID / Passport No."),
          line("Address"),
          line("Phone"),
          line("KRA PIN"),
          heading("3. Vehicle Details"),
          line("Make / Model"),
          line("Year / Registration"),
          line("VIN / Chassis No."),
          line("Engine No."),
          line("Body / Transmission / Fuel"),
          line("Colour / Seats / Condition"),
          heading("4. Sale Terms & Payment"),
          line("Purchase Price (KSh)"),
          line("Deposit Paid (KSh)"),
          line("Balance Payable (KSh)"),
          line("Payment Method"),
          line("Payment Terms / Instalments"),
          heading("5. Vehicle Condition & Disclosure"),
          new Paragraph({ text: "[  ] Condition & disclosure accepted by the Buyer", spacing: { after: 200 } }),
          heading("6. Included Accessories"),
          new Paragraph({ text: "____________________________________________________________", spacing: { after: 200 } }),
          heading("7. Documents to be Transferred"),
          new Paragraph({ text: "____________________________________________________________", spacing: { after: 200 } }),
          heading("8. Additional Terms & Conditions"),
          ...TERMS_CLAUSES.map(
            (c, i) => new Paragraph({ text: `${i + 1}. ${c}`, spacing: { after: 120 } })
          ),
          new Paragraph({ text: "[  ] Both parties accept the above terms & conditions", spacing: { before: 160, after: 200 } }),
          heading("9. Signatures"),
          new Paragraph({ text: "SELLER — Name: ____________________  Signature: ____________________  Date: ____________", spacing: { after: 220 } }),
          new Paragraph({ text: "BUYER — Name: ____________________  Signature: ____________________  Date: ____________", spacing: { after: 220 } }),
          new Paragraph({ text: "WITNESS — Name: ____________________  Signature: ____________________  Date: ____________", spacing: { after: 320 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "© 2026 Justice Ultimate Automobiles • Trusted. Reliable. With you every step of the way.",
                italics: true,
                size: 16,
                color: "777777",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, "Sales_Agreement_Template.docx");
};
