/**
 * Authentication Configuration
 * Defines roles, permissions, and authentication settings for the platform
 */

export type UserRole = 'SERVICE_PROVIDER' | 'SALES_PARTNER' | 'ADMIN' | 'USER';

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  twoFA: {
    enabled: boolean;
    requiredRoles: UserRole[];
    codeLength: number;
    expiresIn: number; // in seconds
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  loginAttempts: {
    maxAttempts: number;
    lockoutDuration: number; // in minutes
  };
}

export const authConfig: AuthConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '24h',
    refreshExpiresIn: '7d',
  },
  twoFA: {
    enabled: true,
    requiredRoles: ['ADMIN'], // Only admins require 2FA
    codeLength: 6,
    expiresIn: 600, // 10 minutes
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  loginAttempts: {
    maxAttempts: 5,
    lockoutDuration: 15,
  },
};

/**
 * Role-based permissions
 */
export const rolePermissions: Record<UserRole, string[]> = {
  SERVICE_PROVIDER: [
    'manage:own-profile',
    'manage:own-services',
    'view:bookings',
    'manage:own-bookings',
    'communicate:clients',
    'view:earnings',
    'manage:availability',
  ],
  SALES_PARTNER: [
    'view:referrals',
    'manage:referral-links',
    'view:commissions',
    'view:statistics',
    'communicate:team',
    'view:leaderboard',
  ],
  ADMIN: [
    'manage:all-users',
    'manage:all-services',
    'manage:platform-settings',
    'view:all-analytics',
    'manage:content',
    'manage:api-keys',
    'manage:ai-config',
    'view:logs',
    'manage:financial',
    'manage:moderators',
  ],
  USER: [
    'browse:services',
    'book:services',
    'view:own-bookings',
    'communicate:providers',
    'manage:own-profile',
    'leave:reviews',
  ],
};

/**
 * Email templates for authentication
 */
export const emailTemplates = {
  welcome: {
    subject: '欢迎加入优服佳',
    template: 'welcome',
  },
  verification: {
    subject: '验证您的邮箱地址',
    template: 'email-verification',
  },
  passwordReset: {
    subject: '重置您的密码',
    template: 'password-reset',
  },
  twoFACode: {
    subject: '您的两步验证码',
    template: 'two-fa-code',
  },
  loginAlert: {
    subject: '新登录警报',
    template: 'login-alert',
  },
};

/**
 * Role-specific login configurations
 */
export const roleLoginConfig: Record<UserRole, {
  name: string;
  color: string;
  icon: string;
  redirectPath: string;
  description: string;
}> = {
  SERVICE_PROVIDER: {
    name: '服务商',
    color: 'from-blue-500 to-cyan-500',
    icon: 'briefcase',
    redirectPath: '/dashboard/service-provider',
    description: '提供各类服务的专业人士',
  },
  SALES_PARTNER: {
    name: '销售合伙人',
    color: 'from-green-500 to-emerald-500',
    icon: 'users',
    redirectPath: '/dashboard/sales-partner',
    description: '通过推荐客户获得佣金的合伙人',
  },
  ADMIN: {
    name: '网站管理员',
    color: 'from-purple-500 to-pink-500',
    icon: 'shield',
    redirectPath: '/admin',
    description: '平台管理员，负责平台运营',
  },
  USER: {
    name: '普通用户',
    color: 'from-orange-500 to-red-500',
    icon: 'user',
    redirectPath: '/home',
    description: '浏览和预约服务',
  },
};

/**
 * Session configuration
 */
export const sessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { passwordPolicy } = authConfig;

  if (password.length < passwordPolicy.minLength) {
    errors.push(`密码长度至少${passwordPolicy.minLength}个字符`);
  }

  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }

  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }

  if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
    errors.push('密码必须包含特殊字符 (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if role requires 2FA
 */
export function requiresTwoFA(role: UserRole): boolean {
  return authConfig.twoFA.requiredRoles.includes(role);
}

/**
 * Get redirect path based on role
 */
export function getRedirectPath(role: UserRole): string {
  return roleLoginConfig[role]?.redirectPath || '/home';
}
