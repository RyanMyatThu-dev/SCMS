import api from "./api";

/**
 * Login API
 */
export const loginAPI = async (credentials) => {
  const formattedCredentials = {
    emailOrMobile: credentials.email, // 🔥 IMPORTANT
    password: credentials.password,
  };

  const response = await api.post("/Auth/login", formattedCredentials, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

/**
 * Register API
 */
export const registerAPI = async (userData) => {
  const formattedData = {
    fullName: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role || "User",
  };

  const response = await api.post("/Auth/register", formattedData, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};
