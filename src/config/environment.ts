// Environment configuration
export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    port: number;
    baseUrl: string;
    debug: boolean;
  };
  proxmox: {
    host: string;
    port: number;
    username: string;
    password: string;
    realm: string;
    protocol: 'http' | 'https';
    timeout: number;
    retries: number;
  };
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
    poolSize: number;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    apiVersion: string;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      username: string;
      password: string;
    };
    sendgrid?: {
      apiKey: string;
    };
    ses?: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
    from: {
      email: string;
      name: string;
    };
  };
  security: {
    jwtSecret: string;
    jwtExpiration: string;
    bcryptRounds: number;
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
    };
    corsOrigins: string[];
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsEndpoint?: string;
    alerting?: {
      webhookUrl?: string;
      slackChannel?: string;
    };
  };
  features: {
    autoProvisioning: boolean;
    backupScheduling: boolean;
    usageBilling: boolean;
    multipleOS: boolean;
    customNetworking: boolean;
    apiAccess: boolean;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  app: {
    name: 'CloudVPS Pro',
    version: '1.0.0',
    environment: 'development',
    port: 3000,
    baseUrl: 'http://localhost:3000',
    debug: true,
  },
  proxmox: {
    host: process.env.PROXMOX_HOST || 'localhost',
    port: parseInt(process.env.PROXMOX_PORT || '8006'),
    username: process.env.PROXMOX_USERNAME || 'root',
    password: process.env.PROXMOX_PASSWORD || '',
    realm: process.env.PROXMOX_REALM || 'pam',
    protocol: (process.env.PROXMOX_PROTOCOL as 'http' | 'https') || 'https',
    timeout: 30000,
    retries: 3,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'cloudvps',
    username: process.env.DB_USERNAME || 'cloudvps',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  },
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: '2023-10-16',
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'ses') || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
    ses: {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@cloudvpspro.com',
      name: process.env.FROM_NAME || 'CloudVPS Pro',
    },
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    metricsEndpoint: process.env.METRICS_ENDPOINT,
    alerting: {
      webhookUrl: process.env.ALERTING_WEBHOOK_URL,
      slackChannel: process.env.SLACK_CHANNEL,
    },
  },
  features: {
    autoProvisioning: process.env.FEATURE_AUTO_PROVISIONING !== 'false',
    backupScheduling: process.env.FEATURE_BACKUP_SCHEDULING !== 'false',
    usageBilling: process.env.FEATURE_USAGE_BILLING === 'true',
    multipleOS: process.env.FEATURE_MULTIPLE_OS !== 'false',
    customNetworking: process.env.FEATURE_CUSTOM_NETWORKING === 'true',
    apiAccess: process.env.FEATURE_API_ACCESS === 'true',
  },
};

// Environment-specific overrides
const environmentConfigs: Record<string, Partial<AppConfig>> = {
  production: {
    app: {
      environment: 'production',
      debug: false,
      baseUrl: process.env.PRODUCTION_BASE_URL || 'https://your-domain.com',
    },
    monitoring: {
      enabled: true,
      logLevel: 'warn',
    },
  },
  staging: {
    app: {
      environment: 'staging',
      debug: true,
      baseUrl: process.env.STAGING_BASE_URL || 'https://staging.your-domain.com',
    },
    monitoring: {
      enabled: true,
      logLevel: 'info',
    },
  },
};

// Merge configurations
export function getConfig(): AppConfig {
  const environment = process.env.NODE_ENV || 'development';
  const environmentConfig = environmentConfigs[environment] || {};
  
  return {
    ...defaultConfig,
    ...environmentConfig,
    app: {
      ...defaultConfig.app,
      ...environmentConfig.app,
    },
    proxmox: {
      ...defaultConfig.proxmox,
      ...environmentConfig.proxmox,
    },
    database: {
      ...defaultConfig.database,
      ...environmentConfig.database,
    },
    stripe: {
      ...defaultConfig.stripe,
      ...environmentConfig.stripe,
    },
    email: {
      ...defaultConfig.email,
      ...environmentConfig.email,
    },
    security: {
      ...defaultConfig.security,
      ...environmentConfig.security,
    },
    monitoring: {
      ...defaultConfig.monitoring,
      ...environmentConfig.monitoring,
    },
    features: {
      ...defaultConfig.features,
      ...environmentConfig.features,
    },
  };
}

// Validate configuration
export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];

  // Required Proxmox configuration
  if (!config.proxmox.host) {
    errors.push('PROXMOX_HOST is required');
  }
  if (!config.proxmox.password) {
    errors.push('PROXMOX_PASSWORD is required');
  }

  // Required Stripe configuration for production
  if (config.app.environment === 'production') {
    if (!config.stripe.publishableKey) {
      errors.push('STRIPE_PUBLISHABLE_KEY is required in production');
    }
    if (!config.stripe.secretKey) {
      errors.push('STRIPE_SECRET_KEY is required in production');
    }
    if (!config.stripe.webhookSecret) {
      errors.push('STRIPE_WEBHOOK_SECRET is required in production');
    }
  }

  // Email configuration
  if (config.email.provider === 'smtp' && config.email.smtp) {
    if (!config.email.smtp.host) {
      errors.push('SMTP_HOST is required when using SMTP provider');
    }
  } else if (config.email.provider === 'sendgrid' && config.email.sendgrid) {
    if (!config.email.sendgrid.apiKey) {
      errors.push('SENDGRID_API_KEY is required when using SendGrid provider');
    }
  }

  // Security configuration
  if (config.security.jwtSecret === 'your-super-secret-jwt-key') {
    errors.push('JWT_SECRET should be changed from default value');
  }

  return errors;
}

export const config = getConfig();