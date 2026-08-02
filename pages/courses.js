import Head from "next/head";
import Link from "next/link";

export default function Courses() {
  return (
    <>
      <Head>
        <title>دليل الدروس | دزأكاديمي</title>
      </Head>
      <div dir="rtl" lang="ar" style={{ padding: "4rem 2rem", maxWidth: "800px", margin: "0 auto", minHeight: "60vh", fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#059669", marginBottom: "1.5rem", textAlign: "center" }}>
          برامجنا التعليمية 📚
        </h1>
        
        <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "1rem", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", lineHeight: "1.8", color: "#374151" }}>
          
          <p style={{ marginBottom: "1.5rem", fontSize: "1.1rem" }}>
            تقدم أكاديمية دزأكاديمي مرافقة شاملة لتلاميذ الطورين المتوسط والثانوي، مع محتويات بيداغوجية مطابقة للبرامج الرسمية ومكيفة حسب احتياجات كل مستوى.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", color: "#0284c7" }}>الأهداف البيداغوجية</h2>
          <p style={{ marginBottom: "1rem" }}>
            هدفنا هو مساعدة كل تلميذ على التحكم في الأساسيات، تطوير استقلاليته وتحسين نتائجه المدرسية بفضل منهجية مهيكلة وتدريجية.
          </p>
          <p style={{ marginBottom: "1.5rem" }}>
            نركز على الفهم والممارسة والاستمرارية لضمان تقدم حقيقي ومستدام.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", color: "#0284c7" }}>المواد المقترحة</h2>
          <p style={{ marginBottom: "1rem" }}>
            تغطي دروسنا المواد الأساسية في الطورين المتوسط والثانوي:
          </p>
          <p style={{ marginBottom: "1.5rem", fontWeight: "600" }}>
            الرياضيات، الفيزياء، علوم الطبيعة والحياة، اللغة العربية، اللغة الفرنسية واللغة الإنجليزية.
          </p>

          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", color: "#0284c7" }}>منهجيتنا</h2>
          <ul style={{ listStyleType: "disc", paddingRight: "2rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>كل درس مصمم ليسمح للتلميذ بالتعلم بالوتيرة التي تناسبه، بفضل مقاربة تعتمد على التكوين الذاتي الموجه.</li>
            <li>الدروس واضحة وتدريجية ومرفقة بأمثلة ملموسة لتسهيل الفهم.</li>
            <li>يتم اقتراح تمارين تطبيقية بعد كل وحدة لتعزيز المكتسبات والسماح للتلميذ بالتدرب بفعالية.</li>
            <li>في نهاية كل مسار، يسمح اختبار تقييمي بقياس مستوى التحكم وتأكيد الكفاءات المكتسبة.</li>
          </ul>

          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", color: "#0284c7" }}>تكوين متكامل</h2>
          <p style={{ marginBottom: "2rem" }}>
            بفضل هذه المنهجية، يصبح التلميذ فاعلا في تعلمه، يكتسب الثقة بالنفس ويتقدم بشكل مستقل نحو النجاح المدرسي.
          </p>

          <div style={{ textAlign: "center" }}>
            <Link href="/register" style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "white",
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              fontWeight: "bold",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              transition: "transform 0.2s"
            }}>
              انضم إلينا الآن 🚀

            </Link>
          </div>

        </div>
      </div>
    </>
  );
}