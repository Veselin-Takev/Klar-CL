import crypto from 'crypto';

// In a real scenario, use a 32-byte key from environment variables
const ENCRYPTION_KEY = process.env.AUDIT_LOG_SECRET_KEY || 'default_secret_key_32_bytes_long_12345';
const IV_LENGTH = 16; 

export function encryptText(text: string) {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}
