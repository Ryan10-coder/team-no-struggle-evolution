import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, ChevronLeft, ChevronRight, Upload, Users, Heart, User, Baby, UserCheck, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MemberInfo {
  name: string;
  email: string;
  idNumber: string;
  phone: string;
  altPhone: string;
  sex: string;
  maritalStatus: string;
  areaOfResidence: string;
  photo: File | null;
}

interface SpouseInfo {
  name: string;
  idNumber: string;
  phone: string;
  altPhone: string;
  sex: string;
  areaOfResidence: string;
  photo: File | null;
}

interface ChildInfo {
  name: string;
  dob: string;
  age: string;
  birthCertificate: File | null;
}

interface ParentInfo {
  name: string;
  idNumber: string;
  phone: string;
  altPhone: string;
  areaOfResidence: string;
}

interface ParentsInfo {
  member: ParentInfo;
  spouse: ParentInfo;
}

const MultiStepRegistration = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [memberInfo, setMemberInfo] = useState<MemberInfo>({
    name: '',
    email: '',
    idNumber: '',
    phone: '',
    altPhone: '',
    sex: '',
    maritalStatus: '',
    areaOfResidence: '',
    photo: null,
  });

  const [spouseInfo, setSpouseInfo] = useState<SpouseInfo>({
    name: '',
    idNumber: '',
    phone: '',
    altPhone: '',
    sex: '',
    areaOfResidence: '',
    photo: null,
  });

  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [parentsInfo, setParentsInfo] = useState<ParentsInfo>({
    member: { name: '', idNumber: '', phone: '', altPhone: '', areaOfResidence: '' },
    spouse: { name: '', idNumber: '', phone: '', altPhone: '', areaOfResidence: '' },
  });

  const [transactionId, setTransactionId] = useState('');

  const totalSteps = 5;

  const addChild = () => {
    if (children.length < 6) {
      setChildren([...children, { name: '', dob: '', age: '', birthCertificate: null }]);
    }
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: keyof ChildInfo, value: string | File | null) => {
    const updatedChildren = [...children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setChildren(updatedChildren);
  };

  const handleFileUpload = (file: File | null, type: 'member' | 'spouse' | 'child', index?: number) => {
    if (type === 'member') {
      setMemberInfo({ ...memberInfo, photo: file });
    } else if (type === 'spouse') {
      setSpouseInfo({ ...spouseInfo, photo: file });
    } else if (type === 'child' && index !== undefined) {
      updateChild(index, 'birthCertificate', file);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Extract city and state from area of residence
      const areaOfResidence = memberInfo.areaOfResidence;
      const areaParts = areaOfResidence.split(',').map(part => part.trim());
      const city = areaParts[0] || areaOfResidence;
      const state = areaParts[1] || '';

      // Determine membership type based on marital status
      const membershipType = memberInfo.maritalStatus === 'Married' ? 'family' : 
                            memberInfo.maritalStatus === 'Single' ? 'basic' : 'basic';

      // Parse member name (assume format "First Last")
      const nameParts = memberInfo.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Upload profile picture if provided
      let profilePictureUrl = null;
      if (memberInfo.photo) {
        const fileName = `${Date.now()}-${memberInfo.photo.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('member-profiles')
          .upload(fileName, memberInfo.photo);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('member-profiles')
            .getPublicUrl(fileName);
          profilePictureUrl = publicUrl;
        }
      }

      const { data, error } = await supabase
        .from('membership_registrations')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: memberInfo.email,
          phone: memberInfo.phone,
          address: areaOfResidence,
          city: city,
          state: state,
          zip_code: '00000', // Default zip code
          emergency_contact_name: parentsInfo.member.name || 'Not provided',
          emergency_contact_phone: parentsInfo.member.phone || memberInfo.altPhone || memberInfo.phone,
          membership_type: membershipType,
          id_number: memberInfo.idNumber,
          alternative_phone: memberInfo.altPhone,
          sex: memberInfo.sex,
          marital_status: memberInfo.maritalStatus,
          registration_status: 'pending',
          payment_status: 'pending',
          profile_picture_url: profilePictureUrl
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Registration Submitted!",
        description: "Your member registration has been submitted successfully. Our team will review and contact you within 24 hours.",
      });

      // Reset form
      setCurrentStep(1);
      setMemberInfo({
        name: '',
        email: '',
        idNumber: '',
        phone: '',
        altPhone: '',
        sex: '',
        maritalStatus: '',
        areaOfResidence: '',
        photo: null,
      });
      setSpouseInfo({
        name: '',
        idNumber: '',
        phone: '',
        altPhone: '',
        sex: '',
        areaOfResidence: '',
        photo: null,
      });
      setChildren([]);
      setParentsInfo({
        member: { name: '', idNumber: '', phone: '', altPhone: '', areaOfResidence: '' },
        spouse: { name: '', idNumber: '', phone: '', altPhone: '', areaOfResidence: '' },
      });
      setTransactionId('');
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: "Error",
        description: "Failed to submit registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-primary rounded-full">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Member Information</h3>
              <p className="text-muted-foreground">Please provide your personal details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">Full Name *</Label>
                <Input
                  id="memberName"
                  value={memberInfo.name}
                  onChange={(e) => setMemberInfo({ ...memberInfo, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberEmail">Email Address *</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={memberInfo.email}
                  onChange={(e) => setMemberInfo({ ...memberInfo, email: e.target.value })}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberIdNumber">ID Number *</Label>
                <Input
                  id="memberIdNumber"
                  value={memberInfo.idNumber}
                  onChange={(e) => setMemberInfo({ ...memberInfo, idNumber: e.target.value })}
                  placeholder="Enter your ID number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberPhone">Phone Number *</Label>
                <Input
                  id="memberPhone"
                  value={memberInfo.phone}
                  onChange={(e) => setMemberInfo({ ...memberInfo, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberAltPhone">Alternative Phone</Label>
                <Input
                  id="memberAltPhone"
                  value={memberInfo.altPhone}
                  onChange={(e) => setMemberInfo({ ...memberInfo, altPhone: e.target.value })}
                  placeholder="Alternative phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberSex">Sex *</Label>
                <Select onValueChange={(value) => setMemberInfo({ ...memberInfo, sex: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberMaritalStatus">Marital Status *</Label>
                <Select onValueChange={(value) => setMemberInfo({ ...memberInfo, maritalStatus: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="memberArea">Area of Residence *</Label>
              <Input
                id="memberArea"
                value={memberInfo.areaOfResidence}
                onChange={(e) => setMemberInfo({ ...memberInfo, areaOfResidence: e.target.value })}
                placeholder="Enter your area of residence"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberPhoto">Upload Photo *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="memberPhoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'member')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('memberPhoto')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {memberInfo.photo ? memberInfo.photo.name : 'Choose Photo'}
                </Button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-primary rounded-full">
                  <Heart className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Spouse Information</h3>
              <p className="text-muted-foreground">Please provide your spouse's details (if married)</p>
            </div>

            {memberInfo.maritalStatus === 'Married' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spouseName">Spouse Full Name *</Label>
                    <Input
                      id="spouseName"
                      value={spouseInfo.name}
                      onChange={(e) => setSpouseInfo({ ...spouseInfo, name: e.target.value })}
                      placeholder="Enter spouse's full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseIdNumber">Spouse ID Number *</Label>
                    <Input
                      id="spouseIdNumber"
                      value={spouseInfo.idNumber}
                      onChange={(e) => setSpouseInfo({ ...spouseInfo, idNumber: e.target.value })}
                      placeholder="Enter spouse's ID number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spousePhone">Spouse Phone Number *</Label>
                    <Input
                      id="spousePhone"
                      value={spouseInfo.phone}
                      onChange={(e) => setSpouseInfo({ ...spouseInfo, phone: e.target.value })}
                      placeholder="Enter spouse's phone number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseAltPhone">Spouse Alternative Phone</Label>
                    <Input
                      id="spouseAltPhone"
                      value={spouseInfo.altPhone}
                      onChange={(e) => setSpouseInfo({ ...spouseInfo, altPhone: e.target.value })}
                      placeholder="Alternative phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseSex">Spouse Sex *</Label>
                    <Select onValueChange={(value) => setSpouseInfo({ ...spouseInfo, sex: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseArea">Spouse Area of Residence *</Label>
                    <Input
                      id="spouseArea"
                      value={spouseInfo.areaOfResidence}
                      onChange={(e) => setSpouseInfo({ ...spouseInfo, areaOfResidence: e.target.value })}
                      placeholder="Enter spouse's area of residence"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spousePhoto">Upload Spouse Photo *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="spousePhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'spouse')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('spousePhoto')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {spouseInfo.photo ? spouseInfo.photo.name : 'Choose Spouse Photo'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  This section is only required if you are married. You can proceed to the next step.
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-primary rounded-full">
                  <Baby className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Children Information</h3>
              <p className="text-muted-foreground">Add up to 6 children (if applicable)</p>
            </div>

            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-foreground">Children ({children.length}/6)</h4>
              {children.length < 6 && (
                <Button onClick={addChild} variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Child
                </Button>
              )}
            </div>

            {children.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  No children added yet. Click "Add Child" to include children in your registration.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {children.map((child, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-lg font-semibold text-foreground">Child {index + 1}</h5>
                        <Button
                          onClick={() => removeChild(index)}
                          variant="destructive"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label>Child Name *</Label>
                          <Input
                            value={child.name}
                            onChange={(e) => updateChild(index, 'name', e.target.value)}
                            placeholder="Enter child's name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth *</Label>
                          <Input
                            type="date"
                            value={child.dob}
                            onChange={(e) => updateChild(index, 'dob', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Age *</Label>
                          <Input
                            value={child.age}
                            onChange={(e) => updateChild(index, 'age', e.target.value)}
                            placeholder="Enter age"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Birth Certificate *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`childCert${index}`}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'child', index)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById(`childCert${index}`)?.click()}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {child.birthCertificate ? child.birthCertificate.name : 'Upload Birth Certificate'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-primary rounded-full">
                  <UserCheck className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Parents Information</h3>
              <p className="text-muted-foreground">Please provide information for both your parents and your spouse's parents</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Member's Parents */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4">Your Parents</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Names *</Label>
                    <Input
                      value={parentsInfo.member.name}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        member: { ...parentsInfo.member, name: e.target.value }
                      })}
                      placeholder="Enter parent names"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent ID Numbers *</Label>
                    <Input
                      value={parentsInfo.member.idNumber}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        member: { ...parentsInfo.member, idNumber: e.target.value }
                      })}
                      placeholder="Enter parent ID numbers"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Phone Numbers *</Label>
                    <Input
                      value={parentsInfo.member.phone}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        member: { ...parentsInfo.member, phone: e.target.value }
                      })}
                      placeholder="Enter parent phone numbers"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Alternative Phones</Label>
                    <Input
                      value={parentsInfo.member.altPhone}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        member: { ...parentsInfo.member, altPhone: e.target.value }
                      })}
                      placeholder="Alternative phone numbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Areas of Residence *</Label>
                    <Input
                      value={parentsInfo.member.areaOfResidence}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        member: { ...parentsInfo.member, areaOfResidence: e.target.value }
                      })}
                      placeholder="Enter parent areas of residence"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Spouse's Parents */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4">
                  Spouse's Parents {memberInfo.maritalStatus !== 'Married' && '(Optional)'}
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Spouse Parent Names</Label>
                    <Input
                      value={parentsInfo.spouse.name}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        spouse: { ...parentsInfo.spouse, name: e.target.value }
                      })}
                      placeholder="Enter spouse parent names"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Spouse Parent ID Numbers</Label>
                    <Input
                      value={parentsInfo.spouse.idNumber}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        spouse: { ...parentsInfo.spouse, idNumber: e.target.value }
                      })}
                      placeholder="Enter spouse parent ID numbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Spouse Parent Phone Numbers</Label>
                    <Input
                      value={parentsInfo.spouse.phone}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        spouse: { ...parentsInfo.spouse, phone: e.target.value }
                      })}
                      placeholder="Enter spouse parent phone numbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Spouse Parent Alternative Phones</Label>
                    <Input
                      value={parentsInfo.spouse.altPhone}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        spouse: { ...parentsInfo.spouse, altPhone: e.target.value }
                      })}
                      placeholder="Alternative phone numbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Spouse Parent Areas of Residence</Label>
                    <Input
                      value={parentsInfo.spouse.areaOfResidence}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        spouse: { ...parentsInfo.spouse, areaOfResidence: e.target.value }
                      })}
                      placeholder="Enter spouse parent areas of residence"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-primary rounded-full">
                  <Receipt className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Payment Proof</h3>
              <p className="text-muted-foreground">Provide transaction ID for your registration fee payment</p>
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 mb-6">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-foreground mb-2">Registration Fee</h4>
                <div className="text-3xl font-bold text-primary mb-2">Ksh 50</div>
                <p className="text-muted-foreground">One-time administrative fee to join Team No Struggle</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID of Registration Fee Payment *</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your transaction ID (e.g., TNS123456789)"
                required
              />
              <p className="text-sm text-muted-foreground">
                Please provide the transaction ID from your Ksh 50 registration fee payment
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Pay Ksh 50 to our official payment account</li>
                <li>• Note down the transaction ID from your payment receipt</li>
                <li>• Enter the transaction ID in the field above</li>
                <li>• Keep your payment receipt for your records</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="register" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Member <span className="text-primary">Registration</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Complete the multi-step registration form to join our supportive community
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      i + 1 <= currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div
                      className={`h-1 w-full mx-2 ${
                        i + 1 < currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Member Info</span>
              <span>Spouse Info</span>
              <span>Children</span>
              <span>Parents</span>
              <span>Payment</span>
            </div>
          </div>

          <Card className="shadow-medium border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground text-center">
                Step {currentStep} of {totalSteps}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {renderStepContent()}

              <div className="flex justify-between pt-8">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep === totalSteps ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !transactionId}
                    className="bg-gradient-primary hover:opacity-90 transition-opacity"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Submit Registration
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MultiStepRegistration;