import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password?: string; // Make password optional initially
}

// Helper functions to check password rules
const hasMinLength = (password: string) => password.length >= 8;
const hasLowercase = (password: string) => /[a-z]/.test(password);
const hasUppercase = (password: string) => /[A-Z]/.test(password);
const hasNumber = (password: string) => /[0-9]/.test(password);
const hasSymbol = (password: string) => /[^a-zA-Z0-9]/.test(password); // Check for non-alphanumeric

export function PasswordStrengthIndicator({ password = '' }: PasswordStrengthIndicatorProps) {
  // Updated checks array to match Firebase password policy requirements
  const checks = [
    { rule: hasMinLength, message: "Mínimo 8 caracteres" },
    { rule: hasLowercase, message: "Mínimo 1 letra minúscula" },
    { rule: hasUppercase, message: "Mínimo 1 letra maiúscula" },
    { rule: hasNumber, message: "Mínimo 1 número" },
    { rule: hasSymbol, message: "Mínimo 1 símbolo especial" },
  ];

  return (
    <div className="text-xs mt-1.5 space-y-1">
      {checks.map(({ rule, message }) => {
        const isValid = rule(password);
        return (
          <span
            key={message}
            className={cn(
              "flex items-center gap-1",
              isValid ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {isValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {message}
          </span>
        );
      })}
    </div>
  );
}
