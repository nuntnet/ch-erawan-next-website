"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { branches as branchList } from "@/lib/branchData";
import { sanitizePhone, isValidPhone, isValidEmail, PHONE_ERROR, EMAIL_ERROR } from "@/lib/form-validation";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", branch: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) { toast.error("กรุณากรอกชื่อและข้อความ"); return; }
    if (form.phone && !isValidPhone(form.phone)) { toast.error(PHONE_ERROR); return; }
    if (form.email && !isValidEmail(form.email)) { toast.error(EMAIL_ERROR); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/submit/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
      {/* Header */}
      <div className="relative bg-[#0F172A] text-white py-16 lg:py-20 overflow-hidden">
        <Image
          src="https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/ch-erawan/pages/contact-1"
          alt=""
          fill
          className="object-cover object-center opacity-25"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/80 to-[#0F172A]/40" />
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <p className="text-white/65 text-sm font-medium tracking-wider uppercase mb-3">Contact</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">ติดต่อเรา</h1>
            <p className="text-white/50 text-base lg:text-lg">ทีมงานพร้อมให้บริการและตอบคำถามทุกข้อสงสัย</p>
          </div>
        </div>
      </div>

      <div className="container py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-800 mb-2">ส่งข้อความสำเร็จ!</h3>
                <p className="text-green-600 mb-6">ทีมงานจะติดต่อกลับภายใน 1 วันทำการ</p>
                <Button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "", branch: "" }); }}
                  className="bg-[#0F172A] text-white hover:bg-[#1E293B]">
                  ส่งข้อความใหม่
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#0F172A]">ส่งข้อความถึงเรา</h2>
                    <p className="text-sm text-gray-400">เราจะตอบกลับภายใน 1 วันทำการ</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-600 text-sm">ชื่อ-นามสกุล *</Label>
                      <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="กรอกชื่อ-นามสกุล" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" required />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-600 text-sm">เบอร์โทรศัพท์</Label>
                      <Input id="phone" type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: sanitizePhone(e.target.value) }))} placeholder="0xx-xxx-xxxx" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-600 text-sm">อีเมล</Label>
                    <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" />
                  </div>

                  <div>
                    <Label className="text-gray-600 text-sm">สาขาที่ต้องการติดต่อ</Label>
                    <Select value={form.branch} onValueChange={v => setForm(f => ({ ...f, branch: v }))}>
                      <SelectTrigger className="mt-1.5 border-gray-200"><SelectValue placeholder="เลือกสาขา (ไม่บังคับ)" /></SelectTrigger>
                      <SelectContent>{branchList.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-gray-600 text-sm">ข้อความ *</Label>
                    <Textarea id="message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="พิมพ์ข้อความหรือคำถามของคุณ..." rows={5} className="mt-1.5 border-gray-200 focus:border-[#0F172A]" required />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold h-12 text-base">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        กำลังส่ง...
                      </span>
                    ) : "ส่งข้อความ"}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Branch Info */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-[#0F172A] text-lg mb-2">สาขาของเรา</h3>
            {branchList.slice(0, 4).map((branch) => (
              <div key={branch.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="font-semibold text-[#0F172A] text-sm mb-2">{branch.name}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{branch.hours.replace(/·/g, "|")}</span>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/branches" className="block text-center text-sm text-[#0F172A] font-medium hover:underline pt-1">
              ดูสาขาทั้งหมด →
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback CTA */}
      <div className="bg-[#0F172A] py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">มีปัญหาหรืออยากแนะนำบริการ?</p>
            <p className="text-white/50 text-sm mt-0.5">ส่ง Feedback ถึงเราได้โดยตรง — ทีมงานตอบกลับใน 24 ชม.</p>
          </div>
          <Link
            href="/feedback"
            className="shrink-0 inline-flex items-center gap-2 bg-[#DD5259] hover:bg-[#c0404a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            แนะนำ–ติชม →
          </Link>
        </div>
      </div>
    </div>
  );
}
