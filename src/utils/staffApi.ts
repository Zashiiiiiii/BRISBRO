/**
 * Staff API utilities
 * These functions call the staff-auth edge function with httpOnly cookie-based authentication
 * Session tokens are managed securely via cookies - not exposed to JavaScript
 */

const callStaffApi = async (action: string, body: Record<string, unknown> = {}): Promise<any> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
  };

  // Send stored token via custom header for cross-origin environments
  const storedToken = localStorage.getItem('bris_staff_token');
  if (storedToken) {
    headers['x-staff-token'] = storedToken;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/staff-auth`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ action, ...body }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Suppress 401 errors when the user has already logged out (race condition)
    if (response.status === 401 && !localStorage.getItem('bris_staff_token')) {
      console.warn(`Staff API call "${action}" returned 401 after logout — suppressed.`);
      return {};
    }
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

// Resident approval operations
export const getPendingRegistrations = async () => {
  const result = await callStaffApi('get-pending-registrations');
  return result.data || [];
};

export const approveResident = async (
  residentId: string, 
  approvedBy: string, 
  options?: { 
    householdId?: string; 
    newHousehold?: { householdNumber: string; address?: string; streetPurok?: string }; 
    verificationMethod?: string 
  }
) => {
  return callStaffApi('approve-resident', { residentId, approvedBy, ...options });
};

export const getDuplicateHints = async (firstName: string, lastName: string, birthDate?: string, address?: string) => {
  const result = await callStaffApi('get-duplicate-hints', { firstName, lastName, birthDate, address });
  return result.data || [];
};

export const rejectResident = async (residentId: string, rejectedBy: string, rejectionReason?: string) => {
  return callStaffApi('reject-resident', { residentId, rejectedBy, rejectionReason });
};

// Certificate request operations
export const getCertificateRequests = async (statusFilter?: string) => {
  const result = await callStaffApi('get-certificate-requests', { statusFilter });
  return result.data || [];
};

export const updateCertificateRequestStatus = async (
  requestId: string,
  status: string,
  processedBy: string,
  notes?: string
) => {
  return callStaffApi('update-request-status', { requestId, status, processedBy, notes });
};

// Announcement operations
export const getAnnouncementsForStaff = async () => {
  const result = await callStaffApi('get-announcements');
  return result.data || [];
};

export const createAnnouncementStaff = async (announcement: {
  title: string;
  content: string;
  titleTl?: string;
  contentTl?: string;
  type?: string;
  imageUrl?: string;
}) => {
  return callStaffApi('create-announcement', announcement);
};

export const updateAnnouncementStaff = async (
  id: string,
  announcement: {
    title?: string;
    content?: string;
    titleTl?: string;
    contentTl?: string;
    type?: string;
    isActive?: boolean;
    imageUrl?: string;
  }
) => {
  return callStaffApi('update-announcement', { id, ...announcement });
};

export const deleteAnnouncementStaff = async (id: string) => {
  return callStaffApi('delete-announcement', { id });
};

// Dashboard stats
export const getResidentCount = async () => {
  const result = await callStaffApi('get-resident-count');
  return result.count || 0;
};

export const getResidentDemographics = async () => {
  const result = await callStaffApi('get-resident-demographics');
  return result.data || [];
};

export const getHouseholdCount = async () => {
  const result = await callStaffApi('get-household-count');
  return result.count || 0;
};

export const getPendingRegistrationCount = async () => {
  const result = await callStaffApi('get-pending-registration-count');
  return result.count || 0;
};

export const getPendingCertificatesCount = async () => {
  const result = await callStaffApi('get-pending-certificates-count');
  return result.count || 0;
};

export const getPendingEcologicalCount = async () => {
  const result = await callStaffApi('get-pending-ecological-count');
  return result.count || 0;
};

// Messages
export const getStaffMessages = async (staffId?: string) => {
  const result = await callStaffApi('get-staff-messages', { staffId });
  return result.data || [];
};

export const getStaffUnreadMessageCount = async (staffId?: string) => {
  const result = await callStaffApi('get-staff-unread-message-count', { staffId });
  return result.count || 0;
};

export const getResidentsForMessagingStaff = async (staffId?: string) => {
  const result = await callStaffApi('get-residents-for-messaging-staff', { staffId });
  return result.data || [];
};

export const getResidentNamesByUserIds = async (userIds: string[]) => {
  const result = await callStaffApi('get-resident-names-by-user-ids', { userIds });
  return result.data || [];
};

export const sendStaffNewMessage = async (payload: {
  staffId?: string;
  recipientUserId: string;
  subject: string;
  content: string;
}) => {
  return callStaffApi('staff-send-new-message', payload);
};

export const markStaffMessageRead = async (messageId: string, staffId?: string) => {
  return callStaffApi('staff-mark-message-read', { messageId, staffId });
};

export const sendStaffReply = async (payload: {
  staffId?: string;
  recipientId: string;
  subject: string;
  content: string;
  parentMessageId: string;
}) => {
  return callStaffApi('staff-send-reply', payload);
};

export const getPendingNameChangeRequestsCount = async () => {
  const result = await callStaffApi('get-pending-name-change-requests-count');
  return result.count || 0;
};


// Staff user management (admin only)
export const getStaffUsers = async () => {
  const result = await callStaffApi('get-staff-users');
  return result.data || [];
};

export const createStaffUser = async (user: {
  username: string;
  fullName: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
}) => {
  return callStaffApi('create-staff-user', user);
};

export const updateStaffUser = async (
  id: string,
  updates: {
    username?: string;
    fullName?: string;
    passwordHash?: string;
    role?: string;
    isActive?: boolean;
  }
) => {
  return callStaffApi('update-staff-user', { id, ...updates });
};

export const deleteStaffUser = async (id: string) => {
  return callStaffApi('delete-staff-user', { id });
};

export const toggleStaffUserActive = async (id: string) => {
  return callStaffApi('toggle-staff-user-active', { id });
};

// Ecological submission import
export const importEcologicalSubmission = async (data: Record<string, unknown>) => {
  return callStaffApi('import-ecological-submission', data);
};

// Certificate data for download (bypasses RLS)
export const getCertificateDataForDownload = async (controlNumber: string) => {
  const result = await callStaffApi('get-certificate-data-for-download', { controlNumber });
  return result.data || null;
};

// Get certificate request ID by control number (bypasses RLS)
export const getCertificateIdByControlNumber = async (controlNumber: string) => {
  const result = await callStaffApi('get-certificate-id-by-control-number', { controlNumber });
  return result.data || null;
};

// Certificate type management
export const getCertificateTypes = async () => {
  const result = await callStaffApi('get-certificate-types');
  return result.data || [];
};

export const createCertificateType = async (name: string) => {
  return callStaffApi('create-certificate-type', { name });
};

export const updateCertificateType = async (id: string, name: string) => {
  return callStaffApi('update-certificate-type', { id, name });
};

export const toggleCertificateType = async (id: string) => {
  return callStaffApi('toggle-certificate-type', { id });
};

// Sync monitoring report data from residents/households
export const syncMonitoringReportData = async () => {
  const result = await callStaffApi('sync-monitoring-report-data');
  return result.data || null;
};

// Monitoring report operations (admin only)
export const getMonitoringReports = async () => {
  const result = await callStaffApi('get-monitoring-reports');
  return result.data || [];
};

export const getMonitoringReport = async (id: string) => {
  const result = await callStaffApi('get-monitoring-report', { id });
  return result.data || null;
};

export const createMonitoringReport = async (payload: Record<string, unknown>) => {
  return callStaffApi('create-monitoring-report', payload);
};

export const updateMonitoringReport = async (id: string, payload: Record<string, unknown>) => {
  return callStaffApi('update-monitoring-report', { id, ...payload });
};

export const deleteMonitoringReport = async (id: string) => {
  return callStaffApi('delete-monitoring-report', { id });
};

export const reopenMonitoringReport = async (id: string) => {
  return callStaffApi('reopen-monitoring-report', { id });
};

// Incident operations
export const getPendingIncidentsCount = async () => {
  const result = await callStaffApi('get-pending-incidents-count');
  return result.count || 0;
};

export const getAllIncidentsForStaff = async (approvalStatus?: string | null, status?: string | null) => {
  const result = await callStaffApi('get-all-incidents', { approvalStatus, status });
  return result.data || [];
};

export const createIncidentForStaff = async (incident: {
  incidentType: string;
  incidentDate: string;
  complainantName: string;
  complainantAddress?: string;
  complainantContact?: string;
  respondentName?: string;
  respondentAddress?: string;
  incidentLocation?: string;
  incidentDescription: string;
  actionTaken?: string;
  reportedBy?: string;
}) => {
  return callStaffApi('create-incident', incident);
};

export const approveIncidentForStaff = async (incidentId: string, reviewedBy: string) => {
  return callStaffApi('approve-incident', { incidentId, reviewedBy });
};

export const rejectIncidentForStaff = async (incidentId: string, reviewedBy: string, rejectionReason: string) => {
  return callStaffApi('reject-incident', { incidentId, reviewedBy, rejectionReason });
};

export const updateIncidentStatusForStaff = async (incidentId: string, status: string, handledBy: string) => {
  return callStaffApi('update-incident-status', { incidentId, status, handledBy });
};
