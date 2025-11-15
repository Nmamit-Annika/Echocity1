import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AdminRoute from "./components/AdminRoute";
import MainLayout from "./components/MainLayout";
import Index from "./pages/Index";
import Cover from "./pages/Cover";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import AuthConfirmation from "./pages/AuthConfirmation";
import MyComplaints from "./pages/MyComplaints";
import CommunityDashboard from "./pages/CommunityDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={(import.meta as any).env.MODE === 'development' ? '/' : '/Echocity1'}>
        <AuthProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Cover />} />
              <Route path="/app" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/confirm" element={<AuthConfirmation />} />
              <Route path="/my-complaints" element={<MyComplaints />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/community" element={<CommunityDashboard />} />
              
              {/* Admin routes protected by AdminRoute */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
