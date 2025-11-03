-- Add password reset email type for logging
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';
