import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

type EmailProvider = 'sendgrid' | 'smtp' | 'console';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: EmailProvider;
  private readonly defaultFrom: string;
  private smtpTransporter?: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<EmailProvider>(
      'EMAIL_PROVIDER',
      'console',
    );
    this.defaultFrom = this.configService.get<string>(
      'EMAIL_FROM',
      'TrackPro <noreply@trackpro.io>',
    );

    this.initializeProvider();
  }

  private initializeProvider(): void {
    switch (this.provider) {
      case 'sendgrid':
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
        if (!apiKey) {
          throw new Error(
            'SENDGRID_API_KEY is required when EMAIL_PROVIDER is sendgrid',
          );
        }
        sgMail.setApiKey(apiKey);
        this.logger.log('Email provider initialized: SendGrid');
        break;

      case 'smtp':
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT', 587);
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (!host || !user || !pass) {
          throw new Error(
            'SMTP_HOST, SMTP_USER, and SMTP_PASS are required when EMAIL_PROVIDER is smtp',
          );
        }

        this.smtpTransporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        this.logger.log(`Email provider initialized: SMTP (${host}:${port})`);
        break;

      case 'console':
      default:
        this.logger.warn(
          'Email provider: console (emails will be logged, not sent)',
        );
        break;
    }
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    const from = options.from || this.defaultFrom;

    try {
      switch (this.provider) {
        case 'sendgrid':
          return this.sendViaSendGrid({ ...options, from });

        case 'smtp':
          return this.sendViaSMTP({ ...options, from });

        case 'console':
        default:
          return this.sendViaConsole({ ...options, from });
      }
    } catch (error) {
      this.logger.error('Failed to send email', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(
    options: EmailOptions & { from: string },
  ): Promise<EmailResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg: any = {
      to: options.to,
      from: options.from,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    };

    // Use SendGrid template if provided
    if (options.templateId) {
      msg.templateId = options.templateId;
      msg.dynamicTemplateData = options.templateData;
    }

    // Add attachments
    if (options.attachments?.length) {
      msg.attachments = options.attachments.map((att) => ({
        filename: att.filename,
        content:
          typeof att.content === 'string'
            ? att.content
            : att.content.toString('base64'),
        type: att.contentType,
        disposition: 'attachment',
      }));
    }

    const [response] = await sgMail.send(msg);

    this.logger.debug(
      `Email sent via SendGrid to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
    );

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  }

  /**
   * Send email via SMTP
   */
  private async sendViaSMTP(
    options: EmailOptions & { from: string },
  ): Promise<EmailResult> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: options.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    };

    if (options.attachments?.length) {
      mailOptions.attachments = options.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      }));
    }

    const info = await this.smtpTransporter.sendMail(mailOptions);

    this.logger.debug(
      `Email sent via SMTP to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  }

  /**
   * Log email to console (development)
   */
  private async sendViaConsole(
    options: EmailOptions & { from: string },
  ): Promise<EmailResult> {
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    this.logger.log(`
========== EMAIL (Console Mode) ==========
From: ${options.from}
To: ${to}
Subject: ${options.subject}
ReplyTo: ${options.replyTo || 'N/A'}
-------------------------------------------
${options.text || options.html || '(no content)'}
==========================================
    `);

    return {
      success: true,
      messageId: `console_${Date.now()}`,
    };
  }

  // ==================== Template Methods ====================

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: 'Bem-vindo ao TrackPro!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00E4F2;">Bem-vindo ao TrackPro!</h1>
          <p>Oi ${name},</p>
          <p>Obrigado por se cadastrar no TrackPro. Estamos empolgados em ter você conosco!</p>
          <p>Com o TrackPro você pode:</p>
          <ul>
            <li>Rastrear eventos first-party sem bloqueio de adblockers</li>
            <li>Capturar leads automaticamente</li>
            <li>Integrar com Meta CAPI para conversões</li>
            <li>Visualizar analytics em tempo real</li>
          </ul>
          <p>
            <a href="${this.configService.get('FRONTEND_URL')}/dashboard"
               style="background: #00E4F2; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Dashboard
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Equipe TrackPro
          </p>
        </div>
      `,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<EmailResult> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    return this.send({
      to,
      subject: 'Redefinir senha - TrackPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00E4F2;">Redefinir Senha</h1>
          <p>Oi ${name},</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <p>
            <a href="${resetUrl}"
               style="background: #00E4F2; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Redefinir Senha
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Equipe TrackPro
          </p>
        </div>
      `,
    });
  }

  /**
   * Send lead notification email
   */
  async sendLeadNotificationEmail(
    to: string,
    leadData: {
      name?: string;
      email?: string;
      phone?: string;
      formName: string;
      projectName: string;
    },
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: `Novo Lead Capturado - ${leadData.formName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00E4F2;">Novo Lead Capturado!</h1>
          <p>Um novo lead foi capturado no projeto <strong>${leadData.projectName}</strong>:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Formulário:</strong> ${leadData.formName}</p>
            ${leadData.name ? `<p><strong>Nome:</strong> ${leadData.name}</p>` : ''}
            ${leadData.email ? `<p><strong>Email:</strong> ${leadData.email}</p>` : ''}
            ${leadData.phone ? `<p><strong>Telefone:</strong> ${leadData.phone}</p>` : ''}
          </div>
          <p>
            <a href="${this.configService.get('FRONTEND_URL')}/dashboard/leads"
               style="background: #00E4F2; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Todos os Leads
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            TrackPro - Lead Capture System
          </p>
        </div>
      `,
    });
  }

  /**
   * Send export ready notification
   */
  async sendExportReadyEmail(
    to: string,
    exportData: {
      type: string;
      downloadUrl: string;
      expiresAt: Date;
    },
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: `Seu export está pronto - TrackPro`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00E4F2;">Export Pronto!</h1>
          <p>Seu export de <strong>${exportData.type}</strong> está pronto para download.</p>
          <p>
            <a href="${exportData.downloadUrl}"
               style="background: #00E4F2; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Baixar Export
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Este link expira em ${exportData.expiresAt.toLocaleString('pt-BR')}.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Equipe TrackPro
          </p>
        </div>
      `,
    });
  }
}
