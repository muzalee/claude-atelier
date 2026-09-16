import { randomUUID } from "node:crypto";

export type Session = {
  id: string;
  userId: string;
  createdAt: Date;
};

const sessions = new Map<string, Session>();

export function createSession(userId: string): Session {
  const session = { id: randomUUID(), userId, createdAt: new Date() };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}
