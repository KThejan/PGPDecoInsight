import { Link, useLocation } from "wouter";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, ClipboardList, Trophy, BarChart3,
  FileText, Users, Settings, LogOut, Factory,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/data-entry", label: "Data Entry", icon: ClipboardList },
  { href: "/operator-ranking", label: "Operator Ranking", icon: Trophy },
  { href: "/shift-ranking", label: "Shift Ranking", icon: BarChart3 },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/operators", label: "Operators", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        qc.removeQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      },
    },
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-44 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Factory className="h-6 w-6 text-primary" />
            <span className="font-mono font-bold text-sm tracking-widest text-foreground">PGPDECO</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-4 py-1 text-xs font-semibold text-muted-foreground tracking-widest mb-1">MENU</p>
          <ul className="space-y-0.5 px-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = location === href || location.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    data-testid={`nav-${href.slice(1)}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            data-testid="button-signout"
            onClick={() => logout.mutate()}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
