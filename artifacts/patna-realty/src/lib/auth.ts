import { User } from "@workspace/api-client-react";

export interface Session {
  user: User;
  token: string;
  role: User["role"];
}

const SESSION_KEY = "realty_session";

export const getSession = (): Session | null => {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setSession = (session: Session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
