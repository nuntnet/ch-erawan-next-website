"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const branches = [
  "มาสด้า ช.เอราวัณ นครปฐม",
  "มาสด้า ช.เอราวัณ ศาลายา",
  "Deepal ช.เอราวัณ ศาลายา",
  "ฟอร์ด ช.เอราวัณ อ้อมใหญ่",
  "ฟอร์ด ช.เอราวัณ นครปฐม",
  "มิตซูบิชิ ช.เอราวัณ นครปฐม",
  "GWM ช.เอราวัณ นครปฐม",
  "Kia ช.เอราวัณ นครปฐม",
];

const emptyForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  carModel: "",
  branch: "",
  vehicleRegistration: "",
  coverageType: "",
  notes: "",
};

export default function InsuranceQuoteForm() {
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone) {
      toast.error("กรุณากรอกชื่อและเบอร์โทรศัพท์");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/submit/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "insurance_quote" }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-[#0F172A] mb-2">ส่งคำขอสำเร็จ!</h3>
        <p className="text-gray-500 mb-6">ทีมงานจะติดต่อกลับพร้อมใบเสนอราคาภายใน 24 ชั่วโมง</p>
        <Button
          onClick={() => { setSubmitted(false); setForm({ ...emptyForm }); }}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white"
        >
          ขอเสนอราคาอีกครั้ง
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ins-name" className="text-gray-600 text-sm">ชื่อ-นามสกุล *</Label>
          <Input id="ins-name" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="กรอกชื่อ-นามสกุล" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" required />
        </div>
        <div>
          <Label htmlFor="ins-phone" className="text-gray-600 text-sm">เบอร์โทรศัพท์ *</Label>
          <Input id="ins-phone" type="tel" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="0xx-xxx-xxxx" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" required />
        </div>
      </div>

      <div>
        <Label htmlFor="ins-email" className="text-gray-600 text-sm">อีเมล (ไม่บังคับ)</Label>
        <Input id="ins-email" type="email" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="email@example.com" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ins-car" className="text-gray-600 text-sm">ยี่ห้อ / รุ่นรถ</Label>
          <Input id="ins-car" value={form.carModel} onChange={e => setForm(f => ({ ...f, carModel: e.target.value }))} placeholder="เช่น Mazda CX-5" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" />
        </div>
        <div>
          <Label htmlFor="ins-reg" className="text-gray-600 text-sm">ทะเบียนรถ</Label>
          <Input id="ins-reg" value={form.vehicleRegistration} onChange={e => setForm(f => ({ ...f, vehicleRegistration: e.target.value }))} placeholder="เช่น กก 1234 นครปฐม" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-600 text-sm">ประเภทความคุ้มครอง</Label>
          <Select value={form.coverageType} onValueChange={v => setForm(f => ({ ...f, coverageType: v }))}>
            <SelectTrigger className="mt-1.5 border-gray-200"><SelectValue placeholder="เลือกประเภท" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="type1">ชั้น 1</SelectItem>
              <SelectItem value="type2">ชั้น 2</SelectItem>
              <SelectItem value="type2plus">ชั้น 2+</SelectItem>
              <SelectItem value="type3">ชั้น 3</SelectItem>
              <SelectItem value="type3plus">ชั้น 3+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-600 text-sm">สาขา</Label>
          <Select value={form.branch} onValueChange={v => setForm(f => ({ ...f, branch: v }))}>
            <SelectTrigger className="mt-1.5 border-gray-200"><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
            <SelectContent>{branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="ins-notes" className="text-gray-600 text-sm">หมายเหตุเพิ่มเติม</Label>
        <Textarea id="ins-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ข้อมูลเพิ่มเติม เช่น ประกันเดิมหมดเมื่อไหร่" className="mt-1.5 border-gray-200 focus:border-[#0F172A]" rows={3} />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold py-3 text-base h-12"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            กำลังส่งข้อมูล...
          </span>
        ) : "ขอใบเสนอราคา"}
      </Button>
    </form>
  );
}
