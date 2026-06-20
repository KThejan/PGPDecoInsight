import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import DataEntryPage from "@/pages/data-entry";
import OperatorRankingPage from "@/pages/operator-ranking";
import ShiftRankingPage from "@/pages/shift-ranking";
import RecordsPage from "@/pages/records";
import OperatorsPage from "@/pages/operators";
import SettingsPage from "@/pages/settings";
import Layout from "@/components/layout";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false, queryKey: ["auth", "me"] } });

  useEffect(() => {
    if (!isLoading) {
      if (!user && location !== "/") setLocation("/");
      if (user && location === "/") setLocation("/dashboard");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route path="/dashboard">
          <Layout><DashboardPage /></Layout>
        </Route>
        <Route path="/data-entry">
          <Layout><DataEntryPage /></Layout>
        </Route>
        <Route path="/operator-ranking">
          <Layout><OperatorRankingPage /></Layout>
        </Route>
        <Route path="/shift-ranking">
          <Layout><ShiftRankingPage /></Layout>
        </Route>
        <Route path="/records">
          <Layout><RecordsPage /></Layout>
        </Route>
        <Route path="/operators">
          <Layout><OperatorsPage /></Layout>
        </Route>
        <Route path="/settings">
          <Layout><SettingsPage /></Layout>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AuthGuard>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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
