import { Link, useLocation } from "wouter";
import { useLogout, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, ClipboardList, Trophy, BarChart3,
  FileText, Users, Settings, LogOut, LogIn,
} from "lucide-react";

const publicNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/operator-ranking", label: "Operator Ranking", icon: Trophy },
  { href: "/shift-ranking", label: "Shift Ranking", icon: BarChart3 },
];

const adminNav = [
  { href: "/data-entry", label: "Data Entry", icon: ClipboardList },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/operators", label: "Operators", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const { data: user } = useGetMe({ query: { retry: false, queryKey: ["auth", "me"] } });

  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        qc.removeQueries({ queryKey: getGetMeQueryKey() });
        qc.removeQueries({ queryKey: ["auth", "me"] });
        setLocation("/");
      },
    },
  });

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-44 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-3 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <img src="/pgp-logo.png" alt="PGP Glass" className="h-10 w-auto object-contain flex-shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="font-mono font-bold text-sm tracking-widest text-foreground">PGPDECO</span>
              <span className="text-xs text-muted-foreground leading-none">PGP Glass</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <p className="px-4 py-1 text-xs font-semibold text-muted-foreground tracking-widest mb-1">MENU</p>
          <ul className="space-y-0.5 px-2">
            {publicNav.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  data-testid={`nav-${href === "/" ? "dashboard" : href.slice(1)}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive(href)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {user && (
            <>
              <p className="px-4 pt-4 pb-1 text-xs font-semibold text-muted-foreground tracking-widest">ADMIN</p>
              <ul className="space-y-0.5 px-2">
                {adminNav.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      data-testid={`nav-${href.slice(1)}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive(href)
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Sign In / Sign Out */}
        <div className="p-3 border-t border-sidebar-border">
          {user ? (
            <div className="space-y-1.5">
              <p className="px-2 text-xs text-muted-foreground truncate">{user.username}</p>
              <button
                data-testid="button-signout"
                onClick={() => logout.mutate()}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:text-primary/80 hover:bg-sidebar-accent rounded-md transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Admin Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
