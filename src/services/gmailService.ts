import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

// Required Google Workspace scopes
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

// In-memory cache for OAuth access token (as required by Workspace guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));

// Initialize auth state listener to clear token on sign out
export const initGoogleAuth = (
  onSuccess?: (user: FirebaseUser, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onFailure && !isSigningIn) onFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Erro na autenticação com Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const disconnectGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Base64URL encoder helper for RFC 2822 email payload
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface MeetingEmailPayload {
  toEmail: string;
  recipientName?: string;
  gcName: string;
  meetingDate: string;
  meetingTime: string;
  location: string;
  address: string;
  confirmationCode: string;
  leaderName: string;
  scales?: {
    louvor?: string;
    palavra?: string;
    anfitriao?: string;
    lanche?: string;
  };
}

export async function sendMeetingNoticeEmail(
  payload: MeetingEmailPayload,
  accessToken: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const subject = `[EKKLES] Convocação Reunião ${payload.gcName} • Código: ${payload.confirmationCode}`;
    
    // Construct HTML email content
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f4f5; color: #18181b; margin: 0; padding: 20px; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: #09090b; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #a1a1aa; }
    .content { padding: 24px; }
    .badge-code { background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
    .badge-code .code { font-size: 26px; font-weight: 800; color: #065f46; letter-spacing: 3px; font-family: monospace; }
    .info-grid { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; border: 1px solid #e2e8f0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #edf2f7; }
    .info-row:last-child { border-bottom: none; }
    .scales { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 12px; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #71717a; border-top: 1px solid #f4f4f5; background: #fafafa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>EKKLES • ${payload.gcName}</h1>
      <p>Aviso Oficial da Liderança de Célula</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Graça e Paz${payload.recipientName ? `, <strong>${payload.recipientName}</strong>` : ''}!</p>
      <p style="font-size: 13px; color: #52525b; line-height: 1.5;">
        Este é o aviso oficial do nosso próximo encontro de GC. Fique atento às informações e guarde o seu código de confirmação:
      </p>

      <div class="badge-code">
        <div style="font-size: 11px; text-transform: uppercase; color: #047857; font-weight: 600; letter-spacing: 1px;">Seu Código de Presença</div>
        <div class="code">${payload.confirmationCode}</div>
        <div style="font-size: 11px; color: #059669; margin-top: 4px;">Apresente este código ao chegar no encontro</div>
      </div>

      <div class="info-grid">
        <div class="info-row">
          <span style="color: #64748b;">📅 Data & Horário:</span>
          <strong>${payload.meetingDate} às ${payload.meetingTime}</strong>
        </div>
        <div class="info-row">
          <span style="color: #64748b;">📍 Local:</span>
          <strong>${payload.location}</strong>
        </div>
        <div class="info-row">
          <span style="color: #64748b;">🏠 Endereço:</span>
          <span>${payload.address}</span>
        </div>
        <div class="info-row">
          <span style="color: #64748b;">👤 Líder Responsável:</span>
          <span>${payload.leaderName}</span>
        </div>
      </div>

      ${payload.scales ? `
      <div class="scales">
        <div style="font-weight: bold; color: #92400e; margin-bottom: 6px;">Escala da Reunião:</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: #78350f;">
          ${payload.scales.palavra ? `<div>📖 Palavra: <strong>${payload.scales.palavra}</strong></div>` : ''}
          ${payload.scales.louvor ? `<div>🎵 Louvor: <strong>${payload.scales.louvor}</strong></div>` : ''}
          ${payload.scales.anfitriao ? `<div>🏡 Recepção: <strong>${payload.scales.anfitriao}</strong></div>` : ''}
          ${payload.scales.lanche ? `<div>☕ Comunhão: <strong>${payload.scales.lanche}</strong></div>` : ''}
        </div>
      </div>` : ''}

      <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 20px;">
        Contamos com a sua presença e oração para um encontro abençoado!
      </p>
    </div>
    <div class="footer">
      Mensagem enviada pelo aplicativo EKKLES Gestão de Células.
    </div>
  </div>
</body>
</html>
    `;

    // Construct raw MIME email
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${payload.toEmail}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody,
    ];
    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = base64UrlEncode(rawMessage);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Erro no envio: status ${res.status}`);
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('Erro ao enviar e-mail via Gmail API:', error);
    return { success: false, error: error.message || 'Falha ao enviar e-mail' };
  }
}
