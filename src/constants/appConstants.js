import dotenv from 'dotenv';
dotenv.config();

export const APP_CONSTANTS = Object.freeze({
  APP_NAME: process.env.APP_NAME || 'Nhai',
  PORT: process.env.PORT || 3004,
  VERSION: process.env.VERSION || '1.0.0',
});

export const STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  DRAFT: "Draft",
  // Add more statuses if needed
});