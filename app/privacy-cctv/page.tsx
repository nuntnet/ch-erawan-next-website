export default function PrivacyCCTV() {
  return (
    <div className="min-h-screen bg-white pt-[68px]">
      {/* Header */}
      <div className="bg-[#131F3C]">
        <div className="container py-12">
          <p className="text-white/40 text-sm font-medium tracking-wider uppercase mb-2">Legal</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">นโยบายคุ้มครองข้อมูลส่วนบุคคลสำหรับ CCTV</h1>
          <p className="text-white/50 text-sm">มีผลบังคับใช้ตั้งแต่วันที่ 1 มิถุนายน 2565 | ปรับปรุงล่าสุด 1 มกราคม 2567</p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-4xl">
        <div className="space-y-8 text-[#374151]">

          <section>
            <p className="text-sm text-gray-500 mb-6">
              กลุ่มบริษัท ช.เอราวัณ ออโต้ กรุป ("บริษัท") ได้ติดตั้งกล้องวงจรปิด (CCTV) ภายในและบริเวณรอบ ๆ
              สถานประกอบการของบริษัท เพื่อความปลอดภัยของทรัพย์สิน พนักงาน ลูกค้า และบุคคลที่เกี่ยวข้อง
              นโยบายนี้อธิบายถึงวิธีการที่บริษัทเก็บรวบรวม ใช้ และปกป้องข้อมูลจาก CCTV
              ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            </p>
          </section>

          <CCTVSection title="1. ผู้ควบคุมข้อมูลส่วนบุคคล">
            <p>กลุ่มบริษัท ช.เอราวัณ ออโต้ กรุป</p>
            <p>75/2 หมู่ 1 ต.ธรรมศาลา อ.เมือง จ.นครปฐม 73000</p>
            <p>โทรศัพท์: 034-305-500 | อีเมล: info@ch-erawan.com</p>
          </CCTVSection>

          <CCTVSection title="2. ขอบเขตและพื้นที่ติดตั้ง CCTV">
            <p>บริษัทได้ติดตั้ง CCTV ในบริเวณต่าง ๆ ดังนี้</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>โชว์รูมและพื้นที่แสดงรถยนต์ทุกสาขา</li>
              <li>ศูนย์บริการและอู่ซ่อมบำรุง</li>
              <li>ทางเข้า-ออก อาคารสำนักงาน และที่จอดรถ</li>
              <li>บริเวณโดยรอบสถานประกอบการ</li>
              <li>ห้องรับรองลูกค้าและพื้นที่สาธารณะภายในอาคาร</li>
            </ul>
            <p className="mt-3 text-sm bg-amber-50 border border-amber-200 rounded-lg p-4">
              <strong>หมายเหตุ:</strong> บริษัทจะติดป้ายแจ้งเตือนที่ชัดเจนในบริเวณที่มีการติดตั้ง CCTV
              เพื่อให้ท่านทราบก่อนเข้าพื้นที่
            </p>
          </CCTVSection>

          <CCTVSection title="3. วัตถุประสงค์การใช้ข้อมูล CCTV">
            <p>บริษัทใช้ข้อมูลจาก CCTV เพื่อวัตถุประสงค์ดังต่อไปนี้เท่านั้น</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>ความปลอดภัย:</strong> ป้องกันและตรวจจับการโจรกรรม การบุกรุก หรือกิจกรรมที่ผิดกฎหมาย</li>
              <li><strong>การปกป้องทรัพย์สิน:</strong> ดูแลรักษาความปลอดภัยของรถยนต์ อุปกรณ์ และทรัพย์สิน</li>
              <li><strong>ความปลอดภัยของบุคคล:</strong> ปกป้องพนักงาน ลูกค้า และผู้เยี่ยมชม</li>
              <li><strong>การสืบสวนเหตุการณ์:</strong> ใช้เป็นหลักฐานในกรณีที่เกิดเหตุการณ์หรือข้อพิพาท</li>
              <li><strong>การปฏิบัติตามกฎหมาย:</strong> สนับสนุนหน่วยงานบังคับใช้กฎหมายเมื่อได้รับการร้องขอตามกฎหมาย</li>
            </ul>
          </CCTVSection>

          <CCTVSection title="4. ฐานทางกฎหมายในการประมวลผล">
            <p>บริษัทประมวลผลข้อมูล CCTV โดยอาศัยฐานทางกฎหมาย ดังนี้</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>ประโยชน์โดยชอบด้วยกฎหมาย (Legitimate Interests):</strong> การดูแลความปลอดภัยของสถานที่และทรัพย์สิน</li>
              <li><strong>การปฏิบัติตามกฎหมาย (Legal Obligation):</strong> เมื่อได้รับคำสั่งจากหน่วยงานรัฐหรือกฎหมายกำหนด</li>
              <li><strong>การปกป้องผลประโยชน์สำคัญ (Vital Interests):</strong> เพื่อปกป้องชีวิตและความปลอดภัยของบุคคล</li>
            </ul>
          </CCTVSection>

          <CCTVSection title="5. ระยะเวลาการเก็บรักษาภาพ">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-[#131F3C] mb-2">ระยะเวลาทั่วไป</p>
                  <p>บันทึกภาพจะถูกเก็บไว้ <strong>ไม่เกิน 30 วัน</strong> นับจากวันที่บันทึก จากนั้นจะถูกลบทับโดยอัตโนมัติ</p>
                </div>
                <div>
                  <p className="font-semibold text-[#131F3C] mb-2">กรณีพิเศษ</p>
                  <p>หากมีเหตุการณ์หรือข้อพิพาทที่ต้องสืบสวน บริษัทอาจเก็บภาพไว้นานกว่านี้ตามความจำเป็นทางกฎหมาย</p>
                </div>
              </div>
            </div>
          </CCTVSection>

          <CCTVSection title="6. การเข้าถึงและการเปิดเผยข้อมูล">
            <p>การเข้าถึงภาพ CCTV ถูกจำกัดเฉพาะบุคคลที่ได้รับอนุญาต ได้แก่</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>ผู้บริหารและเจ้าหน้าที่รักษาความปลอดภัยที่ได้รับมอบหมาย</li>
              <li>เจ้าหน้าที่ฝ่าย IT ที่รับผิดชอบระบบ CCTV</li>
              <li>เจ้าหน้าที่ตำรวจหรือหน่วยงานบังคับใช้กฎหมาย เมื่อมีคำร้องขอตามกฎหมาย</li>
              <li>ทนายความหรือที่ปรึกษากฎหมายของบริษัท เมื่อจำเป็นต้องใช้เป็นหลักฐาน</li>
            </ul>
            <p className="mt-3">
              บริษัทจะไม่ขาย เช่า หรือเปิดเผยภาพ CCTV แก่บุคคลภายนอกโดยไม่มีเหตุผลอันชอบด้วยกฎหมาย
            </p>
          </CCTVSection>

          <CCTVSection title="7. มาตรการรักษาความปลอดภัย">
            <p>บริษัทได้ดำเนินมาตรการรักษาความปลอดภัยของระบบ CCTV ดังนี้</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>จำกัดสิทธิ์การเข้าถึงระบบด้วยรหัสผ่านและการยืนยันตัวตน</li>
              <li>เก็บบันทึกภาพในระบบที่ปลอดภัยพร้อมการเข้ารหัสข้อมูล</li>
              <li>บันทึกประวัติการเข้าถึงระบบ (Access Log)</li>
              <li>ทบทวนและอัปเดตมาตรการความปลอดภัยอย่างสม่ำเสมอ</li>
            </ul>
          </CCTVSection>

          <CCTVSection title="8. สิทธิของเจ้าของข้อมูล">
            <p>ท่านมีสิทธิดังต่อไปนี้เกี่ยวกับข้อมูล CCTV ของท่าน</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>สิทธิในการเข้าถึง:</strong> ท่านสามารถขอดูหรือรับสำเนาภาพที่เกี่ยวข้องกับท่านได้ (อาจต้องยืนยันตัวตน)</li>
              <li><strong>สิทธิในการลบ:</strong> ท่านสามารถขอให้ลบภาพของท่าน เว้นแต่มีเหตุผลทางกฎหมายที่ต้องเก็บไว้</li>
              <li><strong>สิทธิในการคัดค้าน:</strong> ท่านสามารถคัดค้านการประมวลผลในกรณีที่ไม่มีเหตุผลอันสมควร</li>
            </ul>
            <p className="mt-3 text-sm">
              การขอใช้สิทธิต้องยื่นคำร้องเป็นลายลักษณ์อักษรพร้อมแนบสำเนาบัตรประชาชน
              บริษัทจะตอบกลับภายใน 30 วัน
            </p>
          </CCTVSection>

          <CCTVSection title="9. การติดต่อสอบถาม">
            <div className="bg-gray-50 rounded-xl p-5 text-sm space-y-1">
              <p><strong>เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)</strong></p>
              <p>กลุ่มบริษัท ช.เอราวัณ ออโต้ กรุป</p>
              <p>75/2 หมู่ 1 ต.ธรรมศาลา อ.เมือง จ.นครปฐม 73000</p>
              <p>โทรศัพท์: 034-305-500</p>
              <p>อีเมล: info@ch-erawan.com</p>
            </div>
          </CCTVSection>

        </div>
      </div>
    </div>
  );
}

function CCTVSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#131F3C] mb-3 pb-2 border-b border-gray-100">{title}</h2>
      <div className="text-sm text-[#4B5563] space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
