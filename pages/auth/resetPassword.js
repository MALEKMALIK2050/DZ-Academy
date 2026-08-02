import crypto from 'crypto';


// توليد رمز تحقق آمن
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 حرف بالنظام الست عشري
}

// دالة إرسال بريد إعادة التعيين
export async function resetPassword(email) {
  try {
    // 1. توليد رمز فريد
    const token = generateResetToken();

    // 2. بناء رابط إعادة التعيين
    const resetLink = `http://localhost:3000/auth/reset?token=${token}`;

    // 3. إرسال البريد الإلكتروني
    await sendMail(
      email,
      'إعادة تعيين كلمة المرور - دزأكاديمي',
      `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
         <h2>طلب إعادة تعيين كلمة المرور</h2>
         <p>تلقّينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة دزأكاديمي.</p>
         <p>انقر على الرابط أدناه لمتابعة العملية:</p>
         <p><a href="${resetLink}" style="color:#059669;">${resetLink}</a></p>
         <p style="color:#888; font-size:0.85rem;">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.</p>
       </div>`
    );

    console.log('تم إرسال بريد إعادة التعيين بنجاح');
    return token;
  } catch (error) {
    console.error('خطأ في إرسال بريد إعادة التعيين:', error);
  }
}

export default function ResetPasswordPage() {
  return (
    <div dir="rtl" lang="ar" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div>
        <h1>إعادة تعيين كلمة المرور</h1>
        <p>هذه الصفحة ستكون متاحة قريبًا</p>
        <a href="/login">العودة إلى تسجيل الدخول</a>
      </div>
    </div>
  );
}