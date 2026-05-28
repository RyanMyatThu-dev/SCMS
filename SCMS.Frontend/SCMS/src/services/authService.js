import api from "./api";

/**
 * Mobile Number နှင့် Password ကို အသုံးပြု၍ Login ဝင်ရန်
 @param {Object} credentials - { mobileNo, password }
 */
export const loginAPI = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data; // Backend က { token, role, user } စတာတွေ ပြန်ပေးရပါမည်
};

/**
 * အကောင့်အသစ် ဖွင့်ရန် (Patient/User အတွက်)
 * @param {Object} userData - { name, mobileNo, password, role }
 */
export const registerAPI = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};
