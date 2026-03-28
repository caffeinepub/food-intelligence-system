import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  Brain,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Upload,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface NavBarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navLinks = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "history", label: "History", icon: History },
];

export function NavBar({
  theme,
  onToggleTheme,
  activeTab,
  onTabChange,
}: NavBarProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : "Guest";

  return (
    <nav
      className="sticky top-0 z-50 w-full glass-card border-0 border-b"
      style={{ borderColor: "var(--glass-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Brain className="w-7 h-7 neon-text-cyan" />
            <div
              className="absolute inset-0 blur-md"
              style={{ background: "oklch(0.78 0.12 210 / 0.4)" }}
            />
          </div>
          <span
            className="font-bold text-sm sm:text-base tracking-wider uppercase hidden sm:block"
            style={{ letterSpacing: "0.12em" }}
          >
            <span className="neon-text-cyan">MULTIMODAL</span>{" "}
            <span className="text-foreground/80">FOOD INTELLIGENCE</span>
          </span>
          <span className="font-bold text-sm tracking-wider uppercase sm:hidden">
            <span className="neon-text-cyan">MFIS</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              data-ocid={`nav.${link.id}.link`}
              onClick={() => onTabChange(link.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                activeTab === link.id
                  ? "neon-text-cyan bg-neon-cyan/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button
            data-ocid="nav.theme.toggle"
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-muted-foreground">
                Welcome,
              </span>
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs bg-neon-cyan/20 text-neon-cyan">
                  {shortPrincipal.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                data-ocid="nav.logout.button"
                type="button"
                variant="outline"
                size="sm"
                onClick={clear}
                className="h-7 text-xs gap-1 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              data-ocid="nav.login.button"
              type="button"
              size="sm"
              onClick={login}
              disabled={loginStatus === "logging-in"}
              className="h-7 text-xs bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30"
              variant="outline"
            >
              {loginStatus === "logging-in" ? "Connecting..." : "Sign In"}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
