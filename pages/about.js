import React, { useEffect, useState } from 'react';

export default function About() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div dir="rtl" lang="ar" className="about-page-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Reem+Kufi:wght@600;700;800&family=Amiri:ital,wght@0,700;1,700&family=Tajawal:wght@500;700;900&display=swap');

        .about-page-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 180px);
          padding: 50px 20px;
          background: transparent;
        }

        .about-card {
          max-width: 900px;
          width: 100%;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          padding: 60px 50px;
          border-radius: 32px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(6, 95, 70, 0.1);
          text-align: center;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .about-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .about-badge {
          font-family: 'Reem Kufi', 'Tajawal', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
          background: linear-gradient(135deg, #065F46 0%, #047857 100%);
          padding: 6px 20px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 15px rgba(6, 95, 70, 0.25);
        }

        .about-title {
          font-family: 'Aref Ruqaa', 'Amiri', serif;
          font-size: clamp(2.2rem, 5vw, 3.4rem);
          font-weight: 700;
          line-height: 1.25;
          background: linear-gradient(135deg, #064E3B 0%, #047857 60%, #1e3a8a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
          margin-bottom: 30px;
          letter-spacing: -0.5px;
        }

        .about-text {
          font-family: 'Amiri', 'Tajawal', serif;
          font-size: 1.15rem;
          line-height: 1.8;
          color: #1E293B;
          margin-bottom: 20px;
        }

        .about-vision-box {
          margin-top: 35px;
          padding: 30px 35px;
          background: linear-gradient(135deg, #F0FDF4 0%, #E6F4EA 100%);
          border-right: 6px solid #047857;
          border-radius: 22px;
          box-shadow: 0 10px 30px rgba(4, 120, 87, 0.08);
          text-align: right;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .about-vision-box:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(4, 120, 87, 0.15);
        }

        .about-vision-title {
          font-family: 'Aref Ruqaa', 'Amiri', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #064E3B;
          margin-bottom: 12px;
        }

        .about-vision-text {
          font-family: 'Amiri', serif;
          font-size: 1.25rem;
          font-style: italic;
          color: #047857;
          margin: 0;
          line-height: 1.7;
        }

        @media (max-width: 768px) {
          .about-card { padding: 35px 20px; }
          .about-title { font-size: 2rem; }
          .about-text { font-size: 1rem; }
          .about-vision-box { padding: 22px; }
        }
        `
      }} />

      <div className={`about-card ${mounted ? 'visible' : ''}`}>
        <div className="about-content">
          <div className="about-badge">
            <span style={{ color: "#FBBF24" }}>✦</span>
            <span>الأكاديمية الجزائرية للتعليم الثانوي والمتوسط</span>
            <span style={{ color: "#FBBF24" }}>✦</span>
          </div>

          <h1 className="about-title">
            حول الأكاديمية الجزائرية للتعليم الثانوي والمتوسط
          </h1>

          <div>
            <p className="about-text">
              <strong>الأكاديمية الجزائرية للتعليم الثانوي والمتوسط</strong> هي منصة تعليمية عبر الإنترنت مخصصة لتلاميذ المتوسط والثانوي.
            </p>

            <p className="about-text">
              مهمتنا هي جعل التعليم متاحًا وعصريًا ومتكيّفًا مع وتيرة كل تلميذ.
            </p>

            <p className="about-text">
              نعمل مع أساتذة مؤهلين لتقديم دروس منظمة وواضحة وفعّالة.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">✨ رؤيتنا</h2>
            <p className="about-vision-text">
              "مرافقة كل تلميذ نحو النجاح الدراسي بفضل أدوات رقمية فعّالة ومتابعة شخصية."
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">📚 برامجنا التعليمية</h2>
            <p className="about-text" style={{ fontSize: '1.05rem', margin: 0 }}>
              تقدّم الأكاديمية الجزائرية للتعليم الثانوي والمتوسط مرافقة شاملة لتلاميذ المتوسط والثانوي، بمحتويات بيداغوجية مكيّفة مع البرامج الرسمية و مع الاحتياجات البيداغوجية لكل مستوى.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">🎯 الأهداف البيداغوجية</h2>
            <p className="about-text" style={{ fontSize: '1.05rem' }}>
              هدفنا هو مساعدة كل تلميذ على إتقان الأساسيات، وتطوير استقلاليته، وتحسين أدائه الدراسي بفضل منهجية منظمة وتدريجية.
            </p>
            <p className="about-text" style={{ fontSize: '1.05rem', marginTop: '10px', margin: 0 }}>
              نركّز على الفهم والممارسة والانتظام لضمان تقدّم حقيقي ومستدام.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">📖 المواد المقترحة</h2>
            <p className="about-text" style={{ fontSize: '1.05rem' }}>
              تشمل دوراتنا التعليمية محتويات المواد الرئيسية للمتوسط والثانوي:
            </p>
            <p className="about-text" style={{ fontSize: '1.15rem', fontWeight: '800', color: '#064E3B', marginTop: '10px', margin: 0 }}>
              الرياضيات، الفيزياء و الكيمياء، العلوم الطبيعية، التاريخ و الجغرافيا، اللغة العربية، اللغات الفرنسية والإنجليزية، و كذا اللغة الإسبانية و اللغة الألمانية.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">💡 منهجيتنا</h2>
            <p className="about-text" style={{ fontSize: '1.05rem' }}>
              كل درس مصمم لتمكين التلميذ من التعلّم بوتيرته الخاصة، بفضل مقاربة قائمة على التعلّم الذاتي الموجّه.
            </p>
            <p className="about-text" style={{ fontSize: '1.05rem', marginTop: '10px' }}>
              الدروس واضحة وتدريجية ومصحوبة بأمثلة ملموسة لتسهيل الفهم.
            </p>
            <p className="about-text" style={{ fontSize: '1.05rem', marginTop: '10px' }}>
              تُقترح تمارين تطبيقية بعد كل وحدة لتعزيز المكتسبات وتمكين التلميذ من التدرّب بفعالية.
            </p>
            <p className="about-text" style={{ fontSize: '1.05rem', marginTop: '10px', margin: 0 }}>
              في نهاية كل مسار، يتيح اختبار تقييمي قياس مستوى الإتقان والتحقق من الكفاءات المكتسبة.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">🌟 تعليم شامل</h2>
            <p className="about-text" style={{ fontSize: '1.05rem', margin: 0 }}>
              بفضل منهجيتنا العلمية المقترحة، يصبح التلميذ فاعلًا في تعلّمه، ويكتسب الثقة في التعلم اعتمادا على نفسه، ويتقدّم بشكل مستقل نحو النجاح المنشود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}