import nodemailer from 'nodemailer';
import { settings } from './readSettings.js';

const settingsData = settings();

const transport = nodemailer.createTransport({
  host: settingsData.smtp.host,
  port: settingsData.smtp.port,
  secure: true,
  auth: {
    user: settingsData.smtp.username,
    pass: settingsData.smtp.password
  }
});

// Keep a default transport export for direct imports
export default transport;

// Backwards-compatible function for CommonJS callers that expect mailer()
export function mailer() {
  return transport;
}

export const mailerTransport = transport;

export function getMailer() {
  return transport;
}