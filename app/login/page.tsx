"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import CompanyLogo from "@/components/CompanyLogo";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  no_access: "บัญชีนี้ยังไม่มีสิทธิ์เข้าถึง Admin Panel — กรุณาติดต่อผู้ดูแลระบบให้กำหนดสิทธิ์ Editor หรือ Admin",
  session_expired: "เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
  // Legacy code from before no_access/session_expired were split out — keep working for old bookmarked links.
  unauthorized: "คุณไม่มีสิทธิ์เข้าถึง Admin Panel",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    error ? (LOGIN_ERROR_MESSAGES[error] ?? "เกิดข้อผิดพลาด กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง") : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await signIn.email({ email, password });
      if (res.error) {
        setErrorMsg("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }
      router.push(callbackUrl);
    } catch {
      setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <CompanyLogo height={56} priority className="h-14 w-auto mb-3" />
          <h1 className="text-xl font-bold text-[#0F172A]">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">เข้าสู่ระบบเพื่อจัดการเว็บไซต์</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-5">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-600 text-sm">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ch-erawan.com"
                className="mt-1.5"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-600 text-sm">รหัสผ่าน</Label>
                <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-[#0F172A] transition-colors">
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F172A] hover:bg-[#1a2a50] text-white font-semibold h-11"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  เข้าสู่ระบบ
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
