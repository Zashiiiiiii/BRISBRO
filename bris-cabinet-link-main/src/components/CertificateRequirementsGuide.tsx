import { ClipboardList, Banknote } from "lucide-react";

const REQUIREMENTS_MAP: { keywords: string[]; label: string; items: string[]; fee?: string }[] = [
  {
    keywords: ["clearance"],
    label: "Barangay Clearance",
    items: [
      "Valid ID",
      "Purpose of request",
      "Community Tax Certificate (Cedula)",
    ],
    fee: "₱50.00",
  },
  {
    keywords: ["residency", "residence"],
    label: "Certificate of Residency",
    items: [
      "Valid ID",
      "Purpose of request",
    ],
    fee: "₱50.00",
  },
  {
    keywords: ["good moral", "moral character"],
    label: "Certificate of Good Moral Character",
    items: [
      "Valid ID",
      "Purpose of request",
    ],
    fee: "₱50.00",
  },
  {
    keywords: ["indigency", "indigent"],
    label: "Certificate of Indigency",
    items: [
      "Valid ID",
      "Purpose of request",
      "Proof of income or livelihood (if available)",
    ],
  },
  {
    keywords: ["medical"],
    label: "Medical-Related Certificate",
    items: [
      "Medical certificate from a doctor",
      "Valid ID",
      "Purpose of request",
    ],
    fee: "₱50.00",
  },
  {
    keywords: ["pwd"],
    label: "PWD-Related Certificate",
    items: [
      "PWD ID",
      "Medical certificate",
      "Valid ID",
      "Purpose of request",
    ],
  },
  {
    keywords: ["cedula", "community tax"],
    label: "Community Tax Certificate (Cedula)",
    items: [
      "Valid ID",
      "Latest income information",
    ],
    fee: "₱25.00 – ₱100.00 (based on income)",
  },
  {
    keywords: ["business", "permit"],
    label: "Business-Related Clearance",
    items: [
      "Valid ID",
      "DTI/SEC registration (if applicable)",
      "Lease contract or proof of business address",
      "Purpose of request",
    ],
    fee: "₱200.00 – ₱500.00 (varies by business type)",
  },
  {
    keywords: ["first time job seeker"],
    label: "First Time Job Seeker Certification",
    items: [
      "Valid ID",
      "Purpose of request",
      "Additional barangay verification if needed",
    ],
  },
  {
    keywords: ["others"],
    label: "Others (Specify)",
    items: [
      "Valid ID",
      "Purpose of request",
      "Additional supporting requirements may be requested by the barangay",
    ],
  },
];

const DEFAULT_REQUIREMENTS = {
  label: "General Requirements",
  items: ["Valid ID", "Purpose of request"],
};

function getRequirements(certificateType: string) {
  const lower = certificateType.toLowerCase();
  const match = REQUIREMENTS_MAP.find((r) =>
    r.keywords.some((kw) => lower.includes(kw))
  );
  return match ?? { label: DEFAULT_REQUIREMENTS.label, items: DEFAULT_REQUIREMENTS.items, fee: undefined };
}

interface CertificateRequirementsGuideProps {
  certificateType: string;
}

const CertificateRequirementsGuide = ({ certificateType }: CertificateRequirementsGuideProps) => {
  if (!certificateType) return null;

  const { label, items, fee } = getRequirements(certificateType);

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">
          Requirements Guide
        </h4>
      </div>
      <div className="text-sm text-foreground">
        <span className="text-muted-foreground">Certificate Type:</span>{" "}
        <span className="font-medium">{certificateType}</span>
      </div>
      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {fee && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 px-3 py-2">
          <Banknote className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-yellow-800 dark:text-yellow-300">Payment Required: </span>
            <span className="text-yellow-700 dark:text-yellow-400">{fee}</span>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              Please prepare this amount to pay at the barangay office upon pickup.
            </p>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground/70 italic">
        Requirements may vary depending on certificate type.
      </p>
    </div>
  );
};

export default CertificateRequirementsGuide;
