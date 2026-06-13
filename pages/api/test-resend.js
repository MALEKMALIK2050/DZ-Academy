import { Resend } from 'resend';

export default async function handler(req, res) {
  // Autoriser CORS pour le test
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  // Vérifier si la clé API existe
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ 
      error: 'RESEND_API_KEY manquante',
      env: Object.keys(process.env).filter(k => k.includes('RESEND'))
    });
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || 'CBA Academy'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: ['test@example.com'], // Email de test
      subject: 'Test Resend API',
      html: '<h1>Test réussi !</h1>',
    });
    
    if (error) {
      return res.status(500).json({ error, message: error.message });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}