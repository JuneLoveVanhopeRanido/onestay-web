import {
  HelpCircle,
  LockKeyhole,
  NotebookText,
  Shield,
  UserPen,
  ChevronRight,
  LogOut,
} from "lucide-react";
import Sidebar from "./components/sidebar";
import { useNavigate, Link } from "react-router";
import { useAuthStore } from "../(auth)/store/Auth";
import { useEffect, useState } from "react";
import ChangePasswordModal from "./components/modals/change_password";
import UpdateProfileModal from "./components/modals/update_profile";

const SettingsItem = ({
  icon,
  text,
  to,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  to?: string;
  onClick?: () => void;
}) => {
  const content = (
    <div className="btn btn-ghost flex flex-row gap-4 justify-start w-full h-auto py-3 px-4">
      {icon}
      <p className="flex-1 text-left text-base normal-case font-medium">
        {text}
      </p>
      {to && <ChevronRight size={18} className="opacity-50" />}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="w-full">
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="w-full">
      {content}
    </button>
  );
};

// --- Main Screen Component ---

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    document.title = "OneStay / Settings";
  }, []);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="relative grid grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
      <Sidebar />
      <div className="flex flex-col gap-4 p-12 overflow-y-auto">
        <h1 className="lg:text-4xl font-bold">Settings</h1>

        <div className="flex flex-col gap-2 p-6 bg-base-200 rounded-xl">
          <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2 px-4">
            Account
          </h2>
          <SettingsItem
            icon={<UserPen size={20} />}
            text="Edit Profile"
            onClick={() => setIsProfileModalOpen(true)}
          />
          <SettingsItem
            icon={<LockKeyhole size={20} />}
            text="Change Password"
            onClick={() => setIsPasswordModalOpen(true)}
          />
        </div>

        <div className="flex flex-col gap-2 p-6 bg-base-200 rounded-xl">
          <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2 px-4">
            Support
          </h2>
          <SettingsItem
            icon={<HelpCircle size={20} />}
            text="Help Center"
            to=""
          />
          <SettingsItem
            icon={<Shield size={20} />}
            text="Privacy & Security"
            to=""
          />
          <SettingsItem
            icon={<NotebookText size={20} />}
            text="Terms & Policies"
            to=""
          />
        </div>

        <div className="flex flex-col gap-2 p-6 bg-base-200 rounded-xl">
          <button
            className="btn btn-ghost flex flex-row gap-4 justify-start w-full h-auto py-3 px-4 text-error"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <p className="flex-1 text-left text-base normal-case font-medium">
              Log Out
            </p>
          </button>
        </div>
      </div>
      <UpdateProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </main>
  );
}
