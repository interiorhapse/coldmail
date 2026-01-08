import { Resend } from 'resend';

// 지연 초기화
let resendClient = null;

function getResend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmail({ to, subject, html, text }) {
  const resend = getResend();

  const senderEmail = process.env.SENDER_EMAIL;
  const senderName = process.env.SENDER_NAME;

  if (!senderEmail) {
    throw new Error('SENDER_EMAIL 환경변수가 설정되지 않았습니다.');
  }

  try {
    const response = await resend.emails.send({
      from: senderName ? `${senderName} <${senderEmail}>` : senderEmail,
      to: to,
      reply_to: senderEmail,
      subject: subject,
      html: html || text?.replace(/\n/g, '<br>'),
      text: text,
    });

    return response;
  } catch (error) {
    console.error('Resend 발송 오류:', error);
    throw new Error(`이메일 발송 실패: ${error.message}`);
  }
}

export async function sendBatchEmails(emails) {
  const results = [];

  for (const email of emails) {
    try {
      const response = await sendEmail(email);
      results.push({ success: true, email: email.to, response });
    } catch (error) {
      results.push({ success: false, email: email.to, error: error.message });
    }
  }

  return results;
}
