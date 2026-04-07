import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import EcologicalProfileContent from "@/components/resident/EcologicalProfileContent";
import { 
  FileText, 
  Bell, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  LogOut,
  Home,
  Settings,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Leaf,
  CalendarDays,
  RefreshCw,
  Briefcase,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { useResidentAuth } from "@/hooks/useResidentAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveAnnouncements } from "@/utils/api";
import ResidentCertificateRequestForm from "@/components/resident/ResidentCertificateRequestForm";
import SuccessModal from "@/components/SuccessModal";

import ChatWidget from "@/components/ChatWidget";
import { logResidentLogout } from "@/utils/auditLog";
import { secureLogoutRedirect, markResidentForcedLogout } from "@/utils/authNavigationGuard";
import ProfileContent from "@/components/resident/ProfileContent";
import MessagesContent from "@/components/resident/MessagesContent";
import IncidentsContent from "@/components/resident/IncidentsContent";
import RequestsContent from "@/components/resident/RequestsContent";
import SettingsContent from "@/components/resident/SettingsContent";
import PendingVerificationBanner from "@/components/resident/PendingVerificationBanner";
interface Request {
  id: string;
  controlNumber: string;
  certificateType: string;
  status: string;
  dateSubmitted: string;
  rejectionReason?: string;
  priority?: string;
  preferredPickupDate?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  imageUrl?: string;
}

type EcoStatus = "none" | "pending" | "approved" | "rejected";

const ResidentSidebar = ({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  unreadMessageCount,
  isPending,
}: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  unreadMessageCount?: number;
  isPending?: boolean;
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const allMenuItems = [
    { title: "Home", icon: Home, tab: "home" },
    { title: "Profile", icon: User, tab: "profile" },
    { title: "Services", icon: Briefcase, tab: "services", restricted: true },
    { title: "Messages", icon: MessageSquare, tab: "messages", badge: unreadMessageCount > 0 ? unreadMessageCount : undefined, restricted: true },
    { title: "Settings", icon: Settings, tab: "settings" },
  ];

  const menuItems = isPending ? allMenuItems.filter(i => !i.restricted) : allMenuItems;

  // Highlight Services when on a sub-tab
  const serviceSubTabs = ["requests", "request", "incidents", "ecological-profile"];
  const getIsActive = (tab: string) => {
    if (tab === "services") return activeTab === "services" || serviceSubTabs.includes(activeTab);
    return activeTab === tab;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={isCollapsed ? "p-2" : "p-4"}>
          {!isCollapsed && (
            <h2 className="font-bold text-lg text-primary">Resident Portal</h2>
          )}
        </div>
        
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="relative">
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={getIsActive(item.tab)}
                    onClick={() => setActiveTab(item.tab)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex items-center justify-between flex-1">
                      {item.title}
                      {!isCollapsed && item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </span>
                  </SidebarMenuButton>
                  {isCollapsed && item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center z-10">
                      {item.badge}
                    </span>
                  )}
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Logout"
                  onClick={onLogout}
                  className="hover:bg-destructive/10 text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapse/Expand toggle */}
        <div className="mt-auto border-t border-border p-2">
          <SidebarTrigger className="w-full" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

const AnnouncementItem = ({ announcement }: { announcement: Announcement }) => {
  const [expanded, setExpanded] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const isLong = announcement.content.length > 150;

  return (
    <div className={`p-3 rounded-lg border overflow-hidden ${
      announcement.type === "important"
        ? "border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
        : "bg-card"
    }`}>
      <div className="flex gap-3">
        {announcement.imageUrl && (
          <>
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-20 h-20 object-cover rounded-md shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => setImageOpen(true)}
            />
            <Dialog open={imageOpen} onOpenChange={setImageOpen}>
              <DialogContent className="max-w-4xl p-2">
                <DialogTitle className="sr-only">{announcement.title}</DialogTitle>
                <img src={announcement.imageUrl} alt={announcement.title} className="w-full h-auto object-contain rounded" />
              </DialogContent>
            </Dialog>
          </>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm truncate">{announcement.title}</h4>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={announcement.type === "important" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                {announcement.type}
              </Badge>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{announcement.createdAt}</span>
            </div>
          </div>
          <p className={`text-xs text-muted-foreground mt-1 break-words whitespace-pre-line overflow-hidden ${!expanded && isLong ? "line-clamp-2" : ""}`}>
            {announcement.content}
          </p>
          {isLong && (
            <Button variant="link" size="sm" className="px-0 h-auto text-[11px] mt-0.5" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show Less" : "View More"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const MOBILE_TAB_ORDER = ["home", "services", "messages", "profile"];

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { user, profile, isAuthenticated, isLoading: authLoading, logout } = useResidentAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    // Map legacy "dashboard" to "home"
    if (tab === "dashboard") return "home";
    return tab || "home";
  });
  const [requests, setRequests] = useState<Request[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  
  const [submittedControlNumber, setSubmittedControlNumber] = useState("");
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [ecoStatus, setEcoStatus] = useState<EcoStatus>("none");
  const [isPendingVerification, setIsPendingVerification] = useState(false);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Swipe animation state
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [tabBounceKey, setTabBounceKey] = useState(0);

  // Touch refs for swipe and pull
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const pullThreshold = 60;
  const swipeThreshold = 50;

  // Browser back button = auto logout for security
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = async () => {
      markResidentForcedLogout();
      if (user && profile) {
        const fullName = profile.firstName && profile.lastName 
          ? `${profile.firstName} ${profile.lastName}`
          : profile.fullName || "Unknown Resident";
        await logResidentLogout(fullName, user.id);
      }
      await logout();
      window.location.replace("/auth");
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, profile, logout]);



  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Check approval status
      if (profile?.id) {
        const { data: resData } = await supabase
          .from("residents")
          .select("approval_status")
          .eq("id", profile.id)
          .maybeSingle();
        setIsPendingVerification(resData?.approval_status !== 'approved');
      }
      // Load user's requests
      const { data: requestsData } = await supabase
        .from("certificate_requests")
        .select("*")
        .eq("email", user?.email)
        .order("created_at", { ascending: false })
        .limit(50);

      if (requestsData) {
        setRequests(requestsData.map(r => ({
          id: r.id,
          controlNumber: r.control_number,
          certificateType: r.certificate_type,
          status: r.status || "pending",
          dateSubmitted: new Date(r.created_at || "").toLocaleDateString(),
          rejectionReason: r.rejection_reason || r.notes,
          priority: r.priority || "Normal",
          preferredPickupDate: r.preferred_pickup_date
            ? new Date(r.preferred_pickup_date).toLocaleDateString()
            : undefined,
        })));
      }

      // Load announcements with image
      const announcementsData = await fetchActiveAnnouncements();
      if (announcementsData) {
        const mapped = announcementsData.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          type: a.type,
          createdAt: new Date(a.created_at).toLocaleDateString(),
          imageUrl: a.image_url || undefined,
        }));
        // Sort: important first, then by date descending
        mapped.sort((a: any, b: any) => {
          if (a.type === "important" && b.type !== "important") return -1;
          if (a.type !== "important" && b.type === "important") return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setAnnouncements(mapped);
      }

      // Load unread message count
      if (user?.id) {
        const { data: msgCount } = await supabase.rpc("get_resident_unread_message_count", {
          p_user_id: user.id,
        });
        setUnreadMessageCount(msgCount || 0);
      }

      // Load ecological profile status
      if (profile?.id) {
        const { data: ecoData } = await supabase
          .from("ecological_profile_submissions")
          .select("status")
          .eq("submitted_by_resident_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (ecoData && ecoData.length > 0) {
          const s = ecoData[0].status;
          setEcoStatus(s === "approved" ? "approved" : s === "rejected" ? "rejected" : "pending");
        } else {
          setEcoStatus("none");
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Pull-to-refresh: only when scrolled to top and pulling down
    if (mainContentRef.current && mainContentRef.current.scrollTop <= 0 && deltaY > 0) {
      const clampedDistance = Math.min(deltaY * 0.5, 100);
      setPullDistance(clampedDistance);
      setIsPulling(true);
      if (clampedDistance > 10) {
        e.preventDefault();
      }
    }
  }, [isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    // Pull-to-refresh trigger
    if (isPulling && pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      setIsPulling(false);
      loadData().finally(() => {
        setIsRefreshing(false);
        toast.success("Refreshed");
      });
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }

    // Horizontal swipe detection (only if mostly horizontal and fast enough)
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && elapsed < 500) {
      const currentIndex = MOBILE_TAB_ORDER.indexOf(activeTab);
      if (currentIndex === -1) {
        touchStartRef.current = null;
        return;
      }
      if (deltaX < 0 && currentIndex < MOBILE_TAB_ORDER.length - 1) {
        setSwipeDirection("left");
        handleTabChange(MOBILE_TAB_ORDER[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        setSwipeDirection("right");
        handleTabChange(MOBILE_TAB_ORDER[currentIndex - 1]);
      }
    }

    touchStartRef.current = null;
  }, [isMobile, isPulling, pullDistance, isRefreshing, activeTab]);

  const handleLogout = async () => {
    if (user && profile) {
      const fullName = profile.firstName && profile.lastName 
        ? `${profile.firstName} ${profile.lastName}`
        : profile.fullName || "Unknown Resident";
      await logResidentLogout(fullName, user.id);
    }
    await logout();
    toast.success("Logged out successfully");
    window.location.replace("/auth");
  };

  const handleTabChange = (tab: string) => {
    setTabBounceKey(prev => prev + 1);
    setTimeout(() => setSwipeDirection(null), 250);
    setActiveTab(tab);
  };

  const handleRequestSuccess = (controlNumber: string) => {
    setSubmittedControlNumber(controlNumber);
    loadData();
    toast.success("Certificate request submitted successfully!");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      verifying: "default",
      approved: "outline",
      rejected: "destructive",
    };
    
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      verifying: <AlertCircle className="h-3 w-3 mr-1" />,
      approved: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <XCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || "secondary"} className="capitalize">
        {icons[status.toLowerCase()]}
        {status}
      </Badge>
    );
  };

  const latestRequest = requests.length > 0 ? requests[0] : null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine back navigation target
  const serviceSubTabs = ["requests", "request", "incidents", "ecological-profile"];
  const getBackTarget = () => {
    if (serviceSubTabs.includes(activeTab)) return { label: "Back to Services", tab: "services" };
    return { label: "Back to Home", tab: "home" };
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ResidentSidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange}
          onLogout={handleLogout}
          unreadMessageCount={unreadMessageCount}
          isPending={isPendingVerification}
        />
        
        <main 
          ref={mainContentRef}
          className={`flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto ${
            swipeDirection === "left" ? "animate-swipe-in-left" : 
            swipeDirection === "right" ? "animate-swipe-in-right" : ""
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull-to-refresh indicator */}
          {isMobile && (isPulling || isRefreshing) && (
            <div 
              className="flex items-center justify-center transition-all duration-200 overflow-hidden"
              style={{ height: isRefreshing ? 48 : pullDistance * 0.8 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""} ${pullDistance >= pullThreshold ? "text-primary" : ""}`} />
                <span>
                  {isRefreshing ? "Refreshing..." : pullDistance >= pullThreshold ? "Release to refresh" : "Pull to refresh"}
                </span>
              </div>
            </div>
          )}

          {/* ===== HOME TAB ===== */}
          {activeTab === "home" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      Welcome, {profile?.firstName && profile?.lastName 
                        ? `${profile.firstName} ${profile.lastName}` 
                        : profile?.fullName || "Resident"}
                    </h1>
                    <p className="text-muted-foreground">
                      Manage your barangay services online
                    </p>
                  </div>
                </div>
              </div>

              {isPendingVerification && <PendingVerificationBanner />}

              {/* Status Cards Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* My Latest Request Status */}
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      My Latest Request Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : latestRequest ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{latestRequest.certificateType}</p>
                          {getStatusBadge(latestRequest.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Control No: {latestRequest.controlNumber} • {latestRequest.dateSubmitted}
                        </p>
                        {latestRequest.priority?.toLowerCase() === "urgent" && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                        {latestRequest.preferredPickupDate && latestRequest.status === "approved" && (
                          <p className="text-sm flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            Est. Pickup: {latestRequest.preferredPickupDate}
                          </p>
                        )}
                        {latestRequest.status === "rejected" && latestRequest.rejectionReason && (
                          <p className="text-sm text-destructive">Reason: {latestRequest.rejectionReason}</p>
                        )}
                        <Button variant="link" size="sm" className="px-0" onClick={() => handleTabChange("requests")}>
                          View all requests →
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No requests yet</p>
                        <Button variant="link" size="sm" onClick={() => handleTabChange("services")}>
                          Go to Services →
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ecological Profile Status */}
                <Card className="border-l-4 border-l-accent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-accent" />
                      Ecological Profile Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {ecoStatus === "approved" && (
                            <Badge variant="outline" className="capitalize">
                              <CheckCircle className="h-3 w-3 mr-1" /> Approved
                            </Badge>
                          )}
                          {ecoStatus === "pending" && (
                            <Badge variant="secondary" className="capitalize">
                              <Clock className="h-3 w-3 mr-1" /> Pending Approval
                            </Badge>
                          )}
                          {ecoStatus === "rejected" && (
                            <Badge variant="destructive" className="capitalize">
                              <XCircle className="h-3 w-3 mr-1" /> Rejected
                            </Badge>
                          )}
                          {ecoStatus === "none" && (
                            <Badge variant="secondary" className="capitalize">
                              Not Submitted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {ecoStatus === "none"
                            ? "Submit your household ecological profile to help improve barangay services."
                            : ecoStatus === "pending"
                            ? "Your submission is being reviewed by staff."
                            : ecoStatus === "approved"
                            ? "Your ecological profile has been approved and recorded."
                            : "Your submission was returned. Please update and resubmit."}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="px-0"
                          onClick={() => handleTabChange("ecological-profile")}
                        >
                          {ecoStatus === "none" ? "Submit Profile →" : "Update Profile →"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Action - Go to Services */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary mb-6"
                onClick={() => handleTabChange("services")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Go to Services</h3>
                    <p className="text-sm text-muted-foreground">Certificates, incidents, ecological profile</p>
                  </div>
                  <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>

              {/* Announcements */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Announcements</CardTitle>
                    <CardDescription>Latest barangay updates</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No announcements at the moment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(showAllAnnouncements ? announcements : announcements.slice(0, 3)).map((announcement) => (
                        <AnnouncementItem key={announcement.id} announcement={announcement} />
                      ))}
                      {announcements.length > 3 && (
                        <div className="text-center pt-2">
                          <Button variant="outline" size="sm" onClick={() => setShowAllAnnouncements(!showAllAnnouncements)}>
                            {showAllAnnouncements ? "View Less" : `View More Announcements (${announcements.length - 3} more)`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* ===== SERVICES LANDING ===== */}
          {activeTab === "services" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Services</h1>
                  <p className="text-muted-foreground">Access barangay services</p>
                </div>
              </div>

              {isPendingVerification && <PendingVerificationBanner />}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTabChange("requests")}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Certificate Requests</h3>
                      <p className="text-sm text-muted-foreground mt-1">Request and track barangay certificates</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTabChange("incidents")}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Incident Reports</h3>
                      <p className="text-sm text-muted-foreground mt-1">File blotter records or complaints</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTabChange("ecological-profile")}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
                      <Leaf className="h-7 w-7 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Ecological Profile</h3>
                      <p className="text-sm text-muted-foreground mt-1">Submit household ecological census data</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* ===== REQUEST CERTIFICATE (sub-tab of Services) ===== */}
          {activeTab === "request" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => handleTabChange("services")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Services
                </Button>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    Request Certificate
                  </CardTitle>
                   <CardDescription>
                    Fill out the form below to request a barangay certificate. Please review the requirements guide before submitting your request.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile && (
                    <ResidentCertificateRequestForm 
                      profile={{
                        id: profile.id,
                        fullName: profile.fullName,
                        email: profile.email,
                        contactNumber: profile.contactNumber,
                        householdId: profile.householdId,
                      }}
                      onSuccess={handleRequestSuccess} 
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "request" && submittedControlNumber && (
            <SuccessModal
              open={!!submittedControlNumber}
              onOpenChange={(open) => { if (!open) setSubmittedControlNumber(""); }}
              controlNumber={submittedControlNumber}
              onReset={() => setSubmittedControlNumber("")}
              isResidentFlow
              onViewRequests={() => {
                setSubmittedControlNumber("");
                handleTabChange("requests");
              }}
            />
          )}

          {/* ===== REQUESTS LIST (sub-tab of Services) ===== */}
          {activeTab === "requests" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => handleTabChange("services")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Services
                </Button>
              </div>
              <RequestsContent onNewRequest={() => handleTabChange("request")} />
            </>
          )}

          {/* ===== PROFILE ===== */}
          {activeTab === "profile" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => handleTabChange("home")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
              <ProfileContent />
            </>
          )}

          {/* ===== MESSAGES ===== */}
          {activeTab === "messages" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => handleTabChange("home")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
              <MessagesContent />
            </>
          )}

          {/* ===== INCIDENTS (sub-tab of Services) ===== */}
          {activeTab === "incidents" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => handleTabChange("services")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Services
                </Button>
              </div>
              <IncidentsContent />
            </>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === "settings" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => handleTabChange("home")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
              <SettingsContent />
            </>
          )}

          {/* ===== ECOLOGICAL PROFILE (sub-tab of Services) ===== */}
          {activeTab === "ecological-profile" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => handleTabChange("services")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Services
                </Button>
              </div>
              <EcologicalProfileContent onSuccess={() => handleTabChange("services")} />
            </>
          )}
        </main>

        {/* Floating Chat Widget */}
        <ChatWidget />

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t shadow-medium">
          <div className="flex items-center justify-around h-16">
            {[
              { icon: Home, label: "Home", tab: "home" },
              { icon: Briefcase, label: "Services", tab: "services" },
              { icon: MessageSquare, label: "Messages", tab: "messages" },
              { icon: User, label: "Profile", tab: "profile" },
            ].map((item) => {
              const isActive = activeTab === item.tab || (item.tab === "services" && serviceSubTabs.includes(activeTab));
              return (
                <button
                  key={item.tab}
                  onClick={() => handleTabChange(item.tab)}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "animate-tab-bounce" : ""}`} key={isActive ? tabBounceKey : undefined} />
                  {item.tab === "messages" && unreadMessageCount > 0 && (
                    <span className="absolute top-2 right-1/4 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                      {unreadMessageCount}
                    </span>
                  )}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </SidebarProvider>
  );
};

export default ResidentDashboard;
