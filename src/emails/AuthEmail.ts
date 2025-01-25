import { transport } from "../config/nodemailer";

type EmailType = {
  name: string;
  email: string;
  token: string;
};

export class AuthEmail {
  static sendConfirmationEmail = async (user: EmailType) => {
    const email = await transport.sendMail({
      from: "CashTrackr <admin@cashtrackr.com>",
      to: user.email,
      subject: "CashTrackr - Confirma tu cuenta",
      html: `
        <p>Hola ${user.name}, haz creado tu cuenta en CashTrackr</p>
        <p>Visita el siguiente enlace:</p>
        <a href="#">Confirmar cuenta</a>
        <p>E ingresa el código: <b>${user.token}</b></p>
      `,
    });
    console.log("Mensaje enviado", email.messageId);
  };

  static sendPasswordResetToken = async (user: EmailType) => {
    const email = await transport.sendMail({
      from: "CashTrackr <admin@cashtrackr.com>",
      to: user.email,
      subject: "CashTrackr - Restablece tu password",
      html: `
        <p>Hola ${user.name}, haz solicitado reestablecer tu password</p>
        <p>Visita el siguiente enlace:</p>
        <a href="#">Reestablecer password</a>
        <p>E ingresa el código: <b>${user.token}</b></p>
      `,
    });
    console.log("Mensaje enviado", email.messageId);
  };
}

