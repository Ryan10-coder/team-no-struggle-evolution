import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileSpreadsheet, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

// Interfaces matching your existing code
interface Contribution {
  id: string;
  member_id: string;
  member_name?: string;
  amount: number;
  contribution_date: string;
}

interface Disbursement {
  id: string;
  beneficiary: string;
  amount: number;
  disbursement_date: string;
  reason: string;
  status?: string;
}

interface MonthlyExpense {
  id: string;
  expense_category: string;
  amount: number;
  expense_date: string;
  description: string;
  month_year: string;
}

const AdminPortal = () => {
  const { user } = useAuth();
  const { staffUser, logout: staffLogout } = useStaffAuth();
  const navigate = useNavigate();

  // Existing states (shortened for clarity)
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);

  // New Treasurer states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [beneficiary, setBeneficiary] = useState<string>("");
  const [disbAmount, setDisbAmount] = useState<string>("");
  const [disbReason, setDisbReason] = useState<string>("");
  const [disbDate, setDisbDate] = useState<string>("");

  const [expCategory, setExpCategory] = useState<string>("");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expDesc, setExpDesc] = useState<string>("");
  const [expDate, setExpDate] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");

  // Filtered contributions
  const filteredContributions = startDate && endDate
    ? contributions.filter(c => c.contribution_date >= startDate && c.contribution_date <= endDate)
    : contributions;

  // Export contributions
  const exportPaymentsPDF = () => {
    const doc = new jsPDF();
    doc.text("Payments Report", 10, 10);
    filteredContributions.forEach((c, i) => {
      doc.text(`${c.member_id} - ${c.amount} - ${c.contribution_date}`, 10, 20 + i * 10);
    });
    doc.save("payments_report.pdf");
  };

  const exportPaymentsExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredContributions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "payments_report.xlsx");
  };

  // Submit disbursement
  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("disbursements").insert([
      { beneficiary, amount: disbAmount, reason: disbReason, disbursement_date: disbDate, status: "completed" },
    ]);
    if (!error) {
      toast.success("Disbursement recorded");
      setBeneficiary("");
      setDisbAmount("");
      setDisbReason("");
      setDisbDate("");
    }
  };

  // Submit expenditure
  const handleExpenditureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("monthly_expenses").insert([
      { expense_category: expCategory, amount: expAmount, description: expDesc, expense_date: expDate, month_year: expDate.substring(0,7) },
    ]);
    if (!error) {
      toast.success("Expenditure recorded");
      setExpCategory("");
      setExpAmount("");
      setExpDesc("");
      setExpDate("");
    }
  };

  const filteredExpenditures = monthFilter
    ? monthlyExpenses.filter(e => e.expense_date.startsWith(monthFilter))
    : monthlyExpenses;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="treasurer" className="w-full">
          <TabsList>
            <TabsTrigger value="treasurer">Treasurer</TabsTrigger>
            {/* keep your other tabs */}
          </TabsList>

          <TabsContent value="treasurer">
            <div className="grid gap-6">
              {/* === Existing Treasurer content remains here === */}

              {/* === Appended Treasurer Features === */}
              <Card>
                <CardHeader>
                  <CardTitle>Payments Filter & Export</CardTitle>
                  <CardDescription>Filter contributions by date and export</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <Button onClick={exportPaymentsPDF}><FileText className="h-4 w-4 mr-2" />PDF</Button>
                    <Button onClick={exportPaymentsExcel}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
                  </div>
                  <p>Total Members Contributed: {new Set(filteredContributions.map(c => c.member_id)).size}</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContributions.map(c => (
                        <TableRow key={c.id}>
                          <TableCell>{c.member_id}</TableCell>
                          <TableCell>{c.amount}</TableCell>
                          <TableCell>{c.contribution_date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Disbursement</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDisbursementSubmit} className="space-y-2">
                    <Input placeholder="Beneficiary" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} required />
                    <Input type="number" placeholder="Amount" value={disbAmount} onChange={(e) => setDisbAmount(e.target.value)} required />
                    <Input type="date" value={disbDate} onChange={(e) => setDisbDate(e.target.value)} required />
                    <Input placeholder="Reason" value={disbReason} onChange={(e) => setDisbReason(e.target.value)} required />
                    <Button type="submit">Submit Disbursement</Button>
                  </form>
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disbursements.map(d => (
                        <TableRow key={d.id}>
                          <TableCell>{d.beneficiary}</TableCell>
                          <TableCell>{d.amount}</TableCell>
                          <TableCell>{d.disbursement_date}</TableCell>
                          <TableCell>{d.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Expenditure</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleExpenditureSubmit} className="space-y-2">
                    <Input placeholder="Category" value={expCategory} onChange={(e) => setExpCategory(e.target.value)} required />
                    <Input type="number" placeholder="Amount" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required />
                    <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
                    <Input placeholder="Description" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required />
                    <Button type="submit">Submit Expenditure</Button>
                  </form>

                  <div className="mt-4">
                    <Label>Filter by Month</Label>
                    <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
                  </div>

                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenditures.map(e => (
                        <TableRow key={e.id}>
                          <TableCell>{e.expense_category}</TableCell>
                          <TableCell>{e.amount}</TableCell>
                          <TableCell>{e.expense_date}</TableCell>
                          <TableCell>{e.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {/* === End Appended Treasurer Features === */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPortal;
