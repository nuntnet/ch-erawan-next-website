# AEO Prompt Panel (manual)

วัดว่า AI แนะนำ/กล่าวถึง ช.เอราวัณ จริงหรือไม่ — รันทุกเดือน ชุดคำถามเดิม (`prompts.csv`) เพื่อเทียบแนวโน้ม

## วิธีรัน (1–2 ชม./เดือน)
1. คัดลอก `results-TEMPLATE.csv` เป็น `results-YYYY-MM.csv` (ลบแถวตัวอย่าง)
2. ทุก platform (chatgpt, gemini, perplexity, copilot, claude, google_ai) × ทุก prompt_id: เปิดแชตใหม่ (ไม่ login ถ้าทำได้ / ปิด memory) พิมพ์ prompt ตรงตัว ห้ามแก้
3. กรอก 1 แถวต่อ (platform, prompt_id):
   - `mentioned`: ตอบพูดถึงชื่อ ช.เอราวัณ / สาขาของเรา = yes
   - `recommended`: ถูกแนะนำเป็นตัวเลือก (ไม่ใช่แค่ถูกกล่าวถึง) = yes
   - `cited_our_site`: ลิงก์อ้างอิงเป็น ch-erawan.com = yes
   - `info_accurate`: yes / no / na (ไม่ถูกกล่าวถึง) — ถ้า no ให้ระบุสิ่งที่ผิดใน notes เพื่อแก้ที่ต้นทาง
   - `competitors`: ชื่อที่ถูกแนะนำแทน คั่นด้วย `;`
4. สรุปผล:
   `python3 scripts/aeo/aeo_panel_summary.py scripts/aeo/results-2026-11.csv --prev data/aeo/results-2026-10.csv`

## กติกา
- ผลของ AI ไม่คงที่ — ดูแนวโน้มรายเดือน ไม่ใช้ผลครั้งเดียว
- ห้ามเปลี่ยนข้อความ prompt ระหว่างเดือน (เพิ่มข้อใหม่ได้ แต่ต้องใช้ prompt_id ใหม่)
- วันที่ผลที่รันก่อนเริ่มงานแก้เนื้อหา = baseline
