import {
  LayoutDashboardIcon,
  MessageCircleWarning,
  Users,
  UserCircle,
  LogOut,
  MessageCircle,
  Building,
  Settings,
  Home,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../(auth)/store/Auth";
import clsx from "clsx";

import { useResortStore } from "../store/resort";
import { chatService } from "../../api/chat";

import { useState, useEffect } from "react";


export default function Sidebar() {
  const path = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [unreadCount, setUnreadCount] = useState(0);

  const { resorts, loading: resortsLoading, hasResorts } = useResortStore();


    const loadChats = async () => {
      try {
        if (!user?.id) {
          console.log("No user found for loading chats");
          return;
        }
  
        if (resortsLoading) {
          console.log("Waiting for resorts to load...");
          return;
        }
  
        if (!hasResorts || resorts.length === 0) {
          console.log("No resorts found for owner. Cannot load chats.");
          return;
        }
  
        const resortId = resorts[0]._id;
  
        console.log("Loading chats for resort:", resortId);
        const apiChats = await chatService.getResortChats(resortId);
        console.log("API chats response:", apiChats);
  
        const transformedChats = apiChats.map((chat: any) =>
          chatService.transformApiChat(chat)
        );
  
        transformedChats.sort(
          (a: any, b: any) =>
            new Date(b.last_message_time).getTime() -
            new Date(a.last_message_time).getTime()
        );

        const totalUnread = transformedChats.reduce((sum, item) => sum + item.unread_count, 0);

        setUnreadCount(totalUnread);
  
        console.log("Transformed chatssss:", transformedChats);
      } catch (error) {
        console.error("Error loading chats:", error);
        
      }
    };

    useEffect(() => {
      if (!resortsLoading && hasResorts) {
        loadChats();
      }
    }, [resortsLoading, hasResorts, resorts]);

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
    {
      label: "Amenities",
      icon: Home,
      href: "/amenities",
    },
  ];



  return (
    <div className="hidden sticky top-4 lg:flex flex-col gap-2 p-4 bg-base-200 h-screen border-r border-r-base-300">
      <h1 className="text-center font-bold lg:text-4xl py-4">OneStay</h1>
      <div className="flex flex-col gap-4 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isMessages = item.label === "Messages";

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={clsx(
                "flex gap-4 items-center transition p-4 rounded-xl cursor-pointer justify-start",
                path.pathname.includes(item.href) ? "bg-neutral text-white" : ""
              )}
            >
              <div className="relative">
                <Icon />

                {/* Badge for unread count */}
                {isMessages && unreadCount > 0 && (
                  <span
                    className="
                      absolute -top-1 -right-1 
                      bg-red-500 text-white 
                      text-xs rounded-full 
                      px-1.5 py-0.5 
                      min-w-[18px] text-center
                    "
                  >
                    {unreadCount}
                  </span>
                )}
              </div>

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
