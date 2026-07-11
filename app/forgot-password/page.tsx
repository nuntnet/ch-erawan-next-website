"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import CompanyLogo from "@/components/CompanyLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setLoading(false);
    // Always show the same message, regardless of whether the email exists —
    // avoids leaking which addresses are registered admins.
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <CompanyLogo height={56} priority className="h-14 w-auto mb-3" />
          <h1 className="text-xl font-bold text-[#0F172A]">ลืมรหัสผ่าน</h1>
          <p className="text-sm text-gray-500 mt-1">กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          {sent ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว
                กรุณาตรวจสอบกล่องจดหมาย (ลิงก์มีอายุ 1 ชั่วโมง)
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-gray-600 text-sm">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ch-erawan.com"
                  className="mt-1.5"
                  required
                  autoComplete="email"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F172A] hover:bg-[#1a2a50] text-white font-semibold h-11"
              >
                {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
