import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, Upload, FileText, CheckCircle, AlertCircle, UserMinus } from "lucide-react";
import { jsPDF } from "jspdf";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  tns_number?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface DisbursementRecord {
  id: string;
  member_id: string;
  amount: number;
  reason: string;
  disbursement_date: string;
  status: string;
  bereavement_form_url?: string;
  created_at: string;
}

export const EnhancedDisbursementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [disbursementType, setDisbursementType] = useState("bereavement");
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDisbursementId, setSelectedDisbursementId] = useState<string | null>(null);

  // Bereavement form fields
  const [deceasedName, setDeceasedName] = useState("");
  const [relationshipToMember, setRelationshipToMember] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [placeOfDeath, setPlaceOfDeath] = useState("");
  const [causeOfDeath, setCauseOfDeath] = useState("");
  const [funeralDate, setFuneralDate] = useState("");
  const [funeralVenue, setFuneralVenue] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  useEffect(() => {
    fetchMembers();
    fetchDisbursements();
  }, []);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("membership_registrations")
        .select("id, first_name, last_name, tns_number, phone, email, address")
        .eq("registration_status", "approved")
        .order("first_name", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchDisbursements = async () => {
    try {
      const { data, error } = await supabase
        .from("disbursements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setDisbursements(data || []);
    } catch (error) {
      console.error("Error fetching disbursements:", error);
    }
  };

  const generateBereavementPDF = () => {
    const selectedMemberData = members.find(m => m.id === selectedMember);
    if (!selectedMemberData) {
      toast.error("Please select a member first");
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("TEAM NO STRUGGLE EVOLUTION", pageWidth / 2, 30, { align: "center" });
    
    pdf.setFontSize(16);
    pdf.text("BEREAVEMENT DISBURSEMENT FORM", pageWidth / 2, 45, { align: "center" });
    
    // Draw a line
    pdf.setLineWidth(0.5);
    pdf.line(20, 55, pageWidth - 20, 55);
    
    // Form content
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    
    let yPosition = 75;
    const lineHeight = 8;
    
    // Member Information
    pdf.setFont("helvetica", "bold");
    pdf.text("MEMBER INFORMATION:", 20, yPosition);
    yPosition += lineHeight + 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.text(`Member Name: ${selectedMemberData.first_name} ${selectedMemberData.last_name}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`TNS Number: ${selectedMemberData.tns_number || 'N/A'}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Phone: ${selectedMemberData.phone || 'N/A'}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Email: ${selectedMemberData.email || 'N/A'}`, 20, yPosition);
    yPosition += lineHeight + 10;
    
    // Bereavement Details
    pdf.setFont("helvetica", "bold");
    pdf.text("BEREAVEMENT DETAILS:", 20, yPosition);
    yPosition += lineHeight + 5;
    
    pdf.setFont("helvetica", "normal");
    const formFields = [
      "Name of Deceased: _________________________________________________",
      "",
      "Relationship to Member: ___________________________________________",
      "",
      "Date of Death: ___________________________________________________",
      "",
      "Place of Death: __________________________________________________",
      "",
      "Cause of Death: __________________________________________________",
      "",
      "Funeral Date: ____________________________________________________",
      "",
      "Funeral Venue: ___________________________________________________",
      "",
      "Next of Kin Name: ________________________________________________",
      "",
      "Next of Kin Phone: _______________________________________________",
      ""
    ];
    
    formFields.forEach(field => {
      pdf.text(field, 20, yPosition);
      yPosition += lineHeight;
    });
    
    yPosition += 10;
    
    // Additional Information
    pdf.setFont("helvetica", "bold");
    pdf.text("ADDITIONAL INFORMATION:", 20, yPosition);
    yPosition += lineHeight + 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.text("Any additional details or special circumstances:", 20, yPosition);
    yPosition += lineHeight;
    
    // Draw lines for writing space
    for (let i = 0; i < 4; i++) {
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += lineHeight;
    }
    
    yPosition += 15;
    
    // Signature Section
    pdf.setFont("helvetica", "bold");
    pdf.text("DECLARATIONS:", 20, yPosition);
    yPosition += lineHeight + 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.text("Member Signature: _________________________ Date: _______________", 20, yPosition);
    yPosition += lineHeight + 10;
    pdf.text("Witness Signature: ________________________ Date: _______________", 20, yPosition);
    yPosition += lineHeight + 10;
    pdf.text("Treasurer Signature: ______________________ Date: _______________", 20, yPosition);
    
    // Footer
    yPosition += 20;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.text("This form must be completed and returned with supporting documents before disbursement.", pageWidth / 2, yPosition, { align: "center" });
    pdf.text(`Form generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition + 8, { align: "center" });
    
    // Save the PDF
    const fileName = `Bereavement_Form_${selectedMemberData.first_name}_${selectedMemberData.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    toast.success("Bereavement form downloaded successfully!");
  };

  const handleFileUpload = async (disbursementId: string) => {
    if (!uploadedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      const fileName = `disbursement_${disbursementId}_${Date.now()}_${uploadedFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('disbursement-documents')
        .upload(fileName, uploadedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('disbursement-documents')
        .getPublicUrl(fileName);

      // Update disbursement record with document URL
      const { error: updateError } = await supabase
        .from('disbursements')
        .update({ bereavement_form_url: publicUrl } as any)
        .eq('id', disbursementId);

      if (updateError) throw updateError;

      toast.success("Document uploaded successfully!");
      setIsUploadModalOpen(false);
      setUploadedFile(null);
      fetchDisbursements();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !amount || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      // Record the disbursement
      const { data: disbursementData, error: disbursementError } = await supabase
        .from("disbursements")
        .insert({
          member_id: selectedMember,
          amount: numAmount,
          disbursement_date: disbursementDate,
          reason: reason,
          status: "approved"
        })
        .select()
        .single();

      if (disbursementError) throw disbursementError;

      // Update member balance
      const { data: currentBalance } = await supabase
        .from("member_balances")
        .select("current_balance, total_disbursements")
        .eq("member_id", selectedMember)
        .single();

      if (currentBalance) {
        await supabase
          .from("member_balances")
          .update({
            current_balance: Number(currentBalance.current_balance) - numAmount,
            total_disbursements: Number(currentBalance.total_disbursements) + numAmount,
            last_updated: new Date().toISOString()
          })
          .eq("member_id", selectedMember);
      }

      toast.success("Disbursement recorded successfully!");
      
      // Reset form
      setSelectedMember("");
      setAmount("");
      setReason("");
      setDisbursementDate(new Date().toISOString().split('T')[0]);
      
      fetchDisbursements();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error recording disbursement:", error);
      toast.error("Failed to record disbursement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="new-disbursement" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-disbursement">New Disbursement</TabsTrigger>
          <TabsTrigger value="manage-documents">Manage Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-disbursement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserMinus className="h-5 w-5" />
                Record Disbursement
              </CardTitle>
              <CardDescription>
                Record a disbursement payment to a member and generate bereavement forms if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member">Select Member *</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingMembers ? "Loading members..." : "Select a member"} />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name} {member.tns_number ? `(${member.tns_number})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disbursementType">Disbursement Type *</Label>
                    <Select value={disbursementType} onValueChange={setDisbursementType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bereavement">Bereavement</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (KES) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disbursementDate">Disbursement Date *</Label>
                    <Input
                      id="disbursementDate"
                      type="date"
                      value={disbursementDate}
                      onChange={(e) => setDisbursementDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason/Description *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for disbursement"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Record Disbursement
                      </>
                    )}
                  </Button>

                  {disbursementType === "bereavement" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateBereavementPDF}
                      disabled={!selectedMember}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Bereavement Form
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Disbursement Document Management
              </CardTitle>
              <CardDescription>
                Upload completed bereavement forms and manage disbursement documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {disbursements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No disbursements found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disbursements.map((disbursement) => {
                      const member = members.find(m => m.id === disbursement.member_id);
                      return (
                        <div key={disbursement.id} className="border rounded-lg p-4 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {member ? `${member.first_name} ${member.last_name}` : 'Unknown Member'}
                                </span>
                                <Badge variant="outline">
                                  KES {disbursement.amount.toLocaleString()}
                                </Badge>
                                <Badge variant={disbursement.status === 'approved' ? 'default' : 'secondary'}>
                                  {disbursement.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {disbursement.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Date: {new Date(disbursement.disbursement_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {disbursement.bereavement_form_url ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-green-600">Document uploaded</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(disbursement.bereavement_form_url, '_blank')}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm text-orange-600">No document</span>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDisbursementId(disbursement.id);
                                      setIsUploadModalOpen(true);
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bereavement Form</DialogTitle>
            <DialogDescription>
              Upload the completed bereavement form for this disbursement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document">Select Document *</Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedDisbursementId && handleFileUpload(selectedDisbursementId)}
              disabled={!uploadedFile}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
