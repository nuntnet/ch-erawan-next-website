"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, MessageSquare, Quote } from "lucide-react";
import { toast } from "sonner";
import type { CustomerStory } from "@/lib/notion-types";
import { sanitizePhone, isValidPhone, isValidEmail, PHONE_ERROR, EMAIL_ERROR } from "@/lib/form-validation";

export default function StoriesClient({ stories }: { stories: CustomerStory[] }) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "", customerEmail: "", customerPhone: "", story: "", carModel: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.story) { toast.error("กรุณากรอกชื่อและเรื่องราว"); return; }
    if (form.customerPhone && !isValidPhone(form.customerPhone)) { toast.error(PHONE_ERROR); return; }
    if (form.customerEmail && !isValidEmail(form.customerEmail)) { toast.error(EMAIL_ERROR); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/submit/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating }),
      });
      if (!res.ok) throw new Error("ส่งไม่สำเร็จ");
      setSubmitted(true);
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 lg:py-14">
      {/* CTA */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">มีประสบการณ์ที่ประทับใจ?</h2>
          <p className="text-white/50 text-sm">แชร์เรื่องราวของคุณเพื่อเป็นแรงบันดาลใจให้ผู้อื่น</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-[#0F172A] hover:bg-gray-100 font-semibold shrink-0"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          แชร์เรื่องราวของคุณ
        </Button>
      </div>

      {/* Submit Form */}
      {showForm && !submitted && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-10">
          <h3 className="text-xl font-bold text-[#0F172A] mb-6">แชร์ประสบการณ์ของคุณ</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">ชื่อของคุณ *</Label>
                <Input id="customerName" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="คุณสมชาย ใจดี" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="carModel">รุ่นรถที่ซื้อ / ใช้บริการ</Label>
                <Input id="carModel" value={form.carModel} onChange={e => setForm(f => ({ ...f, carModel: e.target.value }))} placeholder="Mazda CX-5 2025" className="mt-1" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerEmail">อีเมล (ไม่บังคับ)</Label>
                <Input id="customerEmail" type="email" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="example@email.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="customerPhone">เบอร์โทร (ไม่บังคับ)</Label>
                <Input id="customerPhone" type="tel" inputMode="numeric" maxLength={10} value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: sanitizePhone(e.target.value) }))} placeholder="08X-XXX-XXXX" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>ความพึงพอใจ</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                  >
                    <Star className={`w-8 h-8 transition-colors ${s <= (hoverRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="story">เรื่องราวของคุณ *</Label>
              <Textarea id="story" value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} placeholder="เล่าประสบการณ์การซื้อรถหรือใช้บริการที่ ช.เอราวัณ..." rows={5} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="bg-[#0F172A] text-white hover:bg-[#1E293B]">
              {loading ? "กำลังส่ง..." : "ส่งเรื่องราว"}
            </Button>
          </form>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-10 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-800 mb-2">ขอบคุณมากครับ/ค่ะ!</h3>
          <p className="text-green-600">เรื่องราวของคุณจะได้รับการตรวจสอบและเผยแพร่เร็วๆ นี้</p>
        </div>
      )}

      {/* Stories Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div key={story.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <Quote className="w-8 h-8 text-[#0F172A]/10 mb-3" />
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: story.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">{story.story}</p>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F172A] to-[#334155] flex items-center justify-center text-white font-bold text-sm">
                {story.customerName[0]}
              </div>
              <div>
                <p className="font-semibold text-[#0F172A] text-sm">{story.customerName}</p>
                {story.carModel && <p className="text-xs text-gray-400">{story.carModel}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
