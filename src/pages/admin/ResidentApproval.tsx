import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { getPendingRegistrations, approveResident, rejectResident, getDuplicateHints } from "@/utils/staffApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Search, CheckCircle, XCircle, Loader2,
  User, Calendar, Phone, MapPin, Mail, Clock, AlertTriangle, Home
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PendingResident {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string | null;
  birth_date: string | null;
  contact_number: string | null;
  place_of_origin: string | null;
  approval_status: string;
  created_at: string;
  resident_type: string | null;
}

interface DuplicateHint {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  birth_date: string | null;
  email: string | null;
  household_number: string | null;
  household_address: string | null;
  match_score: number;
}

const RESIDENT_TYPE_LABELS: Record<string, string> = {
  owner: "Owner",
  tenant: "Tenant",
  boarder: "Boarder",
  relative: "Relative",
};

const VERIFICATION_METHODS = [
  { value: "matched_household", label: "Matched Household" },
  { value: "manual_review", label: "Manual Review" },
  { value: "proof_upload", label: "Proof Upload" },
];

const ResidentApproval = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useStaffAuth();
  const [pendingResidents, setPendingResidents] = useState<PendingResident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<PendingResident | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveResident_, setApproveResident_] = useState<PendingResident | null>(null);
  const [verificationMethod, setVerificationMethod] = useState("manual_review");
  const [householdOption, setHouseholdOption] = useState<"none" | "existing" | "new">("none");
  const [existingHouseholdId, setExistingHouseholdId] = useState("");
  const [householdSearch, setHouseholdSearch] = useState("");
  const [householdResults, setHouseholdResults] = useState<any[]>([]);
  const [newHouseholdNumber, setNewHouseholdNumber] = useState("");
  const [newHouseholdAddress, setNewHouseholdAddress] = useState("");
  const [newHouseholdPurok, setNewHouseholdPurok] = useState("");
  
  // Duplicate hints
  const [duplicateHints, setDuplicateHints] = useState<DuplicateHint[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPendingRegistrations();
    }
  }, [isAuthenticated]);

  const loadPendingRegistrations = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingRegistrations();
      setPendingResidents(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to load pending registrations");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDuplicateHints = async (resident: PendingResident) => {
    setLoadingDuplicates(true);
    try {
      const hints = await getDuplicateHints(
        resident.first_name,
        resident.last_name,
        resident.birth_date || undefined,
        resident.place_of_origin || undefined
      );
      setDuplicateHints(hints);
    } catch {
      setDuplicateHints([]);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const searchHouseholds = async (query: string) => {
    if (query.length < 2) { setHouseholdResults([]); return; }
    try {
      const { data } = await supabase
        .from("households")
        .select("id, household_number, address, street_purok")
        .or(`household_number.ilike.%${query}%,address.ilike.%${query}%`)
        .limit(10);
      setHouseholdResults(data || []);
    } catch {
      setHouseholdResults([]);
    }
  };

  const openApproveDialog = (resident: PendingResident) => {
    setApproveResident_(resident);
    setVerificationMethod("manual_review");
    setHouseholdOption("none");
    setExistingHouseholdId("");
    setHouseholdSearch("");
    setHouseholdResults([]);
    setNewHouseholdNumber("");
    setNewHouseholdAddress("");
    setNewHouseholdPurok("");
    setDuplicateHints([]);
    setApproveDialogOpen(true);
    loadDuplicateHints(resident);
  };

  const handleApprove = async () => {
    if (!approveResident_) return;
    setProcessingId(approveResident_.id);
    try {
      const options: any = { verificationMethod };
      if (householdOption === "existing" && existingHouseholdId) {
        options.householdId = existingHouseholdId;
      } else if (householdOption === "new" && newHouseholdNumber) {
        options.newHousehold = {
          householdNumber: newHouseholdNumber,
          address: newHouseholdAddress || undefined,
          streetPurok: newHouseholdPurok || undefined,
        };
      }
      
      await approveResident(approveResident_.id, user?.fullName || 'Admin', options);

      if (approveResident_.email) {
        try {
          await supabase.functions.invoke('send-approval-notification', {
            body: {
              recipientEmail: approveResident_.email,
              residentName: `${approveResident_.first_name} ${approveResident_.last_name}`,
              status: 'approved',
              approvedBy: user?.fullName || 'Admin',
            },
          });
        } catch (emailError) {
          console.error('Failed to send approval notification:', emailError);
        }
      }

      toast.success(`${approveResident_.first_name} ${approveResident_.last_name}'s registration has been approved`);
      setApproveDialogOpen(false);
      loadPendingRegistrations();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to approve registration");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (resident: PendingResident) => {
    setSelectedResident(resident);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedResident) return;
    setProcessingId(selectedResident.id);
    try {
      await rejectResident(
        selectedResident.id,
        user?.fullName || 'Admin',
        rejectionReason || 'Registration rejected'
      );

      if (selectedResident.email) {
        try {
          await supabase.functions.invoke('send-approval-notification', {
            body: {
              recipientEmail: selectedResident.email,
              residentName: `${selectedResident.first_name} ${selectedResident.last_name}`,
              status: 'rejected',
              rejectionReason: rejectionReason || 'Registration rejected',
            },
          });
        } catch (emailError) {
          console.error('Failed to send rejection notification:', emailError);
        }
      }

      toast.success(`${selectedResident.first_name} ${selectedResident.last_name}'s registration has been rejected`);
      setRejectDialogOpen(false);
      loadPendingRegistrations();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to reject registration");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredResidents = pendingResidents.filter(resident => {
    const fullName = `${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           resident.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/staff-dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Resident Registration Approval</CardTitle>
            <CardDescription>
              Review and approve or reject pending resident registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <div className="mb-4">
              <Badge variant="secondary" className="text-sm">
                {filteredResidents.length} pending registration{filteredResidents.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {filteredResidents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending registrations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResidents.map((resident) => (
                  <Card key={resident.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-lg">
                              {resident.first_name} {resident.middle_name} {resident.last_name}
                            </span>
                            {resident.resident_type && (
                              <Badge variant="outline" className="capitalize text-xs">
                                {RESIDENT_TYPE_LABELS[resident.resident_type] || resident.resident_type}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            {resident.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span>{resident.email}</span>
                              </div>
                            )}
                            {resident.birth_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(resident.birth_date), 'MMMM d, yyyy')}</span>
                              </div>
                            )}
                            {resident.contact_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{resident.contact_number}</span>
                              </div>
                            )}
                            {resident.place_of_origin && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>{resident.place_of_origin}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>Applied: {format(new Date(resident.created_at), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline" size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openRejectDialog(resident)}
                            disabled={processingId === resident.id}
                          >
                            {processingId === resident.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><XCircle className="h-4 w-4 mr-1" />Reject</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openApproveDialog(resident)}
                            disabled={processingId === resident.id}
                          >
                            {processingId === resident.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><CheckCircle className="h-4 w-4 mr-1" />Approve</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Registration</DialogTitle>
            <DialogDescription>
              Approve <strong>{approveResident_?.first_name} {approveResident_?.last_name}</strong> and optionally link to a household.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Duplicate Detection */}
            {loadingDuplicates ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking for duplicates...
              </div>
            ) : duplicateHints.length > 0 && (
              <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <p className="font-medium text-sm mb-2">Possible duplicate matches found:</p>
                  <div className="space-y-2">
                    {duplicateHints.map(hint => (
                      <div key={hint.id} className="text-xs p-2 bg-background rounded border">
                        <span className="font-medium">{hint.first_name} {hint.middle_name || ''} {hint.last_name}</span>
                        {hint.birth_date && <span className="ml-2 text-muted-foreground">Born: {format(new Date(hint.birth_date), 'MMM d, yyyy')}</span>}
                        {hint.household_number && (
                          <span className="ml-2 text-muted-foreground">HH# {hint.household_number}</span>
                        )}
                        <Badge variant="outline" className="ml-2 text-[10px]">{hint.match_score}% match</Badge>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Verification Method */}
            <div className="space-y-2">
              <Label>Verification Method</Label>
              <Select value={verificationMethod} onValueChange={setVerificationMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VERIFICATION_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Household Linking */}
            <div className="space-y-2">
              <Label>Link to Household (Optional)</Label>
              <Select value={householdOption} onValueChange={(v: any) => setHouseholdOption(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No household linking</SelectItem>
                  <SelectItem value="existing">Link to existing household</SelectItem>
                  <SelectItem value="new">Create new household</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {householdOption === "existing" && (
              <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                <Label>Search Household</Label>
                <Input
                  placeholder="Search by household number or address..."
                  value={householdSearch}
                  onChange={(e) => {
                    setHouseholdSearch(e.target.value);
                    searchHouseholds(e.target.value);
                  }}
                />
                {householdResults.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {householdResults.map(hh => (
                      <div
                        key={hh.id}
                        className={`p-2 rounded text-sm cursor-pointer border transition-colors ${
                          existingHouseholdId === hh.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                        }`}
                        onClick={() => { setExistingHouseholdId(hh.id); setVerificationMethod("matched_household"); }}
                      >
                        <div className="flex items-center gap-2">
                          <Home className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">HH# {hh.household_number}</span>
                        </div>
                        {hh.address && <p className="text-xs text-muted-foreground ml-5">{hh.address}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {householdOption === "new" && (
              <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                <div className="space-y-1">
                  <Label>Household Number *</Label>
                  <Input value={newHouseholdNumber} onChange={(e) => setNewHouseholdNumber(e.target.value)} placeholder="e.g., HH-001" />
                </div>
                <div className="space-y-1">
                  <Label>Address</Label>
                  <Input value={newHouseholdAddress} onChange={(e) => setNewHouseholdAddress(e.target.value)} placeholder="Full address" />
                </div>
                <div className="space-y-1">
                  <Label>Street / Purok</Label>
                  <Input value={newHouseholdPurok} onChange={(e) => setNewHouseholdPurok(e.target.value)} placeholder="e.g., Purok 1" />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={processingId === approveResident_?.id || (householdOption === "new" && !newHouseholdNumber)}
            >
              {processingId === approveResident_?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the registration for{" "}
              <strong>{selectedResident?.first_name} {selectedResident?.last_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for Rejection (Optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processingId === selectedResident?.id}
            >
              {processingId === selectedResident?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResidentApproval;
