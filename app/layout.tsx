"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import { useEffect, useState } from "react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarNav } from "./components/SidebarNav";
import Image from "next/image";
import Link from "next/link";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [pathname]);

  // map role → label
  const roleLabel =
    user?.role === "admin"
      ? "Merchant Owner"
      : user?.role === "manager"
      ? "Manager"
      : "Viewer";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {isLoginPage ? (
          // login layout ไม่มี sidebar
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {children}
          </div>
        ) : (
          // main layout
          <SidebarProvider>
            <Sidebar>
              <SidebarHeader className="px-3 m-6">
                <Image
                  src="/logo-wipay.svg"
                  alt="WiPay Logo"
                  width={200}
                  height={64}
                />
              </SidebarHeader>

              <SidebarContent className="px-6">
                <SidebarNav />
              </SidebarContent>

              <SidebarFooter className="p-3 mb-4">
                {user && (
                  <Link href="/profile" className="block">
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition">
                      {/* Avatar */}
                      <Image
                        src={user.avatar}
                        alt={`${user.first_name} avatar`}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />

                      {/* Name + Role */}
                      <div className="leading-tight">
                        <p className="font-medium text-gray-900 text-sm">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{roleLabel}</p>
                      </div>
                    </div>
                  </Link>
                )}
              </SidebarFooter>
            </Sidebar>

            <SidebarInset>
              <div className="p-3 flex items-center gap-2">
                <SidebarTrigger />
              </div>

              <main className="p-5">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        )}
      </body>
    </html>
  );
}
