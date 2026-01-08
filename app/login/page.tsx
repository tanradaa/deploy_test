"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { getUsers } from "@/lib/api/users";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const users = await getUsers();

      const user = users.find(
        (u: any) => u.email === email && u.password === password
      );

      if (!user) {
        setError("Invalid email or password");
        return;
      }

      if (user.status !== "active") {
        setError("Your account is inactive");
        return;
      }

      // เก็บ user ไว้ (mock)
      localStorage.setItem("user", JSON.stringify(user));

      // redirect ตาม role
      switch (user.role) {
        case "admin":
        case "manager":
        case "viewer":
          router.push("/dashboard");
          break;
        default:
          router.push("/login");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative text-gray-800 overflow-hidden">
      {/* Concentric Squares - Light Pattern (bg) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 5px,
              rgba(75, 85, 99, 0.06) 5px,
              rgba(75, 85, 99, 0.06) 6px,
              transparent 6px,
              transparent 15px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 5px,
              rgba(75, 85, 99, 0.06) 5px,
              rgba(75, 85, 99, 0.06) 6px,
              transparent 6px,
              transparent 15px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 10px,
              rgba(107, 114, 128, 0.04) 10px,
              rgba(107, 114, 128, 0.04) 11px,
              transparent 11px,
              transparent 30px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 10px,
              rgba(107, 114, 128, 0.04) 10px,
              rgba(107, 114, 128, 0.04) 11px,
              transparent 11px,
              transparent 30px
            )
          `,
        }}
      />

      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logo-wipay.svg"
              alt="WiPay Logo"
              width={180}
              height={60}
              priority
            />
          </div>

          <p className="text-center text-sm text-gray-500 mb-6">
            Welcome back! Please sign in to your account.
          </p>

          {/* login test */}
          {/* admin:
            john.doe_1@test.com
            password123

            manager:
            alice.smith_1@test.com
            password123

            viewer:
            bob.marley_1@test.com
            password123

            inactive:
            emma.watson_1@test.com
            password123 */}

          {/* Email */}
          <label className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <div className="relative mb-4">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#DDAD51] focus:outline-none"
              placeholder="Enter your email address"
            />
          </div>

          {/* Password */}
          <label className="block text-sm font-medium mb-1">Password</label>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#DDAD51] focus:outline-none"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 mb-4 text-center">{error}</p>
          )}

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#DDAD51] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
