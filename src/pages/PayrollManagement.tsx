import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const PayrollManagement = () => {
  const [payroll, setPayroll] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchPayroll();
      fetchStaff();
    }
  }, [user, role, selectedMonth, selectedYear]);

  const fetchPayroll = async () => {
    const { data, error } = await supabase
      .from("payroll")
      .select("*, staff(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPayroll(data);
    }
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("*");
    if (data) setStaff(data);
  };

  const generatePayslip = async (payrollItem: any) => {
    const doc = new jsPDF();
    const companyName = "Justice Ultimate Automobiles";
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text(companyName, 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.text("PAYSLIP", 105, 30, { align: "center" });
    
    // Employee Details
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employee: ${payrollItem.staff.full_name}`, 20, 50);
    doc.text(`Staff ID: ${payrollItem.staff.staff_id}`, 20, 58);
    doc.text(`Position: ${payrollItem.staff.position}`, 20, 66);
    doc.text(`Department: ${payrollItem.staff.department}`, 20, 74);
    
    // Pay Period
    doc.text(`Pay Period: ${new Date(payrollItem.pay_period_start).toLocaleDateString()} - ${new Date(payrollItem.pay_period_end).toLocaleDateString()}`, 20, 90);
    doc.text(`Payment Date: ${payrollItem.payment_date ? new Date(payrollItem.payment_date).toLocaleDateString() : 'Pending'}`, 20, 98);
    
    // Salary Breakdown
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Salary Breakdown", 20, 115);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(`Basic Salary:`, 20, 125);
    doc.text(`KES ${parseFloat(payrollItem.basic_salary).toLocaleString()}`, 150, 125);
    
    doc.text(`Allowances:`, 20, 133);
    doc.text(`KES ${parseFloat(payrollItem.allowances || 0).toLocaleString()}`, 150, 133);
    
    doc.text(`Overtime Pay:`, 20, 141);
    doc.text(`KES ${parseFloat(payrollItem.overtime_pay || 0).toLocaleString()}`, 150, 141);
    
    doc.text(`Deductions:`, 20, 149);
    doc.text(`KES ${parseFloat(payrollItem.deductions || 0).toLocaleString()}`, 150, 149);
    
    // Net Pay
    doc.setDrawColor(0, 51, 102);
    doc.line(20, 155, 190, 155);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.text(`NET PAY:`, 20, 165);
    doc.text(`KES ${parseFloat(payrollItem.net_pay).toLocaleString()}`, 150, 165);
    
    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text("This is a computer-generated payslip. No signature required.", 105, 280, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 285, { align: "center" });
    
    doc.save(`payslip_${payrollItem.staff.staff_id}_${new Date().getTime()}.pdf`);
    
    toast({
      title: "Payslip Generated",
      description: "The payslip has been downloaded successfully.",
    });
  };

  const generatePayroll = async (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return;

    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);

    const { data, error } = await supabase.from("payroll").insert({
      staff_id: staffId,
      pay_period_start: startDate.toISOString().split('T')[0],
      pay_period_end: endDate.toISOString().split('T')[0],
      basic_salary: staffMember.salary,
      allowances: 0,
      overtime_pay: 0,
      deductions: 0,
      net_pay: staffMember.salary,
      payment_status: "pending",
    }).select();

    if (!error) {
      toast({
        title: "Payroll Generated",
        description: "Payroll record created successfully.",
      });
      fetchPayroll();
    } else {
      toast({
        title: "Error",
        description: "Failed to generate payroll.",
        variant: "destructive",
      });
    }
  };

  const handleSendAllReceipts = async () => {
    toast({ title: "Sending Receipts", description: "Generating and emailing salary receipts to all staff..." });
    try {
      const { data, error } = await supabase.functions.invoke("send-monthly-salary-receipts", { body: {} });
      if (error) throw error;
      toast({ title: "Receipts Sent", description: `${data?.sent || 0} salary receipts sent successfully.` });
      fetchPayroll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSendSingleReceipt = async (staffId: string) => {
    toast({ title: "Sending Receipt", description: "Generating salary receipt..." });
    try {
      const { data, error } = await supabase.functions.invoke("generate-salary-receipt", {
        body: { staff_id: staffId, send_email: true },
      });
      if (error) throw error;
      toast({ title: "Receipt Sent", description: `Receipt ${data?.receipt_number} sent successfully.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/hr")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Payroll Management</h1>
              <p className="text-muted-foreground">Generate and manage staff payroll</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSendAllReceipts} variant="outline">
              <Download className="h-4 w-4 mr-2" />Send All Salary Receipts
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, idx) => (
                <SelectItem key={idx} value={idx.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.staff.full_name}</TableCell>
                    <TableCell>
                      {new Date(item.pay_period_start).toLocaleDateString()} - {new Date(item.pay_period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell>KES {parseFloat(item.basic_salary).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">KES {parseFloat(item.net_pay).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={item.payment_status === "paid" ? "default" : "secondary"}>
                        {item.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => generatePayslip(item)}>
                          <Download className="mr-1 h-3 w-3" />PDF
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSendSingleReceipt(item.staff_id)}>
                          📧 Email Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Generate New Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staff.map((member) => (
                <div key={member.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">{member.position} - KES {parseFloat(member.salary).toLocaleString()}</p>
                  </div>
                  <Button onClick={() => generatePayroll(member.id)}>
                    Generate Payroll
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayrollManagement;
