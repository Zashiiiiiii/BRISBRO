import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NameChangeRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  currentName: {
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
  };
  onSuccess?: () => void;
}

const NameChangeRequestForm = ({
  open,
  onOpenChange,
  residentId,
  currentName,
  onSuccess,
}: NameChangeRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    requestedFirstName: currentName.firstName,
    requestedMiddleName: currentName.middleName,
    requestedLastName: currentName.lastName,
    requestedSuffix: currentName.suffix,
    reason: "",
  });

  useEffect(() => {
    if (open && residentId) {
      checkPendingRequest();
    }
  }, [open, residentId]);

  const checkPendingRequest = async () => {
    setCheckingPending(true);
    try {
      const { data, error } = await supabase
        .from("name_change_requests")
        .select("id")
        .eq("resident_id", residentId)
        .eq("status", "pending")
        .limit(1);

      if (error) throw error;
      setHasPendingRequest((data?.length || 0) > 0);
    } catch (error) {
      console.error("Error checking pending requests:", error);
    } finally {
      setCheckingPending(false);
    }
  };

  const uploadProof = async (): Promise<string | null> => {
    if (!proofFile) return null;

    const fileExt = proofFile.name.split(".").pop();
    const filePath = `${residentId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("name-change-proofs")
      .upload(filePath, proofFile);

    if (error) throw new Error("Failed to upload proof document");

    const { data: urlData } = supabase.storage
      .from("name-change-proofs")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasPendingRequest) {
      toast.error("You already have a pending name change request.");
      return;
    }

    if (!formData.requestedFirstName.trim() || !formData.requestedLastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for the name change");
      return;
    }

    if (formData.reason.trim().length < 10) {
      toast.error("Please provide a more detailed reason (at least 10 characters)");
      return;
    }

    const hasChange =
      formData.requestedFirstName.trim() !== currentName.firstName ||
      formData.requestedMiddleName.trim() !== currentName.middleName ||
      formData.requestedLastName.trim() !== currentName.lastName ||
      formData.requestedSuffix.trim() !== currentName.suffix;

    if (!hasChange) {
      toast.error("No changes detected. Please modify at least one name field.");
      return;
    }

    setIsSubmitting(true);
    try {
      let proofUrl: string | null = null;
      if (proofFile) {
        proofUrl = await uploadProof();
      }

      const { error } = await supabase.from("name_change_requests").insert({
        resident_id: residentId,
        current_first_name: currentName.firstName,
        current_middle_name: currentName.middleName || null,
        current_last_name: currentName.lastName,
        current_suffix: currentName.suffix || null,
        requested_first_name: formData.requestedFirstName.trim(),
        requested_middle_name: formData.requestedMiddleName.trim() || null,
        requested_last_name: formData.requestedLastName.trim(),
        requested_suffix: formData.requestedSuffix.trim() || null,
        reason: formData.reason.trim(),
        proof_document_url: proofUrl,
      });

      if (error) throw error;

      toast.success("Name change request submitted successfully!");
      onOpenChange(false);
      onSuccess?.();

      setFormData({
        requestedFirstName: currentName.firstName,
        requestedMiddleName: currentName.middleName,
        requestedLastName: currentName.lastName,
        requestedSuffix: currentName.suffix,
        reason: "",
      });
      setProofFile(null);
    } catch (error: any) {
      console.error("Error submitting name change request:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Name Change</DialogTitle>
          <DialogDescription>
            Submit a request to correct your name. Staff will review and approve or reject your request.
          </DialogDescription>
        </DialogHeader>

        {checkingPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : hasPendingRequest ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-sm font-medium text-yellow-800">
              You already have a pending name change request.
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Please wait for staff to review your current request before submitting a new one.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Current Name:</p>
                <p className="text-sm text-muted-foreground">
                  {[currentName.firstName, currentName.middleName, currentName.lastName, currentName.suffix]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="requestedFirstName">First Name *</Label>
                  <Input
                    id="requestedFirstName"
                    value={formData.requestedFirstName}
                    onChange={(e) => setFormData({ ...formData, requestedFirstName: e.target.value })}
                    placeholder="Juan"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestedMiddleName">Middle Name</Label>
                  <Input
                    id="requestedMiddleName"
                    value={formData.requestedMiddleName}
                    onChange={(e) => setFormData({ ...formData, requestedMiddleName: e.target.value })}
                    placeholder="Santos"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestedLastName">Last Name *</Label>
                  <Input
                    id="requestedLastName"
                    value={formData.requestedLastName}
                    onChange={(e) => setFormData({ ...formData, requestedLastName: e.target.value })}
                    placeholder="Dela Cruz"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestedSuffix">Suffix</Label>
                  <Input
                    id="requestedSuffix"
                    value={formData.requestedSuffix}
                    onChange={(e) => setFormData({ ...formData, requestedSuffix: e.target.value })}
                    placeholder="Jr., Sr."
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Name Change *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Please explain why you need to change your name (e.g., typo in registration, incorrect spelling)"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.reason.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Proof Document (Optional)</Label>
                {proofFile ? (
                  <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                    <span className="text-sm truncate flex-1">{proofFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setProofFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("File must be less than 5MB");
                            return;
                          }
                          setProofFile(file);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a supporting document (ID, birth certificate, etc.). Max 5MB.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NameChangeRequestForm;
