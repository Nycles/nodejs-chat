interface PostgresConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

interface AuthConfig {
  tokenSecretKey: string
  tokenLifeTime: string
}

interface AwsS3 {
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

interface FileUploading {
  maxSize: number
}

export interface Config {
  port: number
  auth: AuthConfig
  postgres: PostgresConfig
  awsS3: AwsS3
  fileUploading: FileUploading
}

export const config: Config = {
  port: parseInt(process.env.PORT || '8000', 10),

  auth: {
    tokenSecretKey: 'OgnqUpNa8R',
    tokenLifeTime: '7d',
  },

  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'chat-api',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
  },

  awsS3: {
    region: process.env.AWSS3_REGION || '',
    bucketName: process.env.AWSS3_BUCKET_NAME || '',
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },

  fileUploading: {
    maxSize: 2097152,
  },
}
