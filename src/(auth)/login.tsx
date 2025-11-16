/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type FormEvent } from "react";
import type { User, UserRole } from "./types/user";
import { authAPI } from "../api/auth";
import { useAuthStore } from "./store/Auth";
import { AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { login } = useAuthStore();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(email, password);

      const user: User = {
        id: response.user.id,
        name: response.user.username,
        email: response.user.email,
        role: response.user.role as UserRole,
        avatar:
          response.user.role === "owner"
            ? "https://randomuser.me/api/portraits/men/45.jpg"
            : "https://randomuser.me/api/portraits/women/32.jpg",
      };

      await login(user, response.token);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "OneStay / Login";
  }, []);

  return (
    <main className="flex flex-col min-h-dvh p-4 mx-auto bg-base-300 items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="hidden lg:flex flex-col p-12 bg-base-100 rounded-lg gap-4 w-full max-w-lg"
      >
        <div className="flex flex-col items-center text-center gap-3 mb-4">
          <h1 className="text-3xl font-bold">OneStay</h1>
          <p className="text-base-content/70 text-sm">
            Let the relaxation begin.
          </p>
        </div>

        {error && (
          <div className="gap-2 alert alert-error shadow-lg text-sm">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Email</legend>
            <input
              type="email"
              className="input w-full"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Password</legend>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </fieldset>
        </div>
        <button type="submit" className="btn btn-neutral" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
        <p className="text-sm">
          New to OneStay?
          <Link
            to={"/register"}
            className="underline text-primary hover:text-primary-focus ml-1"
          >
            Register
          </Link>
        </p>
      </form>
      <div className="flex lg:hidden flex-col gap-2 items-center bg-base-100 p-4 rounded-xl shadow-lg">
        <h1 className="font-bold text-2xl">OneStay</h1>
        <h1 className="text-center text-base-content/60 text-sm">
          This is for desktop/web only, please login via mobile.
        </h1>
      </div>
    </main>
  );
}
