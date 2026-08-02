import Head from 'next/head';
import Link from 'next/link';

export default function LegalNoticePage() {
  return (
    <div dir="rtl" lang="ar" style={{ minHeight: '100vh', background: "url('/images/bg-algerian.png') #f7f3ec", backgroundAttachment: 'fixed', padding: '3rem 1.5rem' }}>
      <Head>
        <title>الإشعارات القانونية — الأكاديمية الجزائرية</title>
        <meta name="description" content="الإشعارات والمعلومات القانونية الخاصة بالأكاديمية الجزائرية للتعليم الثانوي والمتوسط" />
      </Head>

      <div style={{ maxWidth: '850px', margin: '0 auto', background: 'white', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontFamily: "'Aref Ruqaa', serif", fontSize: '2.2rem', color: '#064E3B', marginBottom: '1.5rem', borderBottom: '2px solid #a7f3d0', paddingBottom: '0.8rem' }}>
          ⚖️ الإشعارات والمعلومات القانونية
        </h1>

        <div style={{ color: '#334155', lineHeight: '1.8', fontSize: '1rem' }}>
          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>1. الناشر والمُدرِّس Responsible Publisher</h3>
          <p>
            تعد منصة <strong>الأكاديمية الجزائرية للتعليم الثانوي والمتوسط (DZ Academy)</strong> مؤسسة تعليمية رقمية موجهة للتدريب والتعليم عن بعد في الجزائر.
          </p>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>2. الملكية الفكرية Intellectual Property</h3>
          <p>
            جميع محتويات المنصة بما فيها النصوص، البرامج التعليمية، الفيديو، الصور، والشعارات هي ملك حصري للأكاديمية وتخضع لقوانين الملكية الفكرية وحقوق المؤلف المعمول بها في الجمهورية الجزائرية الديمقراطية الشعبية.
          </p>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>3. استضافة الموقع Hosting</h3>
          <p>
            الموقع والأرضية الرقمية مستضيفة على خوادم آمنة وعالية الأداء مخصصة للخدمات التعليمية.
          </p>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>4. اتصل بنا Contact</h3>
          <p>
            لأي استفسار قانوني أو تنظيمي، يرجى التواصل معنا عبر البريد: <strong>contact@dzacademy.dz</strong>
          </p>
        </div>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#047857', fontWeight: '700', textDecoration: 'none' }}>
            ← العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
