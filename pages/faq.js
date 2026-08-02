import Head from "next/head";

export default function FAQ() {
  const faqs = [
    {
      q: "كيف يمكنني التسجيل في الأكاديمية؟",
      a: "يمكنك التسجيل عبر الضغط على زر 'التسجيل' في الأعلى وإدخال معلوماتك الشخصية واختيار الطور والسنة الدراسية. بعد إنشاء الحساب، يمكنك الدخول واستعراض الدورات المتاحة."
    },
    {
      q: "هل الدورات مجانية أم مدفوعة؟",
      a: "نقدم بعض المحتويات المجانية للتجربة، ولكن أغلب الدورات والمسارات التعليمية المتكاملة مدفوعة وتتطلب اشتراكاً."
    },
    {
      q: "ما هي طرق الدفع المتاحة؟",
      a: "نقبل الدفع عبر البطاقة الذهبية، بريد موب، أو الدفع نقداً عبر مكاتب البريد (CCP)."
    },
    {
      q: "هل يمكنني مشاهدة الدروس متى أردت؟",
      a: "نعم، بمجرد تفعيل اشتراكك في دورة معينة، يمكنك الوصول إلى جميع الدروس والتمارين ومقاطع الفيديو في أي وقت يناسبك وعلى مدار 24 ساعة."
    }
  ];

  return (
    <>
      <Head>
        <title>الأسئلة الشائعة | دزأكاديمي</title>
      </Head>
      <div dir="rtl" lang="ar" style={{ padding: "4rem 2rem", maxWidth: "800px", margin: "0 auto", minHeight: "60vh", fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#059669", marginBottom: "2rem", textAlign: "center" }}>
          الأسئلة الشائعة ؟
        </h1>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {faqs.map((faq, idx) => (
            <div key={idx} style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0284c7", marginBottom: "0.5rem" }}>{faq.q}</h3>
              <p style={{ color: "#374151", lineHeight: "1.7" }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
