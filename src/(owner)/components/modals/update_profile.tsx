/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, type FormEvent } from "react";
import { X, User, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useAuthStore } from "../../../(auth)/store/Auth";
import { userAPI } from "../../../api/user";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateProfileModal({
  isOpen,
  onClose,
}: UpdateProfileModalProps) {
  const { user, login } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.name);
      setEmail(user.email);
      setError(null);
      setSuccess(null);
      setLoading(false);
    }
  }, [isOpen, user]);

  const hasChanges = user
    ? username !== user.name || email !== user.email
    : false;

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    if (!email.trim()) {
      setError("Email cannot be empty.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!hasChanges) {
      setError("You haven't made any changes.");
      return;
    }

    setLoading(true);
    try {
      if (!user?.id) {
        throw new Error("User ID not found");
      }

      const updateData: any = {};
      if (username !== user.name) updateData.username = username;
      if (email !== user.email) updateData.email = email;

      const response = await userAPI.updateProfile(user.id, updateData);

      const updatedUser = {
        ...user,
        name: response.user.username,
        email: response.user.email,
      };

      const token = useAuthStore.getState().token;
      if (token) {
        login(updatedUser as any, token);
      }

      setSuccess("Your profile has been updated successfully!");
    } catch (error) {
      console.error("Update profile error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while updating your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <form
        onSubmit={handleUpdateProfile}
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
          <h3 className="font-bold text-2xl">Edit profile</h3>
        </div>

        {error && (
          <div className="alert alert-error shadow-lg mt-4">
            <div>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="alert alert-success shadow-lg mt-4">
            <div>
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="form-control gap-4 py-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Name</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <User size={18} />
              </span>
              <input
                type="text"
                className="input input-bordered w-full join-item"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email Address</legend>
            <div className="join w-full">
              <span className="btn join-item pointer-events-none border-base-300">
                <Mail size={18} />
              </span>
              <input
                type="email"
                className="input input-bordered w-full join-item"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </fieldset>
        </div>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
          <button
            type="submit"
            className="btn btn-neutral"
            disabled={loading || !hasChanges}
          >
            {loading && <span className="loading loading-spinner"></span>}
            Save Changes
          </button>
        </div>
      </form>
    </dialog>
  );
}
