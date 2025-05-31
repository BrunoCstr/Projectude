import * as z from 'zod';

// Reusable password strength schema matching the Firebase Auth settings
export const passwordStrengthSchema = z.string()
  .min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
  .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." })
  .regex(/[^a-zA-Z0-9]/, { message: "A senha deve conter pelo menos um símbolo especial (ex: !@#$%^&*)." });
  // Note: Max length (150) is usually not enforced client-side, but Firebase handles it.

// Schema for Login
export const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um endereço de e-mail válido." }).trim(),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
  rememberMe: z.boolean().optional(), // Firebase handles persistence, but keep for UI
});
export type LoginFormData = z.infer<typeof loginSchema>;

// Schema for Signup with password validation
export const signupSchema = z.object({
    name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).trim(),
    email: z.string().email({ message: "Por favor, insira um endereço de e-mail válido." }).trim(),
    password: passwordStrengthSchema, // Apply the reusable strength schema
    confirmPassword: z.string(),
    terms: z.boolean().refine(val => val === true, {
        message: "Você deve aceitar os termos e condições.",
    }),
}).refine(data => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"], // Apply error to confirmPassword field
});
export type SignupFormData = z.infer<typeof signupSchema>;

// Schema for password change form validation
export const passwordChangeSchema = z.object({
  currentPassword: z.string().optional(), // Make optional on client, verify on server/Firebase if needed
  newPassword: passwordStrengthSchema, // Apply the reusable strength schema
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As novas senhas não coincidem.",
  path: ["confirmPassword"], // Set error on confirmPassword field
});
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Schema for forgot password form validation
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um endereço de e-mail válido." }).trim(),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
