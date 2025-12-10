import { 
  getAuth, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  verifyBeforeUpdateEmail,
  type User
} from 'firebase/auth';

// Nota: A inicialização do Firebase (firebase/app) deve ocorrer em um ponto central da aplicação.

/**
 * Realiza o login de um usuário com e-mail e senha usando o Firebase Auth.
 */
export const nxSignInWithEmailAndPassword = (email: string, password: string) => {
  const auth = getAuth();
  return firebaseSignInWithEmailAndPassword(auth, email, password);
};

/**
 * Inicia o fluxo de login com o provedor do Google usando um Popup.
 */
export const nxSignInWithGoogle = () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

/**
 * Cria um novo usuário com e-mail e senha usando o Firebase Auth.
 */
export const nxCreateUserWithEmailAndPassword = (email: string, password: string) => {
  const auth = getAuth();
  return firebaseCreateUserWithEmailAndPassword(auth, email, password);
};

/**
 * Envia um e-mail de redefinição de senha para o endereço fornecido.
 */
export const nxSendPasswordResetEmail = (email: string) => {
  const auth = getAuth();
  return firebaseSendPasswordResetEmail(auth, email);
};

/**
 * Envia um e-mail de verificação para o usuário fornecido.
 */
export const nxSendEmailVerification = (user: User) => {
  return firebaseSendEmailVerification(user);
};

/**
 * Reautentica o usuário e atualiza sua senha.
 */
export const nxChangePassword = async (currentPassword: string, newPassword: string) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("User not authenticated");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

/**
 * Reautentica o usuário e inicia o fluxo de verificação para um novo e-mail.
 */
export const nxChangeEmail = async (currentPassword: string, newEmail: string) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("User not authenticated");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await verifyBeforeUpdateEmail(user, newEmail);
};
