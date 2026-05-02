import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Public Pages
import Home from "./pages/public/Home";
import Properties from "./pages/public/Properties";
import PropertyDetail from "./pages/public/PropertyDetail";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProperties from "./pages/admin/Properties";
import AdminTenants from "./pages/admin/Tenants";
import AdminLeases from "./pages/admin/Leases";
import AdminPayments from "./pages/admin/Payments";
import AdminRentRoll from "./pages/admin/RentRoll";
import AdminMaintenance from "./pages/admin/Maintenance";
import AdminInquiries from "./pages/admin/Inquiries";
import AdminCollectionReport from "./pages/admin/CollectionReport";

// Tenant Pages
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantPayments from "./pages/tenant/Payments";
import TenantMaintenance from "./pages/tenant/Maintenance";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/:id" component={PropertyDetail} />
      
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/properties" component={AdminProperties} />
      <Route path="/admin/tenants" component={AdminTenants} />
      <Route path="/admin/leases" component={AdminLeases} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/rent-roll" component={AdminRentRoll} />
      <Route path="/admin/maintenance" component={AdminMaintenance} />
      <Route path="/admin/inquiries" component={AdminInquiries} />
      <Route path="/admin/collection-report" component={AdminCollectionReport} />

      {/* Tenant Routes */}
      <Route path="/tenant" component={TenantDashboard} />
      <Route path="/tenant/payments" component={TenantPayments} />
      <Route path="/tenant/maintenance" component={TenantMaintenance} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
