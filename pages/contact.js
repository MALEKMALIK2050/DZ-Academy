import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
    }, 4000);
  };

  return (
    <div dir="rtl" lang="ar" className="contact-page-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Reem+Kufi:wght@600;700;800&family=Amiri:ital,wght@0,700;1,700&family=Tajawal:wght@500;700;900&display=swap');

        .contact-page-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 180px);
          padding: 50px 20px;
          background: transparent;
        }

        .contact-card {
          max-width: 650px;
          width: 100%;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          padding: 50px 40px;
          border-radius: 32px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(6, 95, 70, 0.1);
          text-align: center;
          position: relative;
        }

        .contact-badge {
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
          margin-bottom: 1.25rem;
          box-shadow: 0 4px 15px rgba(6, 95, 70, 0.25);
        }

        .contact-title {
          font-family: 'Aref Ruqaa', 'Amiri', serif;
          font-size: clamp(2.2rem, 5vw, 3.2rem);
          font-weight: 700;
          line-height: 1.25;
          background: linear-gradient(135deg, #064E3B 0%, #047857 60%, #1e3a8a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
          margin: 0 0 0.5rem 0;
        }

        .contact-subtitle {
          font-family: 'Amiri', 'Tajawal', serif;
          font-size: 1.2rem;
          color: #475569;
          margin-bottom: 2rem;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          text-align: right;
        }

        .contact-input, .contact-textarea {
          font-family: 'Tajawal', sans-serif;
          width: 100%;
          padding: 0.9rem 1.2rem;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          font-size: 1rem;
          color: #1E293B;
          background: #F8FAFC;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .contact-input:focus, .contact-textarea:focus {
          outline: none;
          border-color: #047857;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(4, 120, 87, 0.15);
        }

        .contact-textarea {
          min-height: 130px;
          resize: vertical;
        }

        .btn-contact-submit {
          font-family: 'Tajawal', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff !important;
          background: linear-gradient(135deg, #047857 0%, #10b981 100%);
          padding: 1rem 2.5rem;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(4, 120, 87, 0.35);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 0.5rem;
        }

        .btn-contact-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(4, 120, 87, 0.5);
        }

        .contact-success {
          font-family: 'Tajawal', sans-serif;
          background: #DCFCE7;
          border: 1px solid #86EFAC;
          color: #166534;
          padding: 1rem;
          border-radius: 16px;
          font-weight: 700;
          margin-bottom: 1.5rem;
          font-size: 1.05rem;
        }
        `
      }} />

      <div className="contact-card">
        <div className="contact-badge">
          <span style={{ color: "#FBBF24" }}>✦</span>
          <span>نحن هنا للإجابة على جميع استفساراتك</span>
          <span style={{ color: "#FBBF24" }}>✦</span>
        </div>

        <h1 className="contact-title">
          📩 تواصل معنا
        </h1>

        <p className="contact-subtitle">
          لديك سؤال أو استفسار؟ أرسل لنا رسالتك ويسعدنا إجابتك 👇
        </p>

        {sent && (
          <div className="contact-success">
            ✅ تم إرسال رسالتك بنجاح! سيتواصل معك فريقنا في أقرب وقت.
          </div>
        )}

        <form onSubmit={handleSubmit} className="contact-form">
          <input className="contact-input" type="text" placeholder="الاسم الكامل" required />
          <input className="contact-input" type="email" placeholder="البريد الإلكتروني" required />
          <textarea className="contact-textarea" placeholder="اكتب رسالتك هنا..." required />
          <button type="submit" className="btn-contact-submit">📤 إرسال الرسالة</button>
        </form>
      </div>
    </div>
  );
}
