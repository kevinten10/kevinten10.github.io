export type Env = {
  DB: D1Database;
  SITE_KV: KVNamespace;
  ASSETS: R2Bucket;
  EVENTS_QUEUE?: Queue<QueueEvent>;
  AI?: {
    run(model: string, input: Record<string, unknown>): Promise<unknown>;
  };
  AI_MODEL?: string;
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
  ADMIN_EMAILS: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_API_VERSION?: string;
  SITE_ORIGIN?: string;
  ALLOWED_ORIGINS?: string;
};

export type QueueEvent =
  | { type: 'page_view'; pagePath: string; sessionId: string; visitorKey?: string; createdAt: string }
  | { type: 'comment_created'; pagePath: string; commentId: string; status: string; createdAt: string }
  | { type: 'reward_created'; rewardId: string; status: string; createdAt: string };

export type AuthUser = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  role: 'visitor' | 'admin' | 'moderator';
  userId?: string;
};

export type Variables = {
  authUser?: AuthUser;
};
