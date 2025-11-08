import { useState, useEffect, type FormEvent } from "react";
import { X, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useAuthStore } from "../../../(auth)/store/Auth";
import { userAPI } from "../../../api/user";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user } = useAuthStore();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccess(null);
      setLoading(false);
    }
  }, [isOpen]);

  const validatePassword = (
    password: string
  ): { valid: boolean; message?: string } => {
    if (password.length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters long.",
      };
    }
    return { valid: true };
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError("Please enter your current password.");
      return;
    }
    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message || "Invalid password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setLoading(true);
    try {
      if (!user?.id) {
        throw new Error("User ID not found");
      }

      await userAPI.changePassword(user.id, {
        currentPassword,
        newPassword,
      });

      setSuccess("Your password has been changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while changing your password."
      );
    } finally {
      setLoading(false);
    }
  };

  const isLengthValid = newPassword.length >= 6;
  const isDifferent = newPassword && newPassword !== currentPassword;
  const isMatching = newPassword && newPassword === confirmPassword;

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <form
        onSubmit={handleChangePassword}
        className="modal-box w-11/12 max-w-lg"
      >
        <div className="flex flex-row gap-4 items-center">
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            <X size={20} />
          </button>
          <h3 className="font-bold text-2xl">Change Password</h3>
        </div>

        {error && (
          <div className="alert alert-error shadow-lg">
            <div>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="alert alert-success shadow-lg">
            <div>
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 py-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Current Password</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <Lock size={18} />
              </span>
              <input
                type={showCurrentPassword ? "text" : "password"}
                className="input input-bordered w-full join-item"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="btn join-item border-base-300"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">New Password</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <Lock size={18} />
              </span>
              <input
                type={showNewPassword ? "text" : "password"}
                className="input input-bordered w-full join-item"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="btn join-item border-base-300"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </fieldset>

          <div className="pl-2 space-y-1">
            <div
              className={`flex items-center gap-2 text-sm ${
                isLengthValid ? "text-success" : "text-base-content/70"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isLengthValid ? "bg-success" : "bg-base-300"
                }`}
              />
              At least 6 characters
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${
                isDifferent ? "text-success" : "text-base-content/70"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isDifferent ? "bg-success" : "bg-base-300"
                }`}
              />
              Different from current password
            </div>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Confirm New Password</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <Lock size={18} />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="input input-bordered w-full join-item"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="btn join-item border-base-300"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p
                className={`text-xs mt-1 pl-2 ${
                  isMatching ? "text-success" : "text-error"
                }`}
              >
                {isMatching ? "✓ Passwords match" : "✗ Passwords do not match"}
              </p>
            )}
          </fieldset>
        </div>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-neutral"
            disabled={loading || !isLengthValid || !isDifferent || !isMatching}
          >
            {loading && <span className="loading loading-spinner"></span>}
            Change Password
          </button>
        </div>
      </form>
    </dialog>
  );
}
