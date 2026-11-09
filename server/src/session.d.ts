import "express-session";

declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
  }
}

declare global {
  namespace Express {
    interface Locals {
      accessNote?: string;
    }
  }
}
