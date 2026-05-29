import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../../../services/authService";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";

const PRIMARY = "#0052CC";
const PRIMARY_DARK = "#003D99";
const PRIMARY_LIGHT = "#EBF2FF";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";
const DANGER = "#D92D20";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("dr.thandar@scms.demo");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      Swal.fire({
        title: "Required",
        text: "Please enter email and password.",
        icon: "warning",
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    try {
      setLoading(true);

      const data = await loginAPI({
        email: email.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", data);

      const token =
        data?.accessToken ||
        data?.access_token ||
        data?.token ||
        data?.data?.accessToken ||
        data?.data?.access_token ||
        data?.data?.token ||
        data?.result?.accessToken ||
        data?.result?.token;

      const user = data?.user || data?.data?.user || data?.result?.user || {};
      const roles = user?.roles || data?.roles || data?.data?.roles || [];
      const userRole = String(
        roles?.[0] || user?.role || "admin",
      ).toLowerCase();

      if (!token) {
        throw new Error("Token not found in login response");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("user", JSON.stringify(user));

      navigate(userRole === "admin" ? "/admin/dashboard" : "/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Login Error:", error);

      Swal.fire({
        title: "Login Failed",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Email or password is incorrect.",
        icon: "error",
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <main className="login-page">
        <section className="login-left">
          <div className="brand-card">
            <div className="logo-box">S</div>
            <h1>SCMS Portal</h1>
            <p>
              Smart Clinic Management System for appointments, EMR,
              prescriptions, medicines, payments and reports.
            </p>

            <div className="feature-list">
              <div>
                <ShieldCheck size={18} />
                Secure admin login
              </div>
              <div>
                <ShieldCheck size={18} />
                Real-time clinic workflow
              </div>
              <div>
                <ShieldCheck size={18} />
                Clean medical dashboard
              </div>
            </div>
          </div>
        </section>

        <section className="login-right">
          <form className="login-card" onSubmit={handleLogin}>
            <div className="mobile-logo">S</div>

            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to SCMS Admin Portal.</p>
            </div>

            <label className="field">
              <span>Email Address</span>
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@scms.demo"
                />
              </div>
            </label>

            <label className="field">
              <span>Password</span>
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="helper-text">
              Use your clinic admin account to access the dashboard.
            </p>
          </form>
        </section>
      </main>
    </>
  );
}

const styles = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: ${BG};
  color: ${TEXT};
  font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  background:
    radial-gradient(circle at top left, rgba(0,82,204,0.16), transparent 34%),
    ${BG};
}

.login-left {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.brand-card {
  width: 100%;
  max-width: 560px;
  background: linear-gradient(145deg, ${PRIMARY}, ${PRIMARY_DARK});
  border-radius: 30px;
  padding: 42px;
  color: white;
  box-shadow: 0 30px 80px rgba(0, 82, 204, 0.22);
}

.logo-box,
.mobile-logo {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
}

.brand-card h1 {
  margin: 26px 0 0;
  font-size: 42px;
  letter-spacing: -0.05em;
  font-weight: 900;
}

.brand-card p {
  margin: 14px 0 0;
  color: rgba(255,255,255,0.78);
  line-height: 1.7;
  font-size: 15px;
}

.feature-list {
  margin-top: 34px;
  display: grid;
  gap: 14px;
}

.feature-list div {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 16px;
  padding: 14px 16px;
  font-weight: 800;
}

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: ${CARD};
  border: 1px solid ${BORDER};
  border-radius: 28px;
  padding: 34px;
  box-shadow: 0 18px 50px rgba(16,24,40,0.08);
}

.mobile-logo {
  display: none;
  background: ${PRIMARY};
  color: white;
  margin-bottom: 20px;
}

.form-header h2 {
  margin: 0;
  color: ${TEXT};
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.form-header p {
  margin: 8px 0 26px;
  color: ${MUTED};
  font-size: 14px;
  line-height: 1.6;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.field span {
  color: ${TEXT};
  font-size: 13px;
  font-weight: 800;
}

.input-wrap {
  height: 48px;
  border: 1px solid ${BORDER};
  border-radius: 14px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  color: ${MUTED};
  transition: 0.18s ease;
}

.input-wrap:focus-within {
  border-color: ${PRIMARY};
  box-shadow: 0 0 0 4px rgba(0,82,204,0.10);
}

.input-wrap input {
  flex: 1;
  border: 0;
  outline: 0;
  font-size: 14px;
  color: ${TEXT};
  background: transparent;
  min-width: 0;
}

.eye-btn {
  border: 0;
  background: transparent;
  color: ${MUTED};
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.eye-btn:hover {
  color: ${TEXT};
}

.login-btn {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 14px;
  background: ${PRIMARY};
  color: white;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 12px 24px rgba(0,82,204,0.18);
  transition: 0.18s ease;
}

.login-btn:hover {
  background: ${PRIMARY_DARK};
  transform: translateY(-1px);
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.helper-text {
  margin: 18px 0 0;
  color: ${MUTED};
  font-size: 13px;
  text-align: center;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-left {
    display: none;
  }

  .login-right {
    padding: 24px 16px;
  }

  .login-card {
    max-width: 460px;
    border-radius: 24px;
    padding: 26px;
  }

  .mobile-logo {
    display: flex;
  }

  .form-header h2 {
    font-size: 26px;
  }
}

@media (max-width: 420px) {
  .login-right {
    padding: 16px 12px;
  }

  .login-card {
    padding: 22px;
  }
}
`;
