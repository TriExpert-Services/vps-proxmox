// Email notification service
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationOptions {
  to: string;
  template: string;
  variables?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

class NotificationService {
  private emailProvider: 'smtp' | 'sendgrid' | 'ses';
  private apiKey?: string;
  private config: any;

  constructor(provider: 'smtp' | 'sendgrid' | 'ses', config: any) {
    this.emailProvider = provider;
    this.config = config;
    this.apiKey = config.apiKey;
  }

  // Email templates
  private templates: Record<string, EmailTemplate> = {
    welcome: {
      subject: 'Welcome to CloudVPS Pro!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to CloudVPS Pro!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello {{name}},</p>
            <p>Welcome to CloudVPS Pro! Your account has been successfully created.</p>
            <p>You can now login to your dashboard and start deploying VPS instances.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Access Dashboard
              </a>
            </div>
            <p>If you have any questions, don't hesitate to contact our support team.</p>
            <p>Best regards,<br>CloudVPS Pro Team</p>
          </div>
        </div>
      `,
      text: `
        Welcome to CloudVPS Pro!
        
        Hello {{name}},
        
        Welcome to CloudVPS Pro! Your account has been successfully created.
        You can now login to your dashboard and start deploying VPS instances.
        
        Dashboard URL: {{dashboardUrl}}
        
        If you have any questions, don't hesitate to contact our support team.
        
        Best regards,
        CloudVPS Pro Team
      `,
    },
    vpsCreated: {
      subject: 'Your VPS is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10B981; color: white; padding: 20px; text-align: center;">
            <h1>Your VPS is Ready!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello {{name}},</p>
            <p>Great news! Your VPS "<strong>{{vpsName}}</strong>" has been successfully deployed and is now ready to use.</p>
            
            <div style="background: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Server Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Name:</strong> {{vpsName}}</li>
                <li><strong>IP Address:</strong> {{ipAddress}}</li>
                <li><strong>Operating System:</strong> {{operatingSystem}}</li>
                <li><strong>CPU Cores:</strong> {{cpuCores}}</li>
                <li><strong>RAM:</strong> {{ramSize}} GB</li>
                <li><strong>Storage:</strong> {{storageSize}} GB</li>
              </ul>
            </div>

            <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400E;">Login Information:</h3>
              <p><strong>SSH Access:</strong> ssh root@{{ipAddress}}</p>
              <p><strong>Root Password:</strong> {{rootPassword}}</p>
              <p style="color: #92400E; font-size: 14px;">Please change your root password after first login for security.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{vpsManagementUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Manage VPS
              </a>
            </div>

            <p>You can manage your VPS, monitor resources, and access the console from your dashboard.</p>
            <p>If you need any assistance, our support team is here to help 24/7.</p>
            <p>Best regards,<br>CloudVPS Pro Team</p>
          </div>
        </div>
      `,
      text: `
        Your VPS is Ready!
        
        Hello {{name}},
        
        Great news! Your VPS "{{vpsName}}" has been successfully deployed and is now ready to use.
        
        Server Details:
        - Name: {{vpsName}}
        - IP Address: {{ipAddress}}
        - Operating System: {{operatingSystem}}
        - CPU Cores: {{cpuCores}}
        - RAM: {{ramSize}} GB
        - Storage: {{storageSize}} GB
        
        Login Information:
        SSH Access: ssh root@{{ipAddress}}
        Root Password: {{rootPassword}}
        
        IMPORTANT: Please change your root password after first login for security.
        
        You can manage your VPS from: {{vpsManagementUrl}}
        
        If you need any assistance, our support team is here to help 24/7.
        
        Best regards,
        CloudVPS Pro Team
      `,
    },
    paymentReceived: {
      subject: 'Payment Confirmation - CloudVPS Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10B981; color: white; padding: 20px; text-align: center;">
            <h1>Payment Received</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello {{name}},</p>
            <p>We have successfully received your payment for CloudVPS Pro services.</p>
            
            <div style="background: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Payment Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Amount:</strong> ${{amount}}</li>
                <li><strong>Payment Method:</strong> {{paymentMethod}}</li>
                <li><strong>Transaction ID:</strong> {{transactionId}}</li>
                <li><strong>Date:</strong> {{paymentDate}}</li>
              </ul>
            </div>

            <p>Your services will be activated shortly. You'll receive another email once your VPS instances are ready.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{invoiceUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Invoice
              </a>
            </div>

            <p>Thank you for choosing CloudVPS Pro!</p>
            <p>Best regards,<br>CloudVPS Pro Team</p>
          </div>
        </div>
      `,
      text: `
        Payment Received - CloudVPS Pro
        
        Hello {{name}},
        
        We have successfully received your payment for CloudVPS Pro services.
        
        Payment Details:
        - Amount: ${{amount}}
        - Payment Method: {{paymentMethod}}
        - Transaction ID: {{transactionId}}
        - Date: {{paymentDate}}
        
        Your services will be activated shortly. You'll receive another email once your VPS instances are ready.
        
        View Invoice: {{invoiceUrl}}
        
        Thank you for choosing CloudVPS Pro!
        
        Best regards,
        CloudVPS Pro Team
      `,
    },
    maintenanceNotification: {
      subject: 'Scheduled Maintenance - CloudVPS Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #F59E0B; color: white; padding: 20px; text-align: center;">
            <h1>Scheduled Maintenance Notice</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello {{name}},</p>
            <p>We wanted to inform you about scheduled maintenance that may affect your VPS services.</p>
            
            <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <h3 style="margin-top: 0; color: #92400E;">Maintenance Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Start Time:</strong> {{startTime}}</li>
                <li><strong>End Time:</strong> {{endTime}} (estimated)</li>
                <li><strong>Affected Services:</strong> {{affectedServices}}</li>
                <li><strong>Expected Downtime:</strong> {{expectedDowntime}}</li>
              </ul>
            </div>

            <div style="background: #DBEAFE; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1E40AF;">What to Expect:</h3>
              <p>{{maintenanceDescription}}</p>
            </div>

            <p>We apologize for any inconvenience this may cause. Our team will work diligently to minimize downtime and complete the maintenance as quickly as possible.</p>
            <p>If you have any questions or concerns, please contact our support team.</p>
            <p>Best regards,<br>CloudVPS Pro Team</p>
          </div>
        </div>
      `,
      text: `
        Scheduled Maintenance Notice
        
        Hello {{name}},
        
        We wanted to inform you about scheduled maintenance that may affect your VPS services.
        
        Maintenance Details:
        - Start Time: {{startTime}}
        - End Time: {{endTime}} (estimated)
        - Affected Services: {{affectedServices}}
        - Expected Downtime: {{expectedDowntime}}
        
        What to Expect:
        {{maintenanceDescription}}
        
        We apologize for any inconvenience this may cause. Our team will work diligently to minimize downtime and complete the maintenance as quickly as possible.
        
        If you have any questions or concerns, please contact our support team.
        
        Best regards,
        CloudVPS Pro Team
      `,
    },
    supportTicketReply: {
      subject: 'Support Ticket Update - #{{ticketId}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1>Support Ticket Update</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello {{name}},</p>
            <p>Your support ticket <strong>#{{ticketId}}</strong> has been updated.</p>
            
            <div style="background: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Ticket Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Subject:</strong> {{ticketSubject}}</li>
                <li><strong>Status:</strong> {{ticketStatus}}</li>
                <li><strong>Priority:</strong> {{ticketPriority}}</li>
                <li><strong>Last Updated:</strong> {{lastUpdated}}</li>
              </ul>
            </div>

            <div style="background: white; border: 1px solid #E5E7EB; border-radius: 6px; margin: 20px 0;">
              <div style="background: #F9FAFB; padding: 10px 15px; border-bottom: 1px solid #E5E7EB;">
                <strong>New Reply from Support Team:</strong>
              </div>
              <div style="padding: 15px;">
                {{ticketReply}}
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{ticketUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Ticket
              </a>
            </div>

            <p>You can reply to this ticket by visiting your support center or by replying to this email.</p>
            <p>Best regards,<br>CloudVPS Pro Support Team</p>
          </div>
        </div>
      `,
      text: `
        Support Ticket Update - #{{ticketId}}
        
        Hello {{name}},
        
        Your support ticket #{{ticketId}} has been updated.
        
        Ticket Details:
        - Subject: {{ticketSubject}}
        - Status: {{ticketStatus}}
        - Priority: {{ticketPriority}}
        - Last Updated: {{lastUpdated}}
        
        New Reply from Support Team:
        {{ticketReply}}
        
        You can view and reply to this ticket at: {{ticketUrl}}
        
        Best regards,
        CloudVPS Pro Support Team
      `,
    },
  };

  // Send email notification
  async sendNotification(options: NotificationOptions): Promise<boolean> {
    try {
      const template = this.templates[options.template];
      if (!template) {
        throw new Error(`Template '${options.template}' not found`);
      }

      // Replace variables in template
      const processedTemplate = this.processTemplate(template, options.variables || {});

      switch (this.emailProvider) {
        case 'smtp':
          return await this.sendSMTPEmail(options.to, processedTemplate, options.attachments);
        case 'sendgrid':
          return await this.sendSendGridEmail(options.to, processedTemplate, options.attachments);
        case 'ses':
          return await this.sendSESEmail(options.to, processedTemplate, options.attachments);
        default:
          throw new Error('Unsupported email provider');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // Process template variables
  private processTemplate(template: EmailTemplate, variables: Record<string, any>): EmailTemplate {
    const processed = { ...template };

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processed.subject = processed.subject.replace(new RegExp(placeholder, 'g'), String(value));
      processed.html = processed.html.replace(new RegExp(placeholder, 'g'), String(value));
      processed.text = processed.text.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return processed;
  }

  // SMTP implementation
  private async sendSMTPEmail(to: string, template: EmailTemplate, attachments?: any[]): Promise<boolean> {
    // Implementation would use nodemailer or similar SMTP client
    console.log('Sending SMTP email to:', to, template.subject);
    return true; // Placeholder
  }

  // SendGrid implementation
  private async sendSendGridEmail(to: string, template: EmailTemplate, attachments?: any[]): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            subject: template.subject,
          }],
          from: { email: this.config.fromEmail, name: this.config.fromName },
          content: [
            { type: 'text/plain', value: template.text },
            { type: 'text/html', value: template.html },
          ],
          attachments: attachments?.map(att => ({
            filename: att.filename,
            content: Buffer.from(att.content).toString('base64'),
            type: att.contentType || 'application/octet-stream',
          })),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('SendGrid email failed:', error);
      return false;
    }
  }

  // AWS SES implementation
  private async sendSESEmail(to: string, template: EmailTemplate, attachments?: any[]): Promise<boolean> {
    // Implementation would use AWS SDK
    console.log('Sending SES email to:', to, template.subject);
    return true; // Placeholder
  }

  // Bulk email sending
  async sendBulkNotifications(recipients: string[], template: string, variables?: Record<string, any>): Promise<number> {
    let successCount = 0;

    for (const recipient of recipients) {
      const sent = await this.sendNotification({
        to: recipient,
        template,
        variables,
      });

      if (sent) {
        successCount++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return successCount;
  }

  // SMS notifications (placeholder for future implementation)
  async sendSMS(to: string, message: string): Promise<boolean> {
    // Implementation would use Twilio or similar SMS service
    console.log('Sending SMS to:', to, message);
    return true; // Placeholder
  }

  // Push notifications (placeholder for future implementation)
  async sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    // Implementation would use Firebase Cloud Messaging or similar
    console.log('Sending push notification to:', userId, title, body);
    return true; // Placeholder
  }
}

export default NotificationService;