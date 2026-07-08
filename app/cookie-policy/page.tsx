export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white pt-[68px]">
      {/* Header */}
      <div className="bg-[#131F3C]">
        <div className="container py-12">
          <p className="text-white/40 text-sm font-medium tracking-wider uppercase mb-2">Legal</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">นโยบายการใช้คุกกี้</h1>
          <p className="text-white/50 text-sm">มีผลบังคับใช้ตั้งแต่วันที่ 1 มิถุนายน 2565 | ปรับปรุงล่าสุด 1 มกราคม 2567</p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-4xl">
        <div className="space-y-8 text-[#374151]">

          <section>
            <p className="text-sm text-gray-500 mb-6">
              เว็บไซต์ www.ch-erawan.com ("เว็บไซต์") ดำเนินการโดย กลุ่มบริษัท ช.เอราวัณ กรุ๊ป ("บริษัท")
              ใช้คุกกี้และเทคโนโลยีที่คล้ายคลึงกันเพื่อให้บริการที่ดีขึ้นแก่ท่าน
              นโยบายนี้อธิบายถึงประเภทของคุกกี้ที่ใช้ วัตถุประสงค์ และวิธีที่ท่านสามารถจัดการคุกกี้เหล่านั้น
            </p>
          </section>

          <CookieSection title="1. คุกกี้คืออะไร?">
            <p>
              คุกกี้คือไฟล์ข้อความขนาดเล็กที่ถูกบันทึกลงในอุปกรณ์ของท่าน (คอมพิวเตอร์ สมาร์ทโฟน หรือแท็บเล็ต)
              เมื่อท่านเข้าชมเว็บไซต์ คุกกี้ช่วยให้เว็บไซต์จำข่าวสารเกี่ยวกับการเยี่ยมชมของท่าน
              เพื่อให้การเยี่ยมชมครั้งต่อไปง่ายขึ้นและเว็บไซต์มีประโยชน์มากขึ้น
            </p>
          </CookieSection>

          <CookieSection title="2. ประเภทคุกกี้ที่เราใช้">
            <div className="space-y-5">

              <CookieType
                name="คุกกี้ที่จำเป็น (Strictly Necessary Cookies)"
                badge="จำเป็น"
                badgeColor="bg-[#131F3C] text-white"
                canDisable={false}
                examples={["Session ID", "ข้อมูลความปลอดภัย CSRF Token", "สถานะการล็อกอิน"]}
              >
                คุกกี้เหล่านี้จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์ และไม่สามารถปิดใช้งานได้
                เนื่องจากหากปิดแล้ว เว็บไซต์จะไม่สามารถทำงานได้อย่างถูกต้อง
              </CookieType>

              <CookieType
                name="คุกกี้เพื่อการใช้งาน (Functional Cookies)"
                badge="ปรับแต่ง"
                badgeColor="bg-blue-100 text-blue-700"
                canDisable={true}
                examples={["ภาษาที่เลือก", "ประวัติการค้นหา", "การตั้งค่าที่บันทึกไว้"]}
              >
                คุกกี้เหล่านี้ช่วยให้เว็บไซต์จดจำการตั้งค่าและตัวเลือกของท่าน
                เพื่อให้ประสบการณ์การใช้งานที่ดีขึ้นและเป็นส่วนตัวมากขึ้น
              </CookieType>

              <CookieType
                name="คุกกี้เพื่อการวิเคราะห์ (Analytics Cookies)"
                badge="วิเคราะห์"
                badgeColor="bg-purple-100 text-purple-700"
                canDisable={true}
                examples={["Google Analytics (_ga, _gid)", "จำนวนผู้เข้าชม", "หน้าที่เข้าชมบ่อย"]}
              >
                คุกกี้เหล่านี้ช่วยให้บริษัทเข้าใจว่าผู้เข้าชมใช้งานเว็บไซต์อย่างไร
                ข้อมูลทั้งหมดเป็นแบบไม่ระบุตัวตนและใช้เพื่อปรับปรุงเว็บไซต์เท่านั้น
              </CookieType>

              <CookieType
                name="คุกกี้เพื่อการตลาด (Marketing Cookies)"
                badge="การตลาด"
                badgeColor="bg-orange-100 text-orange-700"
                canDisable={true}
                examples={["Facebook Pixel", "Google Ads", "Retargeting Cookies"]}
              >
                คุกกี้เหล่านี้ใช้เพื่อแสดงโฆษณาที่เกี่ยวข้องและตรงกับความสนใจของท่าน
                บนเว็บไซต์ของบริษัทและช่องทางออนไลน์อื่น ๆ
              </CookieType>

            </div>
          </CookieSection>

          <CookieSection title="3. คุกกี้ของบุคคลที่สาม">
            <p>
              เว็บไซต์ของเราอาจมีคุกกี้จากบุคคลที่สาม ซึ่งรวมถึงแต่ไม่จำกัดเพียง
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-semibold text-[#131F3C] border border-gray-200">บริการ</th>
                    <th className="text-left p-3 font-semibold text-[#131F3C] border border-gray-200">วัตถุประสงค์</th>
                    <th className="text-left p-3 font-semibold text-[#131F3C] border border-gray-200">นโยบายความเป็นส่วนตัว</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { service: "Google Analytics", purpose: "วิเคราะห์การใช้งานเว็บไซต์", url: "policies.google.com/privacy" },
                    { service: "Google Maps", purpose: "แสดงแผนที่สาขา", url: "policies.google.com/privacy" },
                    { service: "Facebook Pixel", purpose: "โฆษณาและวิเคราะห์", url: "facebook.com/privacy/policy" },
                    { service: "LINE Liff", purpose: "ระบบแชทและติดต่อ", url: "line.me/en/terms/policy" },
                  ].map((row) => (
                    <tr key={row.service} className="border-b border-gray-100">
                      <td className="p-3 border border-gray-200 font-medium">{row.service}</td>
                      <td className="p-3 border border-gray-200 text-gray-600">{row.purpose}</td>
                      <td className="p-3 border border-gray-200 text-[#DD5259]">{row.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CookieSection>

          <CookieSection title="4. การจัดการและปฏิเสธคุกกี้">
            <p>ท่านสามารถจัดการคุกกี้ได้หลายวิธี</p>

            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-[#131F3C] mb-2">ผ่านเบราว์เซอร์</h4>
                <p className="text-sm text-gray-600 mb-3">ท่านสามารถตั้งค่าเบราว์เซอร์เพื่อปฏิเสธหรือลบคุกกี้ได้</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { name: "Google Chrome", path: "Settings → Privacy and security → Cookies" },
                    { name: "Firefox", path: "Options → Privacy & Security → Cookies" },
                    { name: "Safari", path: "Preferences → Privacy → Cookies" },
                    { name: "Microsoft Edge", path: "Settings → Privacy → Cookies" },
                  ].map((b) => (
                    <div key={b.name} className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="font-medium text-[#131F3C]">{b.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{b.path}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm">
                <p className="font-semibold text-amber-800 mb-1">⚠️ หมายเหตุสำคัญ</p>
                <p className="text-amber-700">
                  การปิดใช้งานคุกกี้บางประเภทอาจส่งผลให้ฟีเจอร์บางอย่างของเว็บไซต์ทำงานได้ไม่สมบูรณ์
                  โดยเฉพาะคุกกี้ที่จำเป็น (Strictly Necessary Cookies) ไม่สามารถปิดได้
                </p>
              </div>
            </div>
          </CookieSection>

          <CookieSection title="5. ระยะเวลาการเก็บคุกกี้">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-[#131F3C] mb-1">Session Cookies</p>
                <p className="text-gray-600">ถูกลบโดยอัตโนมัติเมื่อท่านปิดเบราว์เซอร์</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-[#131F3C] mb-1">Persistent Cookies</p>
                <p className="text-gray-600">เก็บไว้ตามระยะเวลาที่กำหนด (ตั้งแต่ 30 วัน ถึง 2 ปี)</p>
              </div>
            </div>
          </CookieSection>

          <CookieSection title="6. การอัปเดตนโยบาย">
            <p>
              บริษัทอาจปรับปรุงนโยบายการใช้คุกกี้นี้เป็นครั้งคราว เพื่อให้สอดคล้องกับการเปลี่ยนแปลงทางเทคโนโลยี
              กฎหมาย หรือการดำเนินธุรกิจ บริษัทจะแจ้งให้ท่านทราบถึงการเปลี่ยนแปลงที่สำคัญ
              ผ่านทางเว็บไซต์หรือช่องทางการสื่อสารอื่น ๆ
            </p>
          </CookieSection>

          <CookieSection title="7. ติดต่อสอบถาม">
            <div className="bg-gray-50 rounded-xl p-5 text-sm space-y-1">
              <p><strong>กลุ่มบริษัท ช.เอราวัณ กรุ๊ป</strong></p>
              <p>75/2 หมู่ 1 ต.ธรรมศาลา อ.เมือง จ.นครปฐม 73000</p>
              <p>โทรศัพท์: 034-305-500</p>
              <p>อีเมล: contactus@ch-erawan.com</p>
            </div>
          </CookieSection>

        </div>
      </div>
    </div>
  );
}

function CookieSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#131F3C] mb-3 pb-2 border-b border-gray-100">{title}</h2>
      <div className="text-sm text-[#4B5563] space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

function CookieType({
  name, badge, badgeColor, canDisable, examples, children,
}: {
  name: string; badge: string; badgeColor: string; canDisable: boolean;
  examples: string[]; children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className="font-semibold text-[#131F3C] text-sm">{name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${canDisable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {canDisable ? "ปิดได้" : "ปิดไม่ได้"}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-3">{children}</p>
      <div className="flex flex-wrap gap-1.5">
        {examples.map((ex) => (
          <span key={ex} className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-500">{ex}</span>
        ))}
      </div>
    </div>
  );
}
