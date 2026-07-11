"use client";

import { useRef, useState, useCallback } from "react";
import { ImagePlus, Loader2, X, GripVertical, MoveLeft, MoveRight } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
}

export default function ImageUploader({
  value,
  onChange,
  multiple = false,
  label = "อัปโหลดรูปภาพ",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "อัปโหลดไม่สำเร็จ");
        uploaded.push(json.url);
        if (!multiple) break;
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded.slice(0, 1));
      toast.success("อัปโหลดรูปสำเร็จ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const moveLeft = (idx: number) => {
    if (idx === 0) return;
    const next = [...value];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveRight = (idx: number) => {
    if (idx === value.length - 1) return;
    const next = [...value];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  // Drag-to-reorder handlers
  const handleDragStart = useCallback((idx: number) => {
    setDraggingIdx(idx);
  }, []);

  const handleDragEnterImg = useCallback((idx: number) => {
    setDragOverIdx(idx);
  }, []);

  const handleDragEndImg = useCallback(() => {
    if (draggingIdx !== null && dragOverIdx !== null && draggingIdx !== dragOverIdx) {
      const next = [...value];
      const [moved] = next.splice(draggingIdx, 1);
      next.splice(dragOverIdx, 0, moved);
      onChange(next);
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  }, [draggingIdx, dragOverIdx, value, onChange]);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {value.length > 1 && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              ลากเพื่อเรียงลำดับ · รูปแรก = ภาพหลัก
            </span>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnterImg(idx)}
              onDragEnd={handleDragEndImg}
              onDragOver={(e) => e.preventDefault()}
              className={`relative group cursor-grab active:cursor-grabbing transition-all ${
                draggingIdx === idx ? "opacity-40 scale-95" : ""
              } ${dragOverIdx === idx && draggingIdx !== idx ? "ring-2 ring-[#0F172A] rounded-lg" : ""}`}
            >
              {/* Position badge */}
              <span className={`absolute top-1 left-1 z-10 text-[9px] font-bold px-1 rounded ${idx === 0 ? "bg-[#0F172A] text-white" : "bg-black/40 text-white"}`}>
                {idx + 1}
              </span>

              {/* Drag handle */}
              <div className="absolute top-1 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3.5 h-3.5 text-white drop-shadow" />
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`รูปที่ ${idx + 1}`}
                className="w-28 h-20 object-cover rounded-lg border border-gray-200"
              />

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity z-20"
                aria-label="ลบรูป"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Arrow buttons for reordering (alternative to drag) */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent rounded-b-lg px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => moveLeft(idx)}
                  disabled={idx === 0}
                  className="p-0.5 text-white disabled:opacity-30 hover:scale-110 transition-transform"
                  title="เลื่อนซ้าย"
                >
                  <MoveLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRight(idx)}
                  disabled={idx === value.length - 1}
                  className="p-0.5 text-white disabled:opacity-30 hover:scale-110 transition-transform"
                  title="เลื่อนขวา"
                >
                  <MoveRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(multiple || value.length === 0) && (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl py-6 px-4 cursor-pointer transition-colors ${
            dragOver
              ? "border-[#0F172A] bg-[#0F172A]/5"
              : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <ImagePlus className="w-5 h-5 text-gray-400" />
          )}
          <p className="text-xs text-gray-500">
            {uploading ? "กำลังอัปโหลด..." : "คลิกหรือลากไฟล์มาวาง (JPG/PNG/WEBP, ≤5MB)"}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
    </div>
  );
}
