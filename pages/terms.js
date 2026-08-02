import Head from "next/head";

export default function Terms() {
  return (
    <>
      <Head>
        <title>شروط الاستعمال | دزأكاديمي</title>
      </Head>
      <div dir="rtl" lang="ar" style={{ padding: "4rem 2rem", maxWidth: "800px", margin: "0 auto", minHeight: "60vh", fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#059669", marginBottom: "2rem", textAlign: "center" }}>
          شروط و احكام الاستعمال
        </h1>
        
        <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "1rem", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", lineHeight: "1.8", color: "#374151" }}>
          
          <h3 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", color: "#0284c7" }}>📜 الشروط العامة للاستخدام</h3>

          <h4 style={{ fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0f172a", fontSize: "1.2rem" }}>المادة 1 – نطاق التطبيق</h4>
          <p>تنظّم هذه الشروط العامة للاستخدام الوصولَ إلى منصة دزأكاديمي والاستفادة منها، المتاحة على الرابط dzacademy.dz.</p>

          <h4 style={{ fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0f172a", fontSize: "1.2rem" }}>المادة 2 – قبول الشروط</h4>
          <p>يعني التسجيل في المنصة القبولَ الكاملَ وغير المشروط لهذه الشروط العامة للاستخدام. يُقرّ المستخدم بأنه اطّلع على شروط الاستخدام وسياسة حماية البيانات الشخصية وقبلها دون تحفظ.</p>

          <h4 style={{ fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0f172a", fontSize: "1.2rem" }}>المادة 3 – حماية البيانات الشخصية</h4>
          <p>وفقًا للقانون الجزائري رقم 18-07 المؤرخ في 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في معالجة البيانات الشخصية:</p>
          <ul style={{ listStyleType: "disc", paddingRight: "2rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>البيانات المجمَّعة ضرورية حصرًا لإدارة التسجيل والمتابعة التربوية والتواصل.</li>
            <li>يحق للمستخدم الاطلاع على بياناته وتصحيحها والاعتراض عليها.</li>
            <li>تُحفظ البيانات لمدة أقصاها 5 سنوات بعد آخر نشاط.</li>
            <li>تُتّخذ تدابير أمنية لحماية البيانات.</li>
          </ul>

          <h4 style={{ fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0f172a", fontSize: "1.2rem" }}>المادة 4 – الملكية الفكرية</h4>
          <p>المحتويات المتاحة على المنصة (دروس، تمارين، مقاطع فيديو) محمية بحقوق المؤلف. يُحظر أي نسخ أو نشر دون إذن مسبق.</p>

          <h4 style={{ fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0f172a", fontSize: "1.2rem" }}>المادة 5 – ميثاق الأساتذة</h4>
          <p>يلتزم الأستاذ بما يلي:</p>
          <ul style={{ listStyleType: "disc", paddingRight: "2rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>استخدام المنصة وفق أهدافها التربوية.</li>
            <li>احترام سرية المعلومات المتعلقة بالتلاميذ.</li>
            <li>ضمان دقة المحتويات المنشورة ومشروعيتها.</li>
          </ul>

          <h4 style={{ fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0f172a", fontSize: "1.2rem" }}>المادة 6 – ميثاق التلاميذ وأولياء الأمور</h4>
          <p>يلتزم التلميذ وأولياء أموره بما يلي:</p>
          <ul style={{ listStyleType: "disc", paddingRight: "2rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>استخدام بيانات الدخول بصفة شخصية وسرية.</li>
            <li>التحلّي باحترام في فضاءات التواصل.</li>
            <li>عدم محاولة تجاوز إجراءات الأمان.</li>
          </ul>

          <h4 style={{ fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0f172a", fontSize: "1.2rem" }}>المادة 7 – القانون المطبّق</h4>
          <p>تخضع هذه الشروط للقانون الجزائري. يختص القضاء الجزائري بالفصل في أي نزاع.</p>

        </div>
      </div>
    </>
  );
}
