"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { Role } from "./types";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type LoginOutcome =
  | { mfaRequired: true; mfaToken: string }
  | { mfaRequired: false; user: AuthUser };

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  verifyOtp: (mfaToken: string, code: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "des.auth.tokens";

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

function readStoredTokens(): StoredTokens | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

function persistTokens(tokens: StoredTokens) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Session just won't survive a reload -- not fatal.
  }
}

function clearStoredTokens() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredTokens();
    if (!stored) {
      setStatus("unauthenticated");
      return;
    }

    api
      .getMe(stored.accessToken)
      .then((me) => {
        setUser(me);
        setAccessToken(stored.accessToken);
        setStatus("authenticated");
      })
      .catch(async () => {
        // Access token likely expired -- try the refresh token once before
        // giving up and sending the user back to /login.
        try {
          const { accessToken: refreshed } = await api.refresh(stored.refreshToken);
          const me = await api.getMe(refreshed);
          persistTokens({ accessToken: refreshed, refreshToken: stored.refreshToken });
          setUser(me);
          setAccessToken(refreshed);
          setStatus("authenticated");
        } catch {
          clearStoredTokens();
          setStatus("unauthenticated");
        }
      });
  }, []);

  async function login(email: string, password: string): Promise<LoginOutcome> {
    const result = await api.login(email, password);
    if (result.mfaRequired) {
      return { mfaRequired: true, mfaToken: result.mfaToken! };
    }

    const tokens = {
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken!,
    };
    const me = await api.getMe(tokens.accessToken);
    persistTokens(tokens);
    setUser(me);
    setAccessToken(tokens.accessToken);
    setStatus("authenticated");
    return { mfaRequired: false, user: me };
  }

  async function verifyOtp(mfaToken: string, code: string): Promise<AuthUser> {
    const tokens = await api.verifyOtp(mfaToken, code);
    const me = await api.getMe(tokens.accessToken);
    persistTokens(tokens);
    setUser(me);
    setAccessToken(tokens.accessToken);
    setStatus("authenticated");
    return me;
  }

  function logout() {
    clearStoredTokens();
    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
  }

  const value = useMemo(
    () => ({ status, user, accessToken, login, verifyOtp, logout }),
    [status, user, accessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
