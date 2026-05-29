import api from "./api";

const unwrapResult = (result) => {
  if (!result?.isSuccess) {
    const error = new Error(result?.message || "Request failed");
    error.response = { data: result };
    throw error;
  }

  return result.data;
};

const persistSession = (auth) => {
  const role = auth?.user?.roles?.[0]?.toLowerCase() || "patient";

  localStorage.setItem("token", auth?.accessToken || "");
  localStorage.setItem("refreshToken", auth?.refreshToken || "");
  localStorage.setItem("userRole", role);
  localStorage.setItem("userName", auth?.user?.name || "");
  localStorage.setItem("userId", String(auth?.user?.userId || ""));

  return {
    token: auth?.accessToken,
    refreshToken: auth?.refreshToken,
    role,
    user: auth?.user,
  };
};

export const loginAPI = async (credentials) => {
  const response = await api.post("/Auth/login", {
    emailOrMobile:
      credentials.emailOrMobile || credentials.mobileNo || credentials.email,
    password: credentials.password,
  });

  const auth = unwrapResult(response.data);
  return persistSession(auth);
};

export const registerAPI = async (userData) => {
  const mobileNo = userData.mobileNo?.trim() || "";
  const email = userData.email?.trim() || "";

  const response = await api.post("/Auth/register", {
    name: userData.name,
    mobileNo,
    email,
    password: userData.password,
  });

  const auth = unwrapResult(response.data);
  return persistSession(auth);
};

export const logoutAPI = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userId");
};

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("token"));
};
