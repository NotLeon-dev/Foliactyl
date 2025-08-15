import nodemailer from 'nodemailer';
import { settings } from '../handlers/readSettings.js';

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

export const mailer = transport;
export default transport;

export function getMailer() {
  return transport;
}