import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, ChevronLeft, ChevronRight, Upload, Users, Heart, User, Baby, UserCheck, Receipt, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

interface MemberInfo {
  name: string;
  email: string;
  idNumber: string;
  phone: string;
  altPhone: string;
  sex: string;
  maritalStatus: string;
  areaOfResidence: string;
  country: string;
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
  parent1: ParentInfo;
  parent2: ParentInfo;
}

// Validation schemas
const phoneSchema = z.string()
  .regex(/^(\+?254|0)?[17]\d{8}$/, 'Invalid phone number format. Use format: 0700000000 or +254700000000')
  .transform(phone => {
    phone = phone.replace(/\s/g, '');
    if (phone.startsWith('0')) return `254${phone.slice(1)}`;
    if (phone.startsWith('+')) return phone.slice(1);
    if (!phone.startsWith('254')) return `254${phone}`;
    return phone;
  });

const memberInfoSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase(),
  idNumber: z.string()
    .min(5, 'ID number must be at least 5 characters')
    .max(20, 'ID number too long')
    .regex(/^[A-Z0-9]+$/i, 'ID number can only contain letters and numbers')
    .transform(id => id.toUpperCase()),
  phone: phoneSchema,
  altPhone: z.string().optional().or(z.literal('')).refine(
    val => !val || /^(\+?254|0)?[17]\d{8}$/.test(val),
    'Invalid alternative phone format'
  ),
  sex: z.enum(['Male', 'Female', 'Other'] as const, {
    errorMap: () => ({ message: 'Please select a valid sex' })
  }),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed'] as const, {
    errorMap: () => ({ message: 'Please select a valid marital status' })
  }),
  areaOfResidence: z.string()
    .min(3, 'Area of residence required')
    .max(200, 'Area of residence too long'),
  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country name too long'),
  photo: z.instanceof(File).nullable()
});

const spouseInfoSchema = z.object({
  name: z.string().min(2).max(100).optional().or(z.literal('')),
  idNumber: z.string().max(20).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')).refine(
    val => !val || /^(\+?254|0)?[17]\d{8}$/.test(val),
    'Invalid phone format'
  ),
  altPhone: z.string().optional().or(z.literal('')),
  sex: z.string().optional().or(z.literal('')),
  areaOfResidence: z.string().max(200).optional().or(z.literal('')),
  photo: z.instanceof(File).nullable()
});

const childInfoSchema = z.object({
  name: z.string()
    .min(2, 'Child name must be at least 2 characters')
    .max(100, 'Child name too long'),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(date => {
      const d = new Date(date);
      const now = new Date();
      const eighteenYearsAgo = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
      return d < now && d > new Date('1900-01-01') && d > eighteenYearsAgo;
    }, 'Child must be born in the past and be under 18 years old'),
  age: z.string()
    .regex(/^\d+$/, 'Age must be a number')
    .transform(Number)
    .refine(age => age >= 0 && age <= 17, 'Age must be between 0 and 17'),
  birthCertificate: z.instanceof(File).nullable()
});

const parentInfoSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  idNumber: z.string().max(20).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')).refine(
    val => !val || /^(\+?254|0)?[17]\d{8}$/.test(val),
    'Invalid phone format'
  ),
  altPhone: z.string().optional().or(z.literal('')),
  areaOfResidence: z.string().max(200).optional().or(z.literal(''))
});


const MultiStepRegistration = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  const [memberInfo, setMemberInfo] = useState<MemberInfo>({
    name: '',
    email: '',
    idNumber: '',
    phone: '',
    altPhone: '',
    sex: '',
    maritalStatus: '',
    areaOfResidence: '',
    country: '',
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
    parent1: { name: '', idNumber: '', phone: '', altPhone: '', areaOfResidence: '' },
    parent2: { name: '', idNumber: '', phone: '', altPhone: '', areaOfResidence: '' },
  });

  const [transactionId, setTransactionId] = useState('');

  const totalSteps = 6;

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoadingCountries(true);
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
        const data = await response.json();
        
        const countryNames = data
          .map((country: any) => country.name.common)
          .sort((a: string, b: string) => a.localeCompare(b));
        
        setCountries(countryNames);
      } catch (error) {
        console.error('Error fetching countries:', error);
        toast({
          title: 'Warning',
          description: 'Failed to load countries list. Please refresh the page.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, [toast]);

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

  const validateStep = (step: number): boolean => {
    try {
      switch(step) {
        case 0: // Country selection
          if (!memberInfo.country) {
            toast({
              title: 'Validation Error',
              description: 'Please select a country',
              variant: 'destructive'
            });
            return false;
          }
          break;
        case 1: // Member info
          memberInfoSchema.parse(memberInfo);
          break;
        case 2: // Spouse info (only if married)
          if (memberInfo.maritalStatus === 'Married') {
            if (!spouseInfo.name) {
              toast({
                title: 'Validation Error',
                description: 'Spouse name is required for married members',
                variant: 'destructive'
              });
              return false;
            }
            spouseInfoSchema.parse(spouseInfo);
          }
          break;
        case 3: // Children info
          if (children.length > 0) {
            children.forEach((child, idx) => {
              try {
                childInfoSchema.parse(child);
              } catch (error: any) {
                if (error instanceof z.ZodError) {
                  throw new Error(`Child ${idx + 1}: ${error.errors[0].message}`);
                }
              }
            });
          }
          break;
        case 4: // Parents info
          parentInfoSchema.parse(parentsInfo.parent1);
          parentInfoSchema.parse(parentsInfo.parent2);
          break;
        case 5: // Payment proof
          if (!transactionId.trim()) {
            toast({
              title: 'Validation Error',
              description: 'Payment transaction ID is required',
              variant: 'destructive'
            });
            return false;
          }
          break;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else if (error instanceof Error) {
        toast({
          title: 'Validation Error',
          description: error.message,
          variant: 'destructive'
        });
      }
      return false;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep - 1)) return;
    
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
    // Validate all steps before submission (validateStep uses 0-based indexing)
    for (let step = 0; step <= 5; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step + 1);
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Normalize and validate ID number uniqueness before any uploads
      const rawId = (memberInfo.idNumber || '').trim();
      if (!rawId) {
        throw new Error('ID number is required');
      }

      // Check for duplicate ID number in the system
      const { data: existingById, error: idCheckError } = await supabase
        .from('membership_registrations')
        .select('id')
        .eq('id_number', rawId)
        .limit(1);

      if (idCheckError) {
        console.error('Error checking ID number uniqueness:', idCheckError);
      }

      if (existingById && existingById.length > 0) {
        toast({
          title: 'Duplicate ID Number',
          description: 'This ID number is already registered in the system. Please verify and use a different ID.',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      // Extract city and state from area of residence
      const areaOfResidence = memberInfo.areaOfResidence;
      const areaParts = areaOfResidence.split(',').map(part => part.trim());
      const city = areaParts[0] || areaOfResidence;
      const state = areaParts[1] || memberInfo.country || 'Not specified';
      
      console.log('Area parsing:', { areaOfResidence, city, state, country: memberInfo.country });
      const country = memberInfo.country;

      // Determine membership type based on marital status
      const membershipType = memberInfo.maritalStatus === 'Married' ? 'family' : 
                            memberInfo.maritalStatus === 'Single' ? 'basic' : 'basic';

      // Validate and parse member name
      if (!memberInfo.name || !memberInfo.name.trim()) {
        throw new Error('Member name is required');
      }
      
      const nameParts = memberInfo.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || 'N/A';
      
      // Basic validation
      if (!memberInfo.email || !memberInfo.phone || !areaOfResidence) {
        throw new Error('Please fill in all required fields: name, email, phone, and area of residence');
      }
      
      if (!transactionId.trim()) {
        throw new Error('Payment transaction ID is required');
      }

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

      // Upload spouse photo if provided
      let spousePhotoUrl = null;
      if (spouseInfo.photo) {
        const spouseFileName = `spouse-${Date.now()}-${spouseInfo.photo.name}`;
        const { data: spouseUploadData, error: spouseUploadError } = await supabase.storage
          .from('member-profiles')
          .upload(spouseFileName, spouseInfo.photo);

        if (spouseUploadError) {
          console.error('Error uploading spouse photo:', spouseUploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('member-profiles')
            .getPublicUrl(spouseFileName);
          spousePhotoUrl = publicUrl;
        }
      }

      const paymentRef = transactionId.trim().toUpperCase();

      // Ensure state is never empty (fallback)
      const finalState = state && state.trim() !== '' ? state : 'Not specified';
      
      // Build complete registration data with all collected fields
      const registrationData: any = {
        first_name: firstName,
        last_name: lastName,
        email: memberInfo.email,
        phone: memberInfo.phone,
        address: areaOfResidence,
        city: city,
        state: finalState,
        zip_code: '00000',
        membership_type: membershipType,
        mpesa_payment_reference: paymentRef,
        registration_status: 'pending',
        payment_status: 'pending'
      };
      
      // Add country
      if (country) {
        registrationData.country = country;
      }
      
      // Add optional member fields
      if (memberInfo.idNumber) {
        registrationData.id_number = memberInfo.idNumber;
      }
      
      if (memberInfo.altPhone) {
        registrationData.alternative_phone = memberInfo.altPhone;
      }
      
      if (memberInfo.sex) {
        registrationData.sex = memberInfo.sex;
      }
      
      if (memberInfo.maritalStatus) {
        registrationData.marital_status = memberInfo.maritalStatus;
      }
      
      if (profilePictureUrl) {
        registrationData.profile_picture_url = profilePictureUrl;
      }
      
      // Add spouse information if married
      if (memberInfo.maritalStatus === 'Married' && spouseInfo.name) {
        registrationData.spouse_name = spouseInfo.name;
        registrationData.spouse_id_number = spouseInfo.idNumber || null;
        registrationData.spouse_phone = spouseInfo.phone || null;
        registrationData.spouse_alt_phone = spouseInfo.altPhone || null;
        registrationData.spouse_sex = spouseInfo.sex || null;
        registrationData.spouse_area_of_residence = spouseInfo.areaOfResidence || null;
        registrationData.spouse_photo_url = spousePhotoUrl;
      }
      
      // Add children data as JSON
      if (children.length > 0) {
        registrationData.children_data = children.map(child => ({
          name: child.name,
          dob: child.dob,
          age: child.age
        }));
      }
      
      // Add parent 1 information
      if (parentsInfo.parent1.name) {
        registrationData.parent1_name = parentsInfo.parent1.name;
        registrationData.parent1_id_number = parentsInfo.parent1.idNumber || null;
        registrationData.parent1_phone = parentsInfo.parent1.phone || null;
        registrationData.parent1_alt_phone = parentsInfo.parent1.altPhone || null;
        registrationData.parent1_area = parentsInfo.parent1.areaOfResidence || null;
        registrationData.emergency_contact_name = parentsInfo.parent1.name;
        registrationData.emergency_contact_phone = parentsInfo.parent1.phone || memberInfo.altPhone || memberInfo.phone;
      } else {
        registrationData.emergency_contact_name = 'Not provided';
        registrationData.emergency_contact_phone = memberInfo.altPhone || memberInfo.phone;
      }
      
      // Add parent 2 information
      if (parentsInfo.parent2.name) {
        registrationData.parent2_name = parentsInfo.parent2.name;
        registrationData.parent2_id_number = parentsInfo.parent2.idNumber || null;
        registrationData.parent2_phone = parentsInfo.parent2.phone || null;
        registrationData.parent2_alt_phone = parentsInfo.parent2.altPhone || null;
        registrationData.parent2_area = parentsInfo.parent2.areaOfResidence || null;
      }

      // Double-check state field is populated
      if (!registrationData.state || registrationData.state.trim() === '') {
        registrationData.state = 'Unknown';
        console.log('State was empty, set to Unknown');
      }
      
      // Validate required fields before submission
      const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip_code', 'membership_type', 'mpesa_payment_reference'];
      const missingFields = requiredFields.filter(field => !registrationData[field] || registrationData[field].trim() === '');
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        console.error('Current registration data:', registrationData);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      console.log('Submitting complete registration data:', registrationData);
      console.log('All fields:', Object.keys(registrationData));
      console.log('Spouse info:', spouseInfo.name ? 'Included' : 'Not applicable');
      console.log('Children count:', children.length);
      console.log('Parents info:', { parent1: parentsInfo.parent1.name, parent2: parentsInfo.parent2.name });
      
      let { data, error } = await supabase
        .from('membership_registrations')
        .insert(registrationData)
        .select()
        .single();

      if (error) {
        console.error('Database error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        console.error('Submitted data that caused error:', registrationData);
        
        // Check if it's an unknown column error for mpesa_payment_reference
        if (error.message.includes('mpesa_payment_reference') && error.message.includes('column')) {
          console.log('MPESA reference column not found, trying fallback method...');
          
          // Fallback: store in address field temporarily
          const fallbackData = { ...registrationData };
          fallbackData.address = `${areaOfResidence} | MPESA Ref: ${paymentRef}`;
          delete fallbackData.mpesa_payment_reference;
          
          console.log('Retrying with fallback data:', fallbackData);
          
          const { data: fallbackResult, error: fallbackError } = await supabase
            .from('membership_registrations')
            .insert(fallbackData)
            .select()
            .single();
          
          if (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw fallbackError;
          }
          
          console.log('Fallback registration successful:', fallbackResult);
          console.log('Assigned TNS Number:', fallbackResult.tns_number);
          
          // Set data for success handling
          data = fallbackResult;
          // Continue with normal success flow below
        }
        
        throw error;
      }
      
      console.log('✅ Registration successful:', data);
      console.log('✅ Assigned TNS Number:', data.tns_number);
      console.log('✅ All form data saved to database including:');
      console.log('  - Member information (name, contact, ID, sex, marital status)');
      console.log('  - Country:', country);
      console.log('  - Spouse information:', spouseInfo.name ? 'Saved' : 'N/A');
      console.log('  - Children data:', children.length > 0 ? `${children.length} children saved` : 'N/A');
      console.log('  - Parent 1 information:', parentsInfo.parent1.name || 'N/A');
      console.log('  - Parent 2 information:', parentsInfo.parent2.name || 'N/A');
      console.log('  - Photos:', { member: !!profilePictureUrl, spouse: !!spousePhotoUrl });

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
        country: '',
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
        parent1: { name: '', idNumber: '', phone: '', altPhone: '', areaOfResidence: '' },
        parent2: { name: '', idNumber: '', phone: '', altPhone: '', areaOfResidence: '' },
      });
      setTransactionId('');
    } catch (error) {
      console.error('Error submitting registration:', error);
      
      let errorMessage = "Failed to submit registration. Please try again.";
      
      if (error instanceof Error) {
        // User-friendly error messages
        if (error.message.includes('required')) {
          errorMessage = error.message;
        } else if (error.message.includes('violates unique constraint') || error.message.toLowerCase().includes('duplicate')) {
          if (error.message.toLowerCase().includes('id_number')) {
            errorMessage = "This ID number is already registered. Please use a different ID number.";
          } else if (error.message.toLowerCase().includes('email')) {
            errorMessage = "This email is already registered. Please use a different email or contact support.";
          } else if (error.message.toLowerCase().includes('phone')) {
            errorMessage = "This phone number is already registered. Please use a different phone number.";
          } else {
            errorMessage = "Duplicate details detected. Please review your information.";
          }
        } else if (error.message.includes('invalid')) {
          errorMessage = "Please check your information and ensure all fields are filled correctly.";
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
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
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                  <Globe className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-950 mb-2">Country Selection</h3>
              <p className="text-slate-600">Please select your country of residence</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberCountry">Country *</Label>
              <Select 
                onValueChange={(value) => setMemberInfo({ ...memberInfo, country: value })}
                value={memberInfo.country}
                disabled={isLoadingCountries}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select your country"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {isLoadingCountries ? (
                    <SelectItem value="loading" disabled>Loading countries...</SelectItem>
                  ) : countries.length > 0 ? (
                    countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="error" disabled>Failed to load countries</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-950 mb-2">Member Information</h3>
              <p className="text-slate-600">Please provide your personal details</p>
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
                placeholder="e.g., Nairobi, Kampala, London, etc."
                required
              />
              <p className="text-sm text-slate-600">
                Enter your city or area. You can also include state/region (e.g., "Boston, Massachusetts")
              </p>
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

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-950 mb-2">Spouse Information</h3>
              <p className="text-slate-600">Please provide your spouse's details (if married)</p>
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
                <p className="text-slate-600 text-lg">
                  This section is only required if you are married. You can proceed to the next step.
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                  <Baby className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-950 mb-2">Children Information</h3>
              <p className="text-slate-600">Add up to 6 children (if applicable)</p>
            </div>

            <div className="flex justify-between items-center gap-4">
              <h4 className="text-lg font-extrabold text-slate-900">Children ({children.length}/6)</h4>
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
                  <Card key={index} className="border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-lg font-extrabold text-slate-900">Child {index + 1}</h5>
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

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-950 mb-2">Parents Information</h3>
              <p className="text-slate-600">Please provide information for your parents</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Parent 1 */}
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 mb-4">Parent 1 Information</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Names *</Label>
                    <Input
                      value={parentsInfo.parent1.name}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent1: { ...parentsInfo.parent1, name: e.target.value }
                      })}
                      placeholder="Enter parent names"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent ID Numbers *</Label>
                    <Input
                      value={parentsInfo.parent1.idNumber}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent1: { ...parentsInfo.parent1, idNumber: e.target.value }
                      })}
                      placeholder="Enter parent ID numbers"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Phone Numbers *</Label>
                    <Input
                      value={parentsInfo.parent1.phone}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent1: { ...parentsInfo.parent1, phone: e.target.value }
                      })}
                      placeholder="Enter parent phone numbers"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Alternative Phones</Label>
                    <Input
                      value={parentsInfo.parent1.altPhone}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent1: { ...parentsInfo.parent1, altPhone: e.target.value }
                      })}
                      placeholder="Alternative phone numbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Areas of Residence *</Label>
                    <Input
                      value={parentsInfo.parent1.areaOfResidence}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent1: { ...parentsInfo.parent1, areaOfResidence: e.target.value }
                      })}
                      placeholder="Enter parent areas of residence"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Parent 2 */}
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 mb-4">
                  Parent 2 Information (Optional)
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Names</Label>
                    <Input
                      value={parentsInfo.parent2.name}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent2: { ...parentsInfo.parent2, name: e.target.value }
                      })}
                      placeholder="Enter parent names"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent ID Numbers</Label>
                    <Input
                      value={parentsInfo.parent2.idNumber}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent2: { ...parentsInfo.parent2, idNumber: e.target.value }
                      })}
                      placeholder="Enter parent ID numbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Phone Numbers</Label>
                    <Input
                      value={parentsInfo.parent2.phone}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent2: { ...parentsInfo.parent2, phone: e.target.value }
                      })}
                      placeholder="Enter parent phone numbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Alternative Phones</Label>
                    <Input
                      value={parentsInfo.parent2.altPhone}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent2: { ...parentsInfo.parent2, altPhone: e.target.value }
                      })}
                      placeholder="Alternative phone numbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Areas of Residence</Label>
                    <Input
                      value={parentsInfo.parent2.areaOfResidence}
                      onChange={(e) => setParentsInfo({
                        ...parentsInfo,
                        parent2: { ...parentsInfo.parent2, areaOfResidence: e.target.value }
                      })}
                      placeholder="Enter parent areas of residence"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-950 mb-2">Payment Proof</h3>
              <p className="text-slate-600">Provide transaction ID for your registration fee payment</p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-8 mb-6">
              <div className="text-center">
                <h4 className="text-xl font-black text-slate-950 mb-2">Registration Fee</h4>
                <div className="text-3xl font-black text-blue-600 mb-2">Ksh 1000</div>
                <p className="text-slate-600">One-time administrative fee to join Itumbu Welfare</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID of Registration Fee Payment *</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your MPESA transaction ID (e.g., MDHBBEBEBEB)"
                required
              />
              <p className="text-sm text-slate-600">
                Please provide the transaction ID from your Ksh 1000 registration fee payment
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
              <h5 className="font-black text-blue-900 mb-2">Payment Instructions:</h5>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Pay Ksh 1000 to our official payment account</li>
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
    <section id="register" className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute left-0 top-0 h-2 w-full bg-blue-600" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 bg-blue-600 rounded-full text-white shadow-md">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-white">
              Join Itumbu Welfare
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-slate-950 leading-tight">
            Member <span className="text-blue-600">Registration</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Complete the multi-step registration form to join our supportive community
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Modern Progress Indicator */}
          <div className="mb-10">
            <div className="relative">
              {/* Progress bar background */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 rounded-full" />
              {/* Active progress bar */}
              <div 
                className="absolute top-5 left-0 h-1 bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              />
              
              {/* Step indicators */}
              <div className="relative flex justify-between">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div
                      className={`relative w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                        i + 1 <= currentStep
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110'
                          : 'bg-white text-slate-500 border-slate-300'
                      }`}
                    >
                      {i + 1 <= currentStep && (
                        <div className="absolute inset-0 rounded-full bg-blue-300/30 blur-lg animate-pulse" />
                      )}
                      <span className="relative z-10">{i + 1}</span>
                    </div>
                    <span className={`text-xs font-medium transition-colors duration-300 ${
                      i + 1 <= currentStep ? 'text-slate-900' : 'text-slate-500'
                    }`}>
                      {['Country', 'Personal', 'Spouse', 'Children', 'Parents', 'Payment'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden bg-white shadow-2xl border-2 border-slate-200 rounded-3xl">
            <div className="absolute left-0 top-0 h-2 w-full bg-green-600" />
            <CardHeader className="relative z-10 pb-8">
              <div className="text-center">
                <div className="inline-block mb-2 px-3 py-1 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
                <CardTitle className="text-2xl font-black text-slate-950">
                  {['Select Country', 'Personal Information', 'Spouse Details', 'Children Information', 'Parent Details', 'Payment Proof'][currentStep - 1]}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="relative z-10">
              {renderStepContent()}

              <div className="flex justify-between items-center pt-10 gap-4 border-t border-slate-200 mt-8">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  variant="outline"
                  size="lg"
                  className="flex-1 md:flex-initial"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep === totalSteps ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !transactionId}
                    size="lg"
                    className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 hover:shadow-xl transition-all duration-300"
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
                  <Button 
                    onClick={nextStep}
                    size="lg"
                    className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 hover:shadow-xl transition-all duration-300"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-2 w-full bg-green-600" />
    </section>
  );
};

export default MultiStepRegistration;
