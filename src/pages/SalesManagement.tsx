import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Car, FileText, DollarSign, CheckCircle, Clock, Send, Plus, Download, Upload, ShoppingCart, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SalesManagement = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [activeTab, setActiveTab] = useState("cars");
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [soldDialog, setSoldDialog] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: "", customerEmail: "", customerPhone: "", notes: "", vatRate: "16",
  });

  // Sold form
  const [soldForm, setSoldForm] = useState({
    customerName: "", customerEmail: "", customerPhone: "", customerIdNumber: "",
    paymentMethod: "cash", salePrice: "", notes: "",
  });

  useEffect(() => {
    fetchCars();
    fetchReceipts();
    fetchInvoices();
  }, []);

  const fetchCars = async () => {
    const { data } = await supabase.from("cars").select("*").order("created_at", { ascending: false });
    if (data) setCars(data);
  };

  const fetchReceipts = async () => {
    const { data } = await supabase.from("sales_receipts").select("*").order("created_at", { ascending: false });
    if (data) setReceipts(data);
  };

  const fetchInvoices = async () => {
    const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (data) setInvoices(data);
  };

  const handleMarkSold = async () => {
    if (!selectedCar || !soldForm.customerName || !soldForm.salePrice) return;
    setLoading(true);
    try {
      const salePrice = parseFloat(soldForm.salePrice);

      // Update car status
      await supabase.from("cars").update({ status: "sold" }).eq("id", selectedCar.id);

      // Create sales record
      const { data: saleData } = await supabase.from("sales").insert({
        car_id: selectedCar.id,
        sale_price: salePrice,
        sale_date: new Date().toISOString().split("T")[0],
        payment_type: soldForm.paymentMethod,
        notes: `Customer: ${soldForm.customerName}\nPhone: ${soldForm.customerPhone}\nEmail: ${soldForm.customerEmail}\nID: ${soldForm.customerIdNumber}\n\n${soldForm.notes}`,
      }).select().single();

      // Generate receipt number
      const { data: receiptNo } = await supabase.rpc("generate_sales_receipt_number");

      // Create sales receipt (pending HR approval)
      await supabase.from("sales_receipts").insert({
        car_id: selectedCar.id,
        sale_id: saleData?.id,
        receipt_number: receiptNo || `SRC-${Date.now()}`,
        customer_name: soldForm.customerName,
        customer_email: soldForm.customerEmail,
        customer_phone: soldForm.customerPhone,
        customer_id_number: soldForm.customerIdNumber,
        car_make: selectedCar.make,
        car_model: selectedCar.model,
        car_year: selectedCar.year,
        car_stock_id: selectedCar.stock_id,
        amount: salePrice,
        payment_method: soldForm.paymentMethod,
        status: "pending",
        logbook_status: "processing",
        created_by: user?.id,
        notes: soldForm.notes,
      });

      // Send receipt email to customer
      if (soldForm.customerEmail) {
        await supabase.functions.invoke("send-receipt-email", {
          body: {
            customer_email: soldForm.customerEmail,
            customer_name: soldForm.customerName,
            receipt_number: receiptNo,
            amount: salePrice,
            currency: "KES",
            payment_method: soldForm.paymentMethod,
            transaction_date: new Date().toLocaleDateString("en-KE"),
            description: `${selectedCar.make} ${selectedCar.model} ${selectedCar.year} - Vehicle Purchase`,
          },
        });
      }

      toast({ title: "Car Marked as Sold", description: `Receipt ${receiptNo} created and sent to HR for approval` });
      setSoldDialog(false);
      setSelectedCar(null);
      setSoldForm({ customerName: "", customerEmail: "", customerPhone: "", customerIdNumber: "", paymentMethod: "cash", salePrice: "", notes: "" });
      fetchCars();
      fetchReceipts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedCar || !invoiceForm.customerName) return;
    setLoading(true);
    try {
      const vatRate = parseFloat(invoiceForm.vatRate) || 16;
      const subtotal = selectedCar.price;
      const vatAmount = subtotal * (vatRate / 100);
      const grandTotal = subtotal + vatAmount;
      const { data: invoiceNo } = await supabase.rpc("generate_invoice_number");

      const { data: inv } = await supabase.from("invoices").insert({
        invoice_no: invoiceNo || `INV-${Date.now()}`,
        customer_id: user?.id || "",
        customer_name: invoiceForm.customerName,
        customer_email: invoiceForm.customerEmail,
        customer_phone: invoiceForm.customerPhone,
        subtotal, vat_rate: vatRate, vat_amount: vatAmount, grand_total: grandTotal,
        items: [{ description: `${selectedCar.make} ${selectedCar.model} ${selectedCar.year}`, quantity: 1, unit_price: selectedCar.price, total: selectedCar.price }] as any,
        notes: invoiceForm.notes,
        status: "draft",
      }).select().single();

      // Send invoice via email
      if (invoiceForm.customerEmail && inv) {
        await supabase.functions.invoke("send-invoice-notification", {
          body: { invoice_id: inv.id, send_email: true },
        });
      }

      toast({ title: "Invoice Created", description: `Invoice ${invoiceNo} created and sent to ${invoiceForm.customerEmail || "customer"}` });
      setInvoiceDialog(false);
      setSelectedCar(null);
      setInvoiceForm({ customerName: "", customerEmail: "", customerPhone: "", notes: "", vatRate: "16" });
      fetchInvoices();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOnSale = async (carId: string) => {
    await supabase.from("cars").update({ status: "available", promotion_tag: "Hot Deal" }).eq("id", carId);
    toast({ title: "Car marked as On Sale" });
    fetchCars();
  };

  const filteredCars = cars.filter((c) => {
    const q = searchQuery.toLowerCase();
    return `${c.make} ${c.model} ${c.year} ${c.stock_id || ""}`.toLowerCase().includes(q) ||
      (c.status || "").toLowerCase().includes(q);
  });

  const filteredReceipts = receipts.filter((r) => {
    const q = receiptSearch.toLowerCase();
    return (r.customer_name || "").toLowerCase().includes(q) ||
      (r.receipt_number || "").toLowerCase().includes(q) ||
      (r.car_make || "").toLowerCase().includes(q) ||
      (r.car_model || "").toLowerCase().includes(q);
  });

  const formatDate = (d: string) => new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold">Sales & Management</h1>
              <p className="text-muted-foreground">Manage car sales, invoices, and receipts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/sales-prospects")} className="gap-2">
              <Users className="w-4 h-4" /> Prospects
            </Button>
            <Button onClick={() => navigate("/admin/sales-orders")} className="gap-2">
              <ShoppingCart className="w-4 h-4" /> Customer Orders
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Available Cars</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{cars.filter(c => c.status === "available").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sold Cars</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{cars.filter(c => c.status === "sold").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending Receipts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{receipts.filter(r => r.status === "pending").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Invoices</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{invoices.length}</div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cars"><Car className="mr-2 h-4 w-4" />Car Inventory</TabsTrigger>
            <TabsTrigger value="receipts"><FileText className="mr-2 h-4 w-4" />Sales Receipts</TabsTrigger>
            <TabsTrigger value="invoices"><DollarSign className="mr-2 h-4 w-4" />Invoices</TabsTrigger>
          </TabsList>

          {/* Cars Tab */}
          <TabsContent value="cars">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle>Car Inventory ({filteredCars.length})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search cars..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stock ID</TableHead>
                        <TableHead>Car</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Price (KES)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCars.map((car) => (
                        <TableRow key={car.id}>
                          <TableCell className="font-mono text-sm">{car.stock_id || "—"}</TableCell>
                          <TableCell className="font-medium">{car.make} {car.model}</TableCell>
                          <TableCell>{car.year}</TableCell>
                          <TableCell>KES {car.price?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={car.status === "available" ? "default" : car.status === "sold" ? "destructive" : "secondary"}>
                              {car.status || "available"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              {car.status !== "sold" && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleMarkOnSale(car.id)}>On Sale</Button>
                                  <Button size="sm" variant="destructive" onClick={() => { setSelectedCar(car); setSoldForm({ ...soldForm, salePrice: car.price?.toString() || "" }); setSoldDialog(true); }}>
                                    Mark Sold
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="outline" onClick={() => { setSelectedCar(car); setInvoiceDialog(true); }}>
                                <FileText className="h-3 w-3 mr-1" />Invoice
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle>Sales Receipts</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search receipts..." className="pl-9" value={receiptSearch} onChange={(e) => setReceiptSearch(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Car</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Logbook</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceipts.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-sm">{r.receipt_number}</TableCell>
                          <TableCell className="font-medium">{r.customer_name}</TableCell>
                          <TableCell>{r.car_make} {r.car_model} {r.car_year}</TableCell>
                          <TableCell>KES {r.amount?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={r.logbook_status === "processed" ? "default" : "outline"}>
                              {r.logbook_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(r.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {r.status === "approved" && r.logbook_status !== "processed" && (
                                <Button size="sm" variant="outline" onClick={async () => {
                                  await supabase.from("sales_receipts").update({ logbook_status: "processed" }).eq("id", r.id);
                                  toast({ title: "Logbook Processed" });
                                  fetchReceipts();
                                }}>
                                  <CheckCircle className="h-3 w-3 mr-1" />Logbook Done
                                </Button>
                              )}
                              {r.customer_email && (
                                <Button size="sm" variant="outline" onClick={async () => {
                                  await supabase.functions.invoke("send-receipt-email", {
                                    body: {
                                      customer_email: r.customer_email,
                                      customer_name: r.customer_name,
                                      receipt_number: r.receipt_number,
                                      amount: r.amount,
                                      currency: "KES",
                                      payment_method: r.payment_method,
                                      transaction_date: new Date(r.created_at).toLocaleDateString("en-KE"),
                                      description: `${r.car_make} ${r.car_model} ${r.car_year}`,
                                    },
                                  });
                                  toast({ title: "Receipt emailed to customer" });
                                }}>
                                  <Send className="h-3 w-3 mr-1" />Email
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredReceipts.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No receipts found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader><CardTitle>Invoices ({invoices.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm">{inv.invoice_no}</TableCell>
                          <TableCell className="font-medium">{inv.customer_name}</TableCell>
                          <TableCell>KES {inv.grand_total?.toLocaleString()}</TableCell>
                          <TableCell><Badge variant={inv.status === "paid" ? "default" : "secondary"}>{inv.status}</Badge></TableCell>
                          <TableCell className="text-sm">{formatDate(inv.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {inv.customer_email && (
                                <Button size="sm" variant="outline" onClick={async () => {
                                  await supabase.functions.invoke("send-invoice-notification", { body: { invoice_id: inv.id, send_email: true } });
                                  toast({ title: "Invoice emailed" });
                                }}>
                                  <Send className="h-3 w-3 mr-1" />Send
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {invoices.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sold Dialog */}
        <Dialog open={soldDialog} onOpenChange={setSoldDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Mark as Sold — {selectedCar?.make} {selectedCar?.model} {selectedCar?.year}</DialogTitle>
              <DialogDescription>Enter buyer details. A receipt will be generated and sent to HR for approval.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div><Label>Sale Price (KES)</Label><Input type="number" value={soldForm.salePrice} onChange={e => setSoldForm({ ...soldForm, salePrice: e.target.value })} /></div>
              <div><Label>Customer Name *</Label><Input value={soldForm.customerName} onChange={e => setSoldForm({ ...soldForm, customerName: e.target.value })} /></div>
              <div><Label>Customer Email</Label><Input type="email" value={soldForm.customerEmail} onChange={e => setSoldForm({ ...soldForm, customerEmail: e.target.value })} /></div>
              <div><Label>Customer Phone</Label><Input type="tel" value={soldForm.customerPhone} onChange={e => setSoldForm({ ...soldForm, customerPhone: e.target.value })} /></div>
              <div><Label>Customer ID Number</Label><Input value={soldForm.customerIdNumber} onChange={e => setSoldForm({ ...soldForm, customerIdNumber: e.target.value })} /></div>
              <div>
                <Label>Payment Method</Label>
                <Select value={soldForm.paymentMethod} onValueChange={v => setSoldForm({ ...soldForm, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="financing">Financing</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={soldForm.notes} onChange={e => setSoldForm({ ...soldForm, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSoldDialog(false)}>Cancel</Button>
              <Button onClick={handleMarkSold} disabled={loading || !soldForm.customerName || !soldForm.salePrice}>
                {loading ? "Processing..." : "Mark as Sold & Generate Receipt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice Dialog */}
        <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Invoice — {selectedCar?.make} {selectedCar?.model} {selectedCar?.year}</DialogTitle>
              <DialogDescription>Price: KES {selectedCar?.price?.toLocaleString()}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Customer Name *</Label><Input value={invoiceForm.customerName} onChange={e => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })} /></div>
              <div><Label>Customer Email (invoice will be sent here)</Label><Input type="email" value={invoiceForm.customerEmail} onChange={e => setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })} /></div>
              <div><Label>Customer Phone</Label><Input type="tel" value={invoiceForm.customerPhone} onChange={e => setInvoiceForm({ ...invoiceForm, customerPhone: e.target.value })} /></div>
              <div><Label>VAT Rate (%)</Label><Input type="number" value={invoiceForm.vatRate} onChange={e => setInvoiceForm({ ...invoiceForm, vatRate: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={invoiceForm.notes} onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} /></div>
              {selectedCar && (
                <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                  <p>Subtotal: KES {selectedCar.price?.toLocaleString()}</p>
                  <p>VAT ({invoiceForm.vatRate}%): KES {(selectedCar.price * (parseFloat(invoiceForm.vatRate) || 0) / 100).toLocaleString()}</p>
                  <p className="font-bold">Total: KES {(selectedCar.price * (1 + (parseFloat(invoiceForm.vatRate) || 0) / 100)).toLocaleString()}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoiceDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateInvoice} disabled={loading || !invoiceForm.customerName}>
                {loading ? "Creating..." : "Create & Send Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalesManagement;
