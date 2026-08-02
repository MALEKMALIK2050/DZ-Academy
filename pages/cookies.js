import Head from 'next/head';
import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div dir="rtl" lang="ar" style={{ minHeight: '100vh', background: "url('/images/bg-algerian.png') #f7f3ec", backgroundAttachment: 'fixed', padding: '3rem 1.5rem' }}>
      <Head>
        <title>سياسة الكوكيز — الأكاديمية الجزائرية</title>
        <meta name="description" content="سياسة استخدام ملفات تعريف الارتباط (الكوكيز) بالأكاديمية الجزائرية للتعليم الثانوي والمتوسط" />
      </Head>

      <div style={{ maxWidth: '850px', margin: '0 auto', background: 'white', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontFamily: "'Aref Ruqaa', serif", fontSize: '2.2rem', color: '#064E3B', marginBottom: '1.5rem', borderBottom: '2px solid #a7f3d0', paddingBottom: '0.8rem' }}>
          🍪 سياسة ملفات تعريف الارتباط (الكوكيز)
        </h1>

        <div style={{ color: '#334155', lineHeight: '1.8', fontSize: '1rem' }}>
          <p>
            تستخدم منصة <strong>الأكاديمية الجزائرية للتعليم الثانوي والمتوسط</strong> ملفات تعريف الارتباط (Cookies) لتحسين تجربة المستخدم وضمان سير الخدمات بشكل سلس وآمن.
          </p>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>1. ما هي ملفات الكوكيز؟</h3>
          <p>
            ملفات الكوكيز هي ملفات نصية صغيرة يتم تخزينها على متصفحك أو جهازك عند زيارة موقعنا، وتساعدنا على التعرف على جهازك وحفظ تفضيلات الجلسة.
          </p>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>2. أنواع الكوكيز المستعملة</h3>
          <ul style={{ paddingRight: '1.2rem' }}>
            <li><strong>كوكيز أساسية:</strong> ضرورية لتسجيل الدخول وإدارة الجلسات وحماية الحساب.</li>
            <li><strong>كوكيز التفضيلات:</strong> تحفظ لغة واجهتك وتفضيلات العرض.</li>
            <li><strong>كوكيز الأداء والأمان:</strong> تساعد في تسريع تحميل الدروس وتأمين التصفح.</li>
          </ul>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>3. إدارة وإلغاء الكوكيز</h3>
          <p>
            يمكنك دائماً التحكم في قبول أو رفض ملفات تعريف الارتباط من خلال إعدادات متصفحك. مع العلم أن تعطيل بعض الكوكيز قد يؤثر على تصفح بعض ميزات المنصة.
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
