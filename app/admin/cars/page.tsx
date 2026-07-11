"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car as CarIcon, Pencil, Plus, Search, Trash2, GripVertical, ArrowUpDown, Check, Loader2 } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Car as CarType } from "@/lib/notion-types";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// CarForm modal removed — form is now at /admin/cars/new and /admin/cars/[id]/edit

// ── Sortable row ────────────────────────────────────────────
function SortableRow({ car, children }: { car: CarType; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: car.id });
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`border-b border-gray-50 bg-white ${isDragging ? "shadow-lg" : ""}`}
    >
      <td className="w-8 px-2 py-3 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 text-gray-300 hover:text-gray-500" />
      </td>
      {children}
    </tr>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function AdminCarsPage() {
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortMode, setSortMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deleting, setDeleting] = useState<CarType | null>(null);
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchCars = () => {
    setLoading(true);
    fetch("/api/admin/cars")
      .then((r) => r.json())
      .then((data) => setCars(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCars((prev) => {
      const oldIdx = prev.findIndex((c) => c.id === active.id);
      const newIdx = prev.findIndex((c) => c.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const items = cars.map((c, i) => ({ id: c.id, sortOrder: i + 1 }));
      const res = await fetch("/api/admin/cars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error();
      setCars(prev => prev.map((c, i) => ({ ...c, sortOrder: i + 1 })));
      toast.success("บันทึกลำดับแล้ว");
      setSortMode(false);
    } catch {
      toast.error("บันทึกลำดับไม่สำเร็จ");
    } finally {
      setSavingOrder(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const toggleFlag = async (
    car: CarType,
    flag: "isActive" | "isBestSeller" | "navFeatured" | "navNew",
    value: boolean
  ) => {
    setBusyId(car.id);
    setCars((prev) => prev.map((c) => (c.id === car.id ? { ...c, [flag]: value } : c)));
    try {
      const res = await fetch("/api/admin/cars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: car.id, flags: { [flag]: value } }),
      });
      if (!res.ok) throw new Error();
      toast.success("อัปเดตสำเร็จ");
    } catch {
      setCars((prev) => prev.map((c) => (c.id === car.id ? { ...c, [flag]: !value } : c)));
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    setDeleting(null);
    try {
      const res = await fetch(`/api/admin/cars?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCars((prev) => prev.filter((c) => c.id !== id));
      toast.success("ลบรถสำเร็จ");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const filtered = sortMode
    ? cars // in sort mode show all, no filter
    : cars.filter((c) => {
        const q = search.toLowerCase();
        const matchSearch = !q || c.name.toLowerCase().includes(q) || c.model.toLowerCase().includes(q) || c.brand.toLowerCase().includes(q);
        const matchBrand = brandFilter === "all" || c.brand === brandFilter;
        return matchSearch && matchBrand;
      });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">รถยนต์</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cars.length} รุ่น</p>
        </div>
        <div className="flex items-center gap-2">
          {sortMode ? (
            <>
              <button onClick={() => { setSortMode(false); fetchCars(); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={saveOrder} disabled={savingOrder}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50">
                {savingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                บันทึกลำดับ
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setSortMode(true)}
                className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                <ArrowUpDown className="w-4 h-4" />
                เรียงลำดับ
              </button>
              <button
                onClick={() => router.push("/admin/cars/new")}
                className="flex items-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1a2a50] transition-colors">
                <Plus className="w-4 h-4" />
                เพิ่มรถ
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters — hidden in sort mode */}
      {!sortMode && (
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ / รุ่น / แบรนด์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 w-64"
            />
          </div>
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none">
            <option value="all">ทุกแบรนด์</option>
            {["Mazda","Ford","Mitsubishi","GWM","Deepal","Kia"].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} รุ่น</span>
        </div>
      )}

      {sortMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
          <GripVertical className="w-4 h-4 shrink-0" />
          ลาก-วางเพื่อเรียงลำดับ แล้วกด "บันทึกลำดับ" — รถที่อยู่บนสุดจะแสดงก่อนในทุกหน้า
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <CarIcon className="w-10 h-10" />
            <p className="text-sm">ยังไม่มีรถยนต์ในระบบ</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {sortMode && <th className="w-8 px-2 py-3" />}
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">รถยนต์</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-24">แบรนด์</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-36">ราคา (เริ่มต้น)</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-3 py-3 uppercase tracking-wider w-20" title="แสดง/ซ่อนรถบนเว็บไซต์">เผยแพร่</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-3 py-3 uppercase tracking-wider w-20" title="แสดงหน้า Home + badge ขายดี บนหน้า /cars">
                  <span className="flex flex-col items-center gap-0.5">
                    <span>ขายดี</span>
                    <span className="text-[9px] text-orange-400 font-normal normal-case">Home</span>
                  </span>
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 px-2 py-3 uppercase tracking-wider w-20" title="แสดงใน Mega Nav + badge แนะนำ บนหน้า /cars">
                  <span className="flex flex-col items-center gap-0.5">
                    <span>แนะนำ</span>
                    <span className="text-[9px] text-blue-400 font-normal normal-case">mega nav</span>
                  </span>
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 px-2 py-3 uppercase tracking-wider w-16" title="แสดงใน Mega Nav + badge ใหม่ บนหน้า /cars">
                  <span className="flex flex-col items-center gap-0.5">
                    <span>ใหม่</span>
                    <span className="text-[9px] text-blue-400 font-normal normal-case">mega nav</span>
                  </span>
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-28">จัดการ</th>
              </tr>
            </thead>
            <SortableContext items={filtered.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((car) => sortMode ? (
                <SortableRow key={car.id} car={car}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {car.imageUrls[0]
                        ? <img src={car.imageUrls[0]} alt="" className="w-12 h-9 object-cover rounded-lg bg-gray-100 shrink-0" />
                        : <div className="w-12 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0"><CarIcon className="w-4 h-4 text-gray-300" /></div>}
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{car.model || car.name}</p>
                        <p className="text-xs text-gray-400">{car.brand} · {car.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{car.brand}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">฿{car.priceMin.toLocaleString()}</td>
                  <td colSpan={4} className="px-5 py-4 text-xs text-gray-400 italic">ลากเพื่อเรียงลำดับ</td>
                </SortableRow>
              ) : (
                <tr key={car.id} className={`hover:bg-gray-50/50 transition-colors ${!car.isActive ? "opacity-50" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {car.imageUrls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={car.imageUrls[0]} alt="" className="w-12 h-9 object-cover rounded-lg bg-gray-100 shrink-0" />
                      ) : (
                        <div className="w-12 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <CarIcon className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                      <div>
                        <Link href={`/cars/${car.slug || car.id}`} target="_blank" className="text-sm font-medium text-[#0F172A] hover:underline">
                          {car.model || car.name}
                        </Link>
                        <p className="text-xs text-gray-400">{car.year} · {car.condition === "new" ? "รถใหม่" : "รถมือสอง"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">{car.brand}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-[#0F172A]">฿{car.priceMin.toLocaleString()}</td>
                  <td className="px-3 py-4 text-center">
                    <Switch
                      checked={car.isActive}
                      disabled={busyId === car.id}
                      onCheckedChange={(v) => toggleFlag(car, "isActive", v)}
                    />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <Switch
                      checked={car.isBestSeller}
                      disabled={busyId === car.id}
                      onCheckedChange={(v) => toggleFlag(car, "isBestSeller", v)}
                    />
                  </td>
                  <td className="px-2 py-4 text-center">
                    <Switch
                      checked={car.navFeatured}
                      disabled={busyId === car.id}
                      onCheckedChange={(v) => toggleFlag(car, "navFeatured", v)}
                    />
                  </td>
                  <td className="px-2 py-4 text-center">
                    <Switch
                      checked={car.navNew}
                      disabled={busyId === car.id}
                      onCheckedChange={(v) => toggleFlag(car, "navNew", v)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/admin/cars/${car.id}/edit`)}
                        className="p-2 text-gray-500 hover:text-[#0F172A] hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="แก้ไข"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(car)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </SortableContext>
          </table>
          </DndContext>
        )}
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรถ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ &ldquo;{deleting?.model || deleting?.name}&rdquo; ออกจากระบบหรือไม่?
              รถจะถูกซ่อนจากหน้าเว็บ (สามารถกู้คืนได้ใน Notion)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
