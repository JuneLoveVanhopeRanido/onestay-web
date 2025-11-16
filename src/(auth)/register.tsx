/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent } from "react";
import type { User, UserRole } from "./types/user";
import { authAPI } from "../api/auth";
import { useAuthStore } from "./store/Auth";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function RegisterScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState<UserRole>("owner");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuthStore();
  const totalSteps = 3;

  const handleNextStep = () => {
    setError(null);

    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!username.trim()) {
        setError("Please enter your username.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setError(null);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role,
      });

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

      if (role === "owner") {
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err.message ||
          "An error occurred during registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "New to OneStay?";
      case 2:
        return "Personal Information";
      case 3:
        return "Create Password";
      default:
        return "Join OneStay";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return "Are you looking to host guests?";
      case 2:
        return "Tell us a bit about yourself";
      case 3:
        return "Secure your account with a strong password";
      default:
        return "Create your OneStay account";
    }
  };

  return (
    <main className="flex flex-col min-h-dvh p-4 mx-auto bg-base-300 items-center justify-center">
      <form
        onSubmit={
          currentStep === 3 ? handleRegister : (e) => e.preventDefault()
        }
        className="flex flex-col p-8 sm:p-12 bg-base-100 shadow-xl rounded-lg gap-4 w-full max-w-lg"
      >
        <div className="flex flex-col items-center text-center gap-2 mb-4">
          <h1 className="text-3xl font-bold">{getStepTitle()}</h1>
          <p className="text-base-content/70">{getStepSubtitle()}</p>
        </div>

        <progress
          className="progress progress-primary w-full"
          value={currentStep}
          max={totalSteps}
        ></progress>

        {error && (
          <div className="alert alert-error shadow-lg text-sm">
              <AlertCircle size={20} />
              <span>{error}</span>
          </div>
        )}

        <div
          className={currentStep === 1 ? "flex flex-col gap-4 mt-4" : "hidden"}
        >
          <button
            type="button"
            onClick={() => setRole("owner")}
            className={`btn h-auto p-6 flex-col items-center ${
              role === "owner" ? "btn-neutral" : "btn-ghost border-base-300"
            }`}
          >
            <Briefcase size={24} />
            <span className="text-lg font-bold mt-1">I'm a Resort Owner</span>
            <span className="text-xs font-normal normal-case opacity-70">
              List your property and welcome guests
            </span>
          </button>
        </div>

        <div
          className={currentStep === 2 ? "flex flex-col gap-4 mt-4" : "hidden"}
        >
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Username</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <UserIcon size={18} />
              </span>
              <input
                type="text"
                className="input input-bordered w-full join-item"
                placeholder="Choose a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Email</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <Mail size={18} />
              </span>
              <input
                type="email"
                className="input input-bordered w-full join-item"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </fieldset>
        </div>

        <div
          className={currentStep === 3 ? "flex flex-col gap-4 mt-4" : "hidden"}
        >
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Password</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <Lock size={18} />
              </span>
              <input
                type="password"
                className="input input-bordered w-full join-item"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <label className="label">
              <span className="label-text-alt">
                Must be at least 6 characters long.
              </span>
            </label>
          </fieldset>

          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Confirm Password</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <Lock size={18} />
              </span>
              <input
                type="password"
                className="input input-bordered w-full join-item"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-4 w-full mt-6">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-ghost flex-1 gap-4"
              onClick={handlePrevStep}
              disabled={loading}
            >
              <ArrowLeft size={18} />
              Back
            </button>
          )}

          {currentStep < 3 && (
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={handleNextStep}
            >
              Continue
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating Account...
                </>
              ) : (
                `Create ${role === "customer" ? "Guest" : "Owner"} Account`
              )}
            </button>
          )}
        </div>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link
            to={"/"}
            className="underline text-primary hover:text-primary-focus"
          >
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
