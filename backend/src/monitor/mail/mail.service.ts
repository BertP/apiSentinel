import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: Number(this.configService.get<number>('SMTP_PORT')) || 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
            tls: {
                rejectUnauthorized: false, // Useful for certain hosting providers
            },
        });
    }

    async sendAlertEmail(recipients: string[], endpoint: string, error: string) {
        if (!recipients.length) return;

        const from = this.configService.get<string>('SMTP_FROM') || 'api-sentinel@status.local';

        try {
            await this.transporter.sendMail({
                from,
                to: recipients.join(', '),
                subject: `⚠️ API Alert: ${endpoint} failed`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff4444; border-radius: 8px;">
            <h2 style="color: #ff4444;">API Monitoring Alert</h2>
            <p>The following endpoint has reported an error:</p>
            <div style="background: #f8f8f8; padding: 10px; border-radius: 4px; font-family: monospace;">
              <strong>Endpoint:</strong> ${endpoint}<br>
              <strong>Error:</strong> ${error}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This is an automated message from your API Sentinel.
            </p>
          </div>
        `,
            });
            this.logger.log(`Alert email sent for ${endpoint} to ${recipients.length} recipients`);
        } catch (err) {
            this.logger.error(`Failed to send alert email: ${err.message}`);
        }
    }

    async sendDailyReport(recipients: string[], stats: any[]) {
        if (!recipients.length) return;

        const from = this.configService.get<string>('SMTP_FROM') || 'api-sentinel@status.local';
        const date = new Date().toLocaleDateString('de-DE');

        const tableRows = stats
            .map(
                (s) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.method} ${s.path}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${s.count}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: ${s.successRate < 100 ? '#ff4444' : '#22c55e'}">${s.successRate.toFixed(1)}%</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${s.avgLatency.toFixed(0)} ms</td>
      </tr>`,
            )
            .join('');

        try {
            await this.transporter.sendMail({
                from,
                to: recipients.join(', '),
                subject: `📊 API Sentinel Daily Report: ${date}`,
                html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #3b82f6;">Daily Monitoring Summary</h2>
            <p>Summary of API health for ${date}:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 8px; text-align: left;">Endpoint</th>
                  <th style="padding: 8px; text-align: center;">Checks</th>
                  <th style="padding: 8px; text-align: center;">Success Rate</th>
                  <th style="padding: 8px; text-align: right;">Avg Latency</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <p style="margin-top: 20px; font-size: 11px; color: #94a3b8;">
              Target recipients: ${recipients.join(', ')}
            </p>
          </div>
        `,
            });
            this.logger.log(`Daily report email sent to ${recipients.length} recipients`);
        } catch (err) {
            this.logger.error(`Failed to send daily report: ${err.message}`);
        }
    }
}
