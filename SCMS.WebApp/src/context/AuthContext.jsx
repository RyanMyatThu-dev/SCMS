import { createContext, useContext, useMemo, useState } from "react";
import { authApi } from "../services/scmsApi";

const AuthContext = createContext(null);

const readJson = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const pickToken = (data) =>
  data?.accessToken ||
  data?.access_token ||
  data?.token ||
  data?.data?.accessToken ||
  data?.data?.access_token ||
  data?.data?.token ||
  data?.result?.accessToken ||
  data?.result?.token ||
  "";

const pickRefreshToken = (data) =>
  data?.refreshToken ||
  data?.refresh_token ||
  data?.data?.refreshToken ||
  data?.result?.refreshToken ||
  "";

const pickUser = (data, email) => {
  const user = data?.user || data?.data?.user || data?.result?.user || {};
  const rawRoles = user?.roles || data?.roles || data?.data?.roles || [];
  const roles = Array.isArray(rawRoles)
    ? rawRoles.map((r) => String(r).toLowerCase().trim()).filter(Boolean)
    : typeof rawRoles === "string" && rawRoles
    ? [rawRoles.toLowerCase().trim()]
    : [];

  const primaryRole = roles[0] || (user?.role ? String(user.role).toLowerCase().trim() : "user");

  return {
    ...user,
    userId: user?.userId || user?.id || null,
    name: user?.name || user?.fullName || (email ? email.split("@")[0] : "User"),
    email: user?.email || email || "",
    mobileNo: user?.mobileNo || user?.phone || "",
    roles: roles.length > 0 ? roles : [primaryRole],
    role: primaryRole,
  };
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("scms_token") || localStorage.getItem("token") || ""
  );
  const [user, setUser] = useState(readJson("scms_user", null));

  const login = async ({ emailOrMobile, email, password, roleHint }) => {
    const loginId = emailOrMobile || email;
    const data = await authApi.login({
      emailOrMobile: loginId,
      password: password,
    });
    const nextToken = pickToken(data);
    const nextRefreshToken = pickRefreshToken(data);

    if (!nextToken) {
      throw new Error("Token not found in login response.");
    }

    const nextUser = pickUser(data, loginId);
    if (roleHint && (roleHint === "doctor" || roleHint === "user") && nextUser.roles.length === 0) {
      nextUser.role = roleHint;
      nextUser.roles = [roleHint];
    }

    localStorage.setItem("scms_token", nextToken);
    localStorage.setItem("token", nextToken);
    if (nextRefreshToken) {
      localStorage.setItem("scms_refresh_token", nextRefreshToken);
    }
    localStorage.setItem("scms_user", JSON.stringify(nextUser));
    localStorage.setItem("userRole", nextUser.role);
    setToken(nextToken);
    setUser(nextUser);

    return nextUser;
  };

  const register = async (payload) => authApi.register(payload);

  const logout = () => {
    const storedRefreshToken = localStorage.getItem("scms_refresh_token") || "";
    try {
      if (storedRefreshToken) {
        authApi.logout({ refreshToken: storedRefreshToken }).catch(() => {});
      }
    } catch {
      // Graceful local sign-out
    } finally {
      localStorage.removeItem("scms_token");
      localStorage.removeItem("token");
      localStorage.removeItem("scms_refresh_token");
      localStorage.removeItem("scms_user");
      localStorage.removeItem("userRole");
      setToken("");
      setUser(null);
    }
  };

  const isOwner = useMemo(() => {
    const roles = user?.roles || [user?.role];
    return roles.some((r) => ["admin", "owner", "staff"].includes(String(r).toLowerCase()));
  }, [user]);

  const isDoctor = useMemo(() => {
    const roles = user?.roles || [user?.role];
    return roles.some((r) => String(r).toLowerCase() === "doctor");
  }, [user]);

  const isPatient = useMemo(() => {
    const roles = user?.roles || [user?.role];
    return roles.some((r) => ["user", "patient"].includes(String(r).toLowerCase()));
  }, [user]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isOwner,
      isDoctor,
      isPatient,
      login,
      logout,
      register,
    }),
    [token, user, isOwner, isDoctor, isPatient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
