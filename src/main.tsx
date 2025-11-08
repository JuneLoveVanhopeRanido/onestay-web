import LoginScreen from "./(auth)/login";
import DashboardScreen from "./(owner)/dashboard";
import ReportsScreen from "./(owner)/reports";
import GuestsScreen from "./(owner)/guests";
import ViewReservationScreen from "./(owner)/view_reservation";
import AmenitiesManagementScreen from "./(owner)/amenities";
import OwnerChatConversation from "./(owner)/view_messages";
import ChatListScreen from "./(owner)/messages";
import RoomsScreen from "./(owner)/rooms";
import SettingsScreen from "./(owner)/settings";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, redirect } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useAuthStore } from "./(auth)/store/Auth";
import { useResortStore } from "./(owner)/store/resort";

import "./globals.css";
import "leaflet/dist/leaflet.css";
import "react-calendar/dist/Calendar.css";

const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginScreen,
    loader: async () => {
      const { user } = useAuthStore.getState();

      if (user?.role == "owner") {
        useResortStore.getState().fetchResortsByOwner();
        return redirect("dashboard");
      }
    },
  },
  {
    path: "dashboard",
    Component: DashboardScreen,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
  {
    path: "reports",
    Component: ReportsScreen,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
  {
    path: "guests",
    Component: GuestsScreen,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
  {
    path: "amenities",
    Component: AmenitiesManagementScreen,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
  {
    path: "messages",
    Component: ChatListScreen,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
  {
    path: "rooms",
    Component: RoomsScreen,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
  {
    path: "view/messages/:chatId",
    Component: OwnerChatConversation,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
  {
    path: "view/reservation/:id",
    Component: ViewReservationScreen,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
  {
    path: "settings",
    Component: SettingsScreen,
    loader: async () => {
      const { token } = useAuthStore.getState();

      if (!token) {
        return redirect("/");
      }
    },
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
