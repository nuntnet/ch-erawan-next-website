"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import CompanyLogo from "@/components/CompanyLogo";

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidToken = searchParams.get("error") === "INVALID_TOKEN";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("ลิงก์ไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`รหัสผ่านใหม่ต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message ?? "ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <CompanyLogo height={56} priority className="h-14 w-auto mb-3" />
          <h1 className="text-xl font-bold text-[#0F172A]">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-gray-500 mt-1">กรอกรหัสผ่านใหม่ของคุณ</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          {invalidToken || !token ? (
            <div className="text-center py-2">
              <p className="text-sm text-red-600 mb-4">ลิงก์หมดอายุหรือไม่ถูกต้อง</p>
              <Link href="/forgot-password" className="text-sm text-[#0F172A] underline">
                ขอลิงก์ใหม่อีกครั้ง
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-2">
              <p className="text-sm text-green-700">ตั้งรหัสผ่านใหม่สำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}
              <div>
                <Label htmlFor="new-password" className="text-gray-600 text-sm">รหัสผ่านใหม่</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5"
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-gray-600 text-sm">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5"
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F172A] hover:bg-[#1a2a50] text-white font-semibold h-11"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
                </span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
