import { NavLink } from "react-router-dom";
import { LayoutDashboard, PlusCircle, UserCircle2, CalendarClock, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard",  label: "Dashboard",  icon: BarChart2 },
  { to: "/my-leads",   label: "My Leads",   icon: LayoutDashboard },
  { to: "/add-lead",   label: "Add Lead",   icon: PlusCircle },
  { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { to: "/account",    label: "Account",    icon: UserCircle2 },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-background px-2 pb-3 pt-2">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-medium transition",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <IconComponent className="mb-1 h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
