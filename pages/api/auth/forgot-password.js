import prisma from "@/lib/prisma";
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'الطريقة غير مسموح بها' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Pour des raisons de sécurité, nous ne disons pas si l'utilisateur existe ou non.
      return res.status(200).json({ success: true, message: 'تم إرسال البريد الإلكتروني' });
    }

    // Générer un token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 3600000); // Expire dans 1 heure

    // Enregistrer le token dans la DB
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: tokenExpires,
      },
    });

    // Construire le lien de réinitialisation
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

    // Envoyer l'email
    const { error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || 'أكاديمية CBA'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: email,
      subject: 'إعادة تعيين كلمة المرور الخاصة بك',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>مرحبًا ${user.prenom}،</p>
          <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. اضغط على الرابط أدناه لإنشاء كلمة مرور جديدة:</p>
          <p><a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#3b82f6;color:white;text-decoration:none;border-radius:5px;">إعادة تعيين كلمة المرور</a></p>
          <p>إذا لم يعمل الزر، انسخ والصق هذا الرابط في متصفحك:</p>
          <p>${resetLink}</p>
          <p>هذا الرابط صالح لمدة ساعة واحدة.</p>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.</p>
          <br/>
          <p>فريق دزأكاديمي</p>
        </div>
      `,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return res.status(500).json({ error: 'خطأ أثناء إرسال البريد الإلكتروني' });
    }

    res.status(200).json({ success: true, message: 'تم إرسال البريد الإلكتروني' });
  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({ error: 'خطأ داخلي في الخادم' });
  }
}
