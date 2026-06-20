import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe({
    query: { retry: false, queryKey: ["auth", "me"] },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to={`/login?from=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Layout><DashboardPage /></Layout>
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/operator-ranking">
        <Layout><OperatorRankingPage /></Layout>
      </Route>
      <Route path="/shift-ranking">
        <Layout><ShiftRankingPage /></Layout>
      </Route>
      <Route path="/data-entry">
        <RequireAuth><Layout><DataEntryPage /></Layout></RequireAuth>
      </Route>
      <Route path="/records">
        <RequireAuth><Layout><RecordsPage /></Layout></RequireAuth>
      </Route>
      <Route path="/operators">
        <RequireAuth><Layout><OperatorsPage /></Layout></RequireAuth>
      </Route>
      <Route path="/settings">
        <RequireAuth><Layout><SettingsPage /></Layout></RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
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
