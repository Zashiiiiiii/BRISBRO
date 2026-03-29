import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Announcements from "@/components/Announcements";
import GoogleMap from "@/components/GoogleMap";
import Footer from "@/components/Footer";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useStaffAuthContext } from "@/context/StaffAuthContext";

const Index = () => {
  const { validateSession, logout } = useStaffAuthContext();

  // If user back/forwards to homepage with an active staff session, sign them out
  useAuthGuard({
    type: 'staff',
    isLoginPage: true,
    validateStaffSession: validateSession,
    logoutStaff: logout,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Announcements />
        <Services />
        <GoogleMap />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
