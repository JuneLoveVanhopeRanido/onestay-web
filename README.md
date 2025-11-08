# OneStay Admin Panel

Welcome to the OneStay Admin Panel, a comprehensive web application designed for resort owners to manage their property, reservations, rooms, and guest communications.
This dashboard provides a centralized, real-time hub for all administrative tasks, from viewing sales reports to updating resort details on an interactive map.

## ✨ Features
- **Dashboard**: An overview of key statistics, including average ratings, total rooms, and reservation counts.
- **Resort Management**: Edit resort details (name, description, image) and pinpoint the exact location using an interactive Leaflet map.
- **Room Management**: Add, view, and manage all rooms associated with the resort, including type, capacity, price, and status.
- **Reservation Management**: View a filterable list of all guest reservations (pending, confirmed, completed, etc.) and drill down into individual booking details.
- **Guest Management**: See a complete list of all guests who have made reservations.
- **Live Chat**: A real-time chat system (powered by Socket.io) for communicating directly with guests.
- **Reporting**: Generate dynamic reports on monthly sales and room type popularity, complete with chart visualizations (recharts) and a "Export to PDF" feature.
- **Account Settings**: Securely update profile information and change passwords within the application.

## 🚀 Tech Stack
This project is built with a modern, scalable tech stack:

- **Core**:
  - React 18 (Vite + TypeScript)
  - TailwindCSS (for styling)
  - daisyUI (as the Tailwind component library)
- **State Management**:
  - Zustand: For global, simple, and unopinionated state management (e.g., authStore, resortStore).
- **Routing**:
  - React Router: For all client-side navigation.
-** Data Fetching & API**:
  - Fetch API / Axios: For communicating with the backend REST API.
- **Real-time**:
  - Socket.io Client: Powers the real-time chat and dashboard updates.
- **Visualization & Utilities**:
  - Recharts: For creating beautiful, interactive charts on the Reports screen.
  - React Leaflet: For all interactive map components (resort location, map picker).
  - React-to-PDF: For exporting the Reports page as a PDF.
  - Day.js: For lightweight and powerful date/time formatting.
  - Immer: For safe and simple immutable state updates within Zustand.
  - Lucide React: For clean and simple icons.

## 🏁 Getting Started

Prerequisites
- Node.js (v18 or later)
- npm or yarn
- A running instance of the OneStay backend server.

Installation & Setup

1.**Clone the repository**:
```
git clone [https://github.com/dlord213/onestay-admin.git](https://github.com/dlord213/onestay-admin.git)
cd onestay-admin
```
2. **Install dependencies**
```
npm install
```
3. **Create an environment file**:
Create a .env file in the root of the project and add your API's base URL:
```
VITE_API_BASE_URL=http://localhost:3000/api
```
4. **Run the development server**:
```
npm run dev
```