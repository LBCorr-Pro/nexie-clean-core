export async function sendCustomVerificationEmail(email: string, userName: string, verificationLink: string): Promise<void> {
  // Em um ambiente real, você usaria um serviço como SendGrid, Resend, ou Nodemailer.
  console.log("--- SIMULATING EMAIL SENDING ---");
  console.log(`To: ${email}`);
  console.log(`Subject: Verifique seu endereço de e-mail`);
  console.log(`Body: Olá ${userName}, por favor, verifique seu e-mail clicando neste link: ${verificationLink}`);
  console.log("----------------------------------");

  // Simula uma pequena demora de rede.
  await new Promise(resolve => setTimeout(resolve, 500));

  // Retorna uma promessa resolvida para indicar sucesso.
  return Promise.resolve();
}
