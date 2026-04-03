import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PendingVerificationBanner = () => (
  <div className="w-full max-w-2xl mx-auto py-8">
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertDescription className="text-sm">
        <p className="font-semibold mb-1">Account Pending Verification</p>
        <p className="text-muted-foreground">
          Your account is still being reviewed by barangay staff. This feature will be available once your registration is approved. You can view announcements and check your status in the meantime.
        </p>
      </AlertDescription>
    </Alert>
  </div>
);

export default PendingVerificationBanner;
