import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerAPI } from "../../../services/authService";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";

const PRIMARY = "#0052CC";
const PRIMARY_DARK = "#003D99";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "User",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      Swal.fire({
        title: "Password Mismatch",
        text: "Password and confirm password must be the same.",
        icon: "error",
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    try {
      setLoading(true);

      await registerAPI({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role || "User",
      });

      Swal.fire({
        title: "Registration Success",
        text: "Your account has been created. Please login.",
        icon: "success",
        confirmButtonColor: PRIMARY,
      }).then(() => navigate("/login", { replace: true }));
    } catch (error) {
      Swal.fire({
        title: "Registration Failed",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.title ||
          "Account registration failed.",
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

      <main className="register-page">
        <section className="brand-panel">
          <div className="brand-card">
            <div className="logo">S</div>
            <h1>Create SCMS Account</h1>
            <p>
              Register a new user account for Smart Clinic Management System.
            </p>

            <div className="features">
              <div>
                <ShieldCheck size={18} /> Secure patient profile
              </div>
              <div>
                <ShieldCheck size={18} /> Appointment and EMR access
              </div>
              <div>
                <ShieldCheck size={18} /> Smart clinic workflow
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <form className="register-card" onSubmit={handleRegister}>
            <div className="mobile-logo">S</div>

            <div className="form-header">
              <h2>Create Account</h2>
              <p>Fill in your information to access SCMS portal.</p>
            </div>

            <Field label="Full Name" icon={<User size={18} />}>
              <input
                name="name"
                value={form.name}
                onChange={change}
                required
                placeholder="Enter full name"
              />
            </Field>

            <Field label="Email Address" icon={<Mail size={18} />}>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                required
                placeholder="user@example.com"
              />
            </Field>

            <Field label="Password" icon={<Lock size={18} />}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={change}
                required
                placeholder="Enter password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Field>

            <Field label="Confirm Password" icon={<Lock size={18} />}>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={change}
                required
                placeholder="Confirm password"
              />
            </Field>

            <button className="submit-btn" disabled={loading}>
              <UserPlus size={18} />
              {loading ? "Creating account..." : "Register"}
            </button>

            <p className="signin-text">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </form>
        </section>
      </main>
    </>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        {icon}
        {children}
      </div>
    </label>
  );
}

const styles = `
* { box-sizing: border-box; }

body {
  margin: 0;
  background: ${BG};
  color: ${TEXT};
  font-family: Inter, Manrope, system-ui, sans-serif;
}

.register-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  background: radial-gradient(circle at top left, rgba(0,82,204,0.16), transparent 34%), ${BG};
}

.brand-panel,
.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.brand-card {
  width: 100%;
  max-width: 560px;
  background: linear-gradient(145deg, ${PRIMARY}, ${PRIMARY_DARK});
  color: white;
  border-radius: 30px;
  padding: 42px;
  box-shadow: 0 30px 80px rgba(0,82,204,0.22);
}

.logo,
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
  font-weight: 900;
  letter-spacing: -0.05em;
}

.brand-card p {
  margin-top: 14px;
  color: rgba(255,255,255,0.78);
  line-height: 1.7;
}

.features {
  margin-top: 34px;
  display: grid;
  gap: 14px;
}

.features div {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 16px;
  padding: 14px 16px;
  font-weight: 800;
}

.register-card {
  width: 100%;
  max-width: 460px;
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
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.form-header p {
  margin: 8px 0 24px;
  color: ${MUTED};
  font-size: 14px;
  line-height: 1.6;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.field span {
  font-size: 13px;
  font-weight: 800;
  color: ${TEXT};
}

.input-wrap {
  height: 48px;
  border: 1px solid ${BORDER};
  border-radius: 14px;
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
  background: transparent;
  color: ${TEXT};
  font-size: 14px;
  min-width: 0;
}

.eye-btn {
  border: 0;
  background: transparent;
  color: ${MUTED};
  cursor: pointer;
  display: flex;
  padding: 4px;
}

.submit-btn {
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-btn:hover {
  background: ${PRIMARY_DARK};
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.signin-text {
  margin: 18px 0 0;
  text-align: center;
  color: ${MUTED};
  font-size: 13px;
}

.signin-text a {
  color: ${PRIMARY};
  font-weight: 900;
  text-decoration: none;
}

@media (max-width: 900px) {
  .register-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    display: none;
  }

  .form-panel {
    padding: 24px 16px;
  }

  .register-card {
    border-radius: 24px;
    padding: 26px;
  }

  .mobile-logo {
    display: flex;
  }
}
`;
