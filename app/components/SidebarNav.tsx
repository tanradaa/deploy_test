"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, List, Monitor, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "admin" | "manager" | "viewer";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: List, label: "Transactions" },
  { href: "/terminals", icon: Monitor, label: "Terminals" },
  {
    href: "/users",
    icon: Users,
    label: "User Management",
    roles: ["admin"],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setRole(user.role);
    }
  }, []);

  return (
    <SidebarMenu className="space-y-2">
      {menuItems.map((item) => {
        // check role
        if (item.roles && !item.roles.includes(role as Role)) {
          return null;
        }

        const isActive =
          pathname === item.href ||
          (item.href === "/dashboard" && pathname === "/");

        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} className="w-full">
              <SidebarMenuButton
                className={`
                  w-full justify-start gap-2 transition-colors
                  ${
                    isActive
                      ? "bg-[#DDAD51] text-white font-semibold pointer-events-none"
                      : "hover:bg-[#DDAD51] hover:text-white"
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
