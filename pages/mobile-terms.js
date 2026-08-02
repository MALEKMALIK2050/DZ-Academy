import Head from 'next/head';
import Link from 'next/link';

export default function MobileTermsPage() {
  return (
    <div dir="rtl" lang="ar" style={{ minHeight: '100vh', background: "url('/images/bg-algerian.png') #f7f3ec", backgroundAttachment: 'fixed', padding: '3rem 1.5rem' }}>
      <Head>
        <title>شروط تطبيق المحمول — الأكاديمية الجزائرية</title>
        <meta name="description" content="شروط استخدام تطبيق الهاتف المحمول للأكاديمية الجزائرية للتعليم الثانوي والمتوسط" />
      </Head>

      <div style={{ maxWidth: '850px', margin: '0 auto', background: 'white', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontFamily: "'Aref Ruqaa', serif", fontSize: '2.2rem', color: '#064E3B', marginBottom: '1.5rem', borderBottom: '2px solid #a7f3d0', paddingBottom: '0.8rem' }}>
          📱 شروط استخدام تطبيق الهاتف المحمول
        </h1>

        <div style={{ color: '#334155', lineHeight: '1.8', fontSize: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#047857', fontWeight: '700' }}>
            المرجع التنظيمي: CBA-MOB-005 · الإصدار 1.0
          </p>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>1. الغرض</h3>
          <p>
            تحدد هذه الشروط والأحكام قواعد الوصول والاستخدام لتطبيق الهاتف المحمول الخاص بـ <strong>الأكاديمية الجزائرية (DZ Academy LMS)</strong>، والذي يتيح للمتعلمين متابعة دروسهم والوصول إلى المحتوى التفاعلي عبر الأجهزة الذكية.
          </p>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>2. شروط الوصول والاستخدام</h3>
          <ul style={{ paddingRight: '1.2rem' }}>
            <li>يتطلب استخدام التطبيق حساباً نشطاً على منصة الأكاديمية.</li>
            <li>يجب الحفاظ على سرية بيانات تسجيل الدخول وتجنب مشاركة الحساب مع أطراف أخرى.</li>
            <li>التطبيق مخصص للاستخدام التعليمي الشخصي وتمنع أي محاولة لإعادة الهندسة أو استخراج المحتوى.</li>
          </ul>

          <h3 style={{ color: '#047857', marginTop: '1.5rem' }}>3. التحديثات والتوافق</h3>
          <p>
            تسري هذه الشروط على جميع إصدارات التطبيق (Android و iOS المستقبلي) وعلى كل التحديثات والتحسينات البرمجية الدورية.
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
