// Shared dictionary shape + server error-code mapping for auth cards.

export type AuthDict = {
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  verifyTitle: string;
  verifySubtitle: string;
  resetTitle: string;
  resetSubtitle: string;
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  newPassword: string;
  code: string;
  codeSentTo: string;
  createPasswordHint: string;
  loginButton: string;
  registerButton: string;
  sendCode: string;
  resetButton: string;
  resend: string;
  changePhone: string;
  forgotPassword: string;
  noAccount: string;
  haveAccount: string;
  signUp: string;
  signIn: string;
  backHome: string;
  invalid: string;
  phoneTaken: string;
  invalidInput: string;
  invalidPhone: string;
  passwordMismatch: string;
  codeInvalid: string;
  codeExpired: string;
  tooManyAttempts: string;
  resendTooSoon: string;
  smsFailed: string;
  phoneNotFound: string;
  demoTitle: string;
  demoHint: string;
  demoFill: string;
};

export function errorMessage(code: string | undefined, dict: AuthDict): string | null {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return dict.invalid;
    case "PHONE_TAKEN":
      return dict.phoneTaken;
    case "INVALID_INPUT":
      return dict.invalidInput;
    case "INVALID_PHONE":
      return dict.invalidPhone;
    case "PASSWORD_MISMATCH":
      return dict.passwordMismatch;
    case "CODE_INVALID":
      return dict.codeInvalid;
    case "CODE_EXPIRED":
      return dict.codeExpired;
    case "TOO_MANY_ATTEMPTS":
      return dict.tooManyAttempts;
    case "RESEND_TOO_SOON":
      return dict.resendTooSoon;
    case "SMS_FAILED":
      return dict.smsFailed;
    case "PHONE_NOT_FOUND":
      return dict.phoneNotFound;
    default:
      return null;
  }
}
