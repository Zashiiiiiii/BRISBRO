/**
 * Maps DB status values to user-friendly barangay incident/blotter labels.
 * DB values remain unchanged; only display labels are affected.
 */

/** approval_status display labels */
export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  approved: "Recorded",
  rejected: "Returned",
};

/** case status display labels (lifecycle after recording) */
export const CASE_STATUS_LABELS: Record<string, string> = {
  open: "Ongoing",
  investigating: "Under Investigation",
  resolved: "Resolved",
  referred: "Referred",
  closed: "Closed",
};

export const getApprovalLabel = (dbValue: string): string =>
  APPROVAL_STATUS_LABELS[dbValue] || dbValue;

export const getCaseStatusLabel = (dbValue: string): string =>
  CASE_STATUS_LABELS[dbValue] || dbValue;
