/**
 * Password strength validation utilities
 * Implements security best practices for password policies
 */

export interface PasswordStrength {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  meetsMinimum: boolean;
}

export interface PasswordRequirement {
  met: boolean;
  label: string;
}

/**
 * Check if password meets minimum requirements
 * - At least 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const checkPasswordRequirements = (password: string): PasswordRequirement[] => {
  return [
    {
      met: password.length >= 12,
      label: 'At least 12 characters'
    },
    {
      met: /[A-Z]/.test(password),
      label: 'One uppercase letter'
    },
    {
      met: /[a-z]/.test(password),
      label: 'One lowercase letter'
    },
    {
      met: /[0-9]/.test(password),
      label: 'One number'
    },
    {
      met: /[^A-Za-z0-9]/.test(password),
      label: 'One special character (!@#$%^&*)'
    }
  ];
};

/**
 * Calculate password strength score
 * Returns 0-100 score and categorization
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      level: 'weak',
      feedback: ['Enter a password'],
      meetsMinimum: false
    };
  }

  const requirements = checkPasswordRequirements(password);
  const metCount = requirements.filter(r => r.met).length;
  
  let score = 0;
  const feedback: string[] = [];

  // Base score from requirements (60 points max)
  score += (metCount / requirements.length) * 60;

  // Length bonus (20 points max)
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 5;
  if (password.length >= 20) score += 5;

  // Complexity bonus (20 points max)
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars / 2, 10);

  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }
  if (/^[0-9]+$/.test(password)) {
    score -= 20;
    feedback.push('Avoid only numbers');
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 10;
    feedback.push('Add numbers and special characters');
  }
  if (/^(password|123456|qwerty|admin)/i.test(password)) {
    score -= 30;
    feedback.push('Avoid common passwords');
  }

  // Sequential characters penalty
  if (/abc|bcd|cde|123|234|345/i.test(password)) {
    score -= 10;
    feedback.push('Avoid sequential characters');
  }

  score = Math.max(0, Math.min(100, score));

  // Add unmet requirements to feedback
  requirements.forEach(req => {
    if (!req.met) {
      feedback.push(req.label);
    }
  });

  let level: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 40) level = 'weak';
  else if (score < 60) level = 'fair';
  else if (score < 80) level = 'good';
  else level = 'strong';

  const meetsMinimum = requirements.every(r => r.met);

  if (meetsMinimum && feedback.length === 0) {
    feedback.push('Strong password!');
  }

  return {
    score,
    level,
    feedback,
    meetsMinimum
  };
};

/**
 * Get color based on password strength level
 */
export const getStrengthColor = (level: PasswordStrength['level']): string => {
  switch (level) {
    case 'weak': return 'hsl(var(--destructive))';
    case 'fair': return 'hsl(var(--warning))';
    case 'good': return 'hsl(var(--success))';
    case 'strong': return 'hsl(var(--success))';
  }
};
