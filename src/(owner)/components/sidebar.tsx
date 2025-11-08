import {
  LayoutDashboardIcon,
  MessageCircleWarning,
  Users,
  UserCircle,
  LogOut,
  MessageCircle,
  Building,
  Settings,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../(auth)/store/Auth";
import clsx from "clsx";

export default function Sidebar() {
  const path = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      href: "/dashboard",
    },
    {
      label: "Rooms",
      icon: Building,
      href: "/rooms",
    },
    {
      label: "Reports",
      icon: MessageCircleWarning,
      href: "/reports",
    },
    {
      label: "Guests",
      icon: Users,
      href: "/guests",
    },
    {
      label: "Messages",
      icon: MessageCircle,
      href: "/messages",
    },
    // {
    //   label: "Reservations",
    //   icon: ContactIcon,
    //   href: "/reservations",
    // },
    // {
    //   label: "Amenities Management",
    //   icon: Home,
    //   href: "/amenities",
    // },
  ];

  return (
    <div className="sticky top-4 flex flex-col gap-2 p-4 bg-base-200 h-screen border-r border-r-base-300">
      <h1 className="text-center font-bold lg:text-4xl py-4">OneStay</h1>
      <div className="flex flex-col gap-4 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={clsx(
                "flex gap-4 items-center transition p-4 rounded-xl cursor-pointer justify-start",
                path.pathname == item.href ? "bg-neutral text-white" : ""
              )}
            >
              <Icon />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-4 items-center p-4 bg-neutral text-white rounded-xl flex-1">
          <UserCircle />
          <h1>{user?.name}</h1>
        </div>
        <div className="flex flex-row gap-4 items-center">
          <button
            className="flex gap-4 items-center justify-center transition p-4 rounded-xl cursor-pointer bg-base-300 text-center flex-1"
            onClick={() => {
              navigate("/settings");
            }}
          >
            <Settings />
          </button>
          <button
            className="flex gap-4 items-center justify-center transition p-4 rounded-xl cursor-pointer bg-base-300 text-center flex-1"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut />
          </button>
        </div>
      </div>
    </div>
  );
}
