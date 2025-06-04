import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import * as path from 'path';
import * as fs from 'fs';
import 'dotenv/config';
import { MailerService } from '@nestjs-modules/mailer';

interface ContactData {
  name: string;
  email: string;
  message: string;
}

@Injectable()
export class ContactService {
  constructor(
    private readonly mailerService: MailerService) {
  }

  async send({ name, email, message }: ContactData) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Ingrese un correo válido.');
    }

    await this.envioEmail(name, email, message);

    return {
      message: 'Mensaje enviado correctamente.',
    };
  }

  async envioEmail(name, email, message) {
    let filePath: string;

    filePath = path.resolve(process.cwd(), 'src/contact/plantillaMessage.html');

    const htmlTemplate = fs.readFileSync(filePath, 'utf8');
    const personalizedHtml = htmlTemplate
      .replace('{{name}}', name)
      .replace('{{email}}', email)
      .replace('{{message}}', message);

    await this.mailerService.sendMail({
      to: process.env.GMAIL_USER,
      subject: 'Correo de truequemania',
      html: personalizedHtml,
    });
  }

  async newsletter({ email }: { email: string }) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Ingrese un correo válido.');
    }

    await this.envioEmailSuscribe(email);

    return {
      message: 'Suscrito correctamente.',
    };
  }

  async envioEmailSuscribe(email) {
    let filePath: string;

    filePath = path.resolve(
      process.cwd(),
      'src/contact/plantillaNewsLetter.html',
    );

    const htmlTemplate = fs.readFileSync(filePath, 'utf8');
    const personalizedHtml = htmlTemplate.replace('{{email}}', email);

    await this.mailerService.sendMail({
      to: process.env.GMAIL_USER,
      subject: 'Correo de truequemania',
      html: personalizedHtml,
    });
  }

  async envioEmailTool(destinatarioEmail, subject, message) {
    let filePath: string;

    filePath = path.resolve(
      process.cwd(),
      'src/contact/plantillaMessageTool.html',
    );

    const htmlTemplate = fs.readFileSync(filePath, 'utf8');
    const personalizedHtml = htmlTemplate
      .replace('{{subject}}', subject)
      .replace('{{message}}', message);

    await this.mailerService.sendMail({
      to: destinatarioEmail,
      subject: 'Correo de truequemania',
      html: personalizedHtml,
    });
  }

}
