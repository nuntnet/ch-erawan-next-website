import { NextRequest, NextResponse } from "next/server";

// Service appointment windows — SPS itself returns hourly slots, but we book
// customers into 2-hour windows instead (fewer, coarser options).
const WINDOWS = [
  { start: "08:00", end: "10:00" },
  { start: "10:00", end: "12:00" },
  { start: "13:00", end: "15:00" },
  { start: "15:00", end: "17:00" },
];

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Groups SPS's raw hourly {time, available} slots into the fixed windows above. */
function aggregateToWindows(rawSlots: { time: string; available: boolean }[]) {
  return WINDOWS.map((w) => {
    const startMin = toMinutes(w.start);
    const endMin = toMinutes(w.end);
    const contained = rawSlots.filter((s) => {
      const t = toMinutes(s.time);
      return t >= startMin && t < endMin;
    });
    // No matching raw slots for this window → nothing says it's full, so
    // default to available rather than hiding the option outright.
    const available = contained.length === 0 ? true : contained.some((s) => s.available);
    return { time: `${w.start}-${w.end}`, available };
  });
}

const BRANCH_SPS_ID: Record<string, string> = {
  "มาสด้า ช.เอราวัณ นครปฐม": "1",
  "มาสด้า ช.เอราวัณ ศาลายา": "2",
  "ฟอร์ด ช.เอราวัณ อ้อมใหญ่": "3",
  "มิตซูบิชิ ช.เอราวัณ นครปฐม": "4",
  "GWM ช.เอราวัณ นครปฐม": "7",
  "Deepal ช.เอราวัณ ศาลายา": "8",
  "Kia ช.เอราวัณ นครปฐม": "9",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branch = searchParams.get("branch");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!branch || !BRANCH_SPS_ID[branch]) {
    return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const branchId = BRANCH_SPS_ID[branch];
  const spsBaseUrl = process.env.SPS_BASE_URL;
  const spsApiKey = process.env.SPS_API_KEY;

  if (!spsBaseUrl || !spsApiKey) {
    return NextResponse.json({ error: "SPS not configured" }, { status: 503 });
  }

  try {
    const url = `${spsBaseUrl}/public_slots.php?branch_id=${branchId}&date=${date}&api_key=${spsApiKey}`;
    // Slot availability changes with every booking, so this must never be cached.
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const text = await res.text();
      console.error("[api/slots] SPS returned non-ok status", res.status, text.slice(0, 300));
      return NextResponse.json({ error: "SPS unavailable" }, { status: 502 });
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data.slots)) {
        data.slots = aggregateToWindows(data.slots);
      }
      return NextResponse.json(data);
    } catch (parseErr) {
      console.error("[api/slots] SPS response was not valid JSON", text.slice(0, 300));
      throw parseErr;
    }
  } catch (err) {
    console.error("[api/slots] fetch to SPS failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 502 });
  }
}
