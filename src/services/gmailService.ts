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
  noticeCategory?: string;
  customNote?: string;
  theme?: string;
  verse?: string;
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
    const categoryTitle = payload.noticeCategory || 'Convocação Semanal';
    const subject = `[EKKLES] ${categoryTitle}: ${payload.gcName} • Código: ${payload.confirmationCode}`;
    
    // Construct HTML email content
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
    .card { max-width: 560px; margin: 0 auto; background: #18181b; border-radius: 20px; border: 1px solid #27272a; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .header { background: #000000; color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #27272a; }
    .header h1 { margin: 0; font-size: 20px; letter-spacing: 1px; }
    .header .tag { display: inline-block; background: #10b981; color: #000000; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 24px; }
    .custom-note { background: #052e16; border-left: 4px solid #10b981; border-radius: 10px; padding: 14px 16px; margin: 16px 0; color: #d1fae5; font-size: 13px; line-height: 1.6; }
    .badge-code { background: #09090b; border: 2px dashed #10b981; border-radius: 14px; padding: 16px; text-align: center; margin: 20px 0; }
    .badge-code .code { font-size: 28px; font-weight: 800; color: #34d399; letter-spacing: 4px; font-family: monospace; }
    .info-grid { background: #09090b; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; border: 1px solid #27272a; }
    .info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #1f1f23; }
    .info-row:last-child { border-bottom: none; }
    .scales { background: #1c1917; border: 1px solid #292524; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 12px; }
    .theme-box { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 12px 16px; margin: 14px 0; font-size: 12px; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #71717a; border-top: 1px solid #27272a; background: #000000; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>EKKLES • ${payload.gcName}</h1>
      <span class="tag">${categoryTitle}</span>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0; color: #ffffff;">Graça e Paz${payload.recipientName ? `, <strong>${payload.recipientName}</strong>` : ''}!</p>
      
      ${payload.customNote ? `
      <div class="custom-note">
        <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #34d399; margin-bottom: 4px;">
          💬 Palavra do Líder (${payload.leaderName})
        </div>
        ${payload.customNote}
      </div>` : `
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
        Este é o aviso oficial do nosso próximo encontro de GC. Fique atento às informações e guarde o seu código de presença:
      </p>`}

      <div class="badge-code">
        <div style="font-size: 11px; text-transform: uppercase; color: #10b981; font-weight: 700; letter-spacing: 1px;">Seu Código de Presença</div>
        <div class="code">${payload.confirmationCode}</div>
        <div style="font-size: 11px; color: #6ee7b7; margin-top: 4px;">Apresente este código ao chegar no encontro</div>
      </div>

      <div class="info-grid">
        <div class="info-row">
          <span style="color: #a1a1aa;">📅 Data & Horário:</span>
          <strong style="color: #ffffff;">${payload.meetingDate} às ${payload.meetingTime}</strong>
        </div>
        <div class="info-row">
          <span style="color: #a1a1aa;">📍 Local:</span>
          <strong style="color: #ffffff;">${payload.location}</strong>
        </div>
        <div class="info-row">
          <span style="color: #a1a1aa;">🏠 Endereço:</span>
          <span style="color: #d4d4d8;">${payload.address}</span>
        </div>
        <div class="info-row">
          <span style="color: #a1a1aa;">👤 Líder Responsável:</span>
          <span style="color: #d4d4d8;">${payload.leaderName}</span>
        </div>
      </div>

      ${payload.theme || payload.verse ? `
      <div class="theme-box">
        ${payload.theme ? `<div style="color: #ffffff; font-weight: 600;">Tema da Noite: <span style="color: #34d399;">${payload.theme}</span></div>` : ''}
        ${payload.verse ? `<div style="font-style: italic; color: #a1a1aa; margin-top: 4px;">${payload.verse}</div>` : ''}
      </div>` : ''}

      ${payload.scales ? `
      <div class="scales">
        <div style="font-weight: bold; color: #fbbf24; margin-bottom: 6px;">📋 Escala da Equipe para a Reunião:</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: #fef08a;">
          ${payload.scales.palavra ? `<div>📖 Palavra: <strong>${payload.scales.palavra}</strong></div>` : ''}
          ${payload.scales.louvor ? `<div>🎵 Louvor: <strong>${payload.scales.louvor}</strong></div>` : ''}
          ${payload.scales.anfitriao ? `<div>🏡 Recepção: <strong>${payload.scales.anfitriao}</strong></div>` : ''}
          ${payload.scales.lanche ? `<div>☕ Comunhão: <strong>${payload.scales.lanche}</strong></div>` : ''}
        </div>
      </div>` : ''}

      <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 20px;">
        Sua vida é muito importante para nós! Contamos com sua presença para um encontro edificante.
      </p>
    </div>
    <div class="footer">
      EKKLES • Sistema Oficial de Gestão de Células
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

export interface PasswordRecoveryPayload {
  toEmail: string;
  recipientName: string;
  recoveryCode: string;
}

export async function sendPasswordRecoveryEmail(
  payload: PasswordRecoveryPayload,
  accessToken?: string | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const subject = `[EKKLES] Recuperar Senha • Sistema de Gestão`;
    const targetSystemUrl = `https://ekkles-gestor.vercel.app/?tab=recuperar-senha&email=${encodeURIComponent(payload.toEmail)}`;
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
    .card { max-width: 520px; margin: 0 auto; background: #18181b; border-radius: 20px; border: 1px solid #27272a; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.6); }
    .header { background: #000000; color: #ffffff; padding: 26px 20px; text-align: center; border-bottom: 1px solid #27272a; }
    .header h1 { margin: 0; font-size: 22px; letter-spacing: 2px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #a1a1aa; }
    .content { padding: 26px; }
    .action-btn { display: inline-block; background: #ffffff; color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; text-align: center; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(255,255,255,0.15); margin: 18px 0; }
    .steps-box { background: #09090b; border: 1px solid #27272a; border-radius: 14px; padding: 16px; margin: 18px 0; font-size: 13px; }
    .step-item { display: flex; align-items: center; gap: 8px; margin: 6px 0; color: #e4e4e7; font-weight: 600; }
    .code-box { background: #09090b; border: 2px dashed #10b981; border-radius: 12px; padding: 14px; text-align: center; margin: 16px 0; }
    .code { font-size: 26px; font-weight: 800; color: #34d399; letter-spacing: 5px; font-family: monospace; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #71717a; border-top: 1px solid #27272a; background: #000000; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>EKKLES</h1>
      <p>Sistema Oficial de Gestão de Células</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0; color: #ffffff;">Olá, <strong>${payload.recipientName}</strong>!</p>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6;">
        Recebemos uma solicitação de redefinição de acesso para sua conta no sistema oficial <strong>EKKLES</strong>.
      </p>

      <div style="text-align: center; margin: 10px 0;">
        <a href="${targetSystemUrl}" class="action-btn">
          🔑 RECUPERAR SENHA
        </a>
      </div>

      <div class="steps-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #34d399; font-weight: 700; margin-bottom: 8px;">
          Ao acessar a aba do sistema, preencha:
        </div>
        <div class="step-item">
          <span style="color: #10b981;">•</span> NOVA SENHA
        </div>
        <div class="step-item">
          <span style="color: #10b981;">•</span> REPITA A SENHA
        </div>
        <div style="font-size: 11px; color: #71717a; margin-top: 8px;">
          Exigências: Mínimo 8 dígitos, letras maiúsculas, minúsculas, caractere especial e sem acentos.
        </div>
      </div>

      <div class="code-box">
        <div style="font-size: 10px; text-transform: uppercase; color: #10b981; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;">Código de Confirmação Rápida</div>
        <div class="code">${payload.recoveryCode}</div>
        <div style="font-size: 11px; color: #71717a; margin-top: 4px;">Utilize caso o sistema solicite a confirmação de 6 dígitos</div>
      </div>

      <div style="background: #0d1f18; border: 1px solid #059669; border-radius: 12px; padding: 12px; margin: 16px 0; font-size: 11px; color: #a7f3d0; text-align: center;">
        🔒 <strong>Conexão Criptografada Ponta a Ponta</strong><br>
        Seus dados de login e nova senha são processados com hashing seguro SHA-256 e protegidos por SSL/TLS.
      </div>

      <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin-top: 18px;">
        Se você não solicitou esta redefinição, não se preocupe: sua senha atual permanecerá segura e inalterada.
      </p>
    </div>
    <div class="footer">
      EKKLES • Sistema Oficial de Gestão de Células • Proteção Criptográfica Ativa • <a href="https://ekkles-gestor.vercel.app" style="color: #34d399; text-decoration: none;">ekkles-gestor.vercel.app</a>
    </div>
  </div>
</body>
</html>
    `;

    const token = accessToken || cachedAccessToken;
    if (!token) {
      return { success: false, error: 'Autenticação do Google necessária para enviar e-mails via Gmail.' };
    }

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
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error?.message || `Erro Gmail API: status ${res.status}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('Erro ao disparar e-mail de recuperação:', error);
    return { success: false, error: error.message || 'Falha ao enviar e-mail' };
  }
}

