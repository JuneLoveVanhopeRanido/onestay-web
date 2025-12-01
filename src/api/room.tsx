/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RoomData } from "../(owner)/components/modals/add_room";
import { apiRequest, authenticatedApiRequest, API_BASE_URL } from "./client";

export interface Room {
  _id: string;
  resort_id: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: string;
  deleted: boolean;
  createdAt: string;
  resort_id_populated?: {
    _id: string;
    resort_name: string;
    location: {
      address: string;
      latitude: number;
      longitude: number;
    };
    image?: string;
  };
  booked_dates?: string[];
  description:string;
  image:string;
}

export interface RoomAvailability {
  available: boolean;
  room: {
    id: string;
    type: string;
    capacity: number;
    price_per_night: number;
    resort: any;
  };
  booking_details: {
    start_date: string;
    end_date: string;
    total_price: number;
    nights: number;
  };
}

export interface RoomFormData {
  resort_id: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: string;
  description:string;
  imageUri?: string;
}

export type UpdateRoomData = Partial<Omit<RoomFormData, "resort_id">>;

export const roomAPI = {
  createRoom: async (roomData: RoomFormData): Promise<Room> => {
    try {
      const response = await authenticatedApiRequest("/room", {
        method: "POST",
        body: JSON.stringify(roomData),
      });
      return response;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  },

  createRoomV2: async (
    roomData: RoomData,
    selectedFile: File | null,
    token: string
  ): Promise<Room> => {
    try {
      let response;

      // If there is a file, use FormData
      if (selectedFile) {
        const formData = new FormData();
        formData.append("resort_id", roomData.resort_id);
        formData.append("room_type", roomData.room_type);
        formData.append("capacity", String(roomData.capacity));
        formData.append("price_per_night", String(roomData.price_per_night));
        formData.append("status", roomData.status);


        if (roomData.description) {
          formData.append("description", roomData.description);
        }
        formData.append("image", selectedFile, selectedFile.name);

        console.log("from route",roomData.resort_id);

        response = await  fetch(`${API_BASE_URL}/room`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type, let the browser do it
          },
        });
      } else {
        // If no file, send as JSON using our wrapper
        response = await authenticatedApiRequest("/room", {
          method: "POST",
          body: JSON.stringify(roomData),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to create resort"
      );
    }
  },

  createRoomWithImage: async (roomData: RoomFormData): Promise<Room> => {
    try {
        console.log('roomdata', roomData);

      const response = await authenticatedApiRequest("/room", {
        method: "POST",
        body: JSON.stringify(roomData),
      });
      return response;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  },


  getRoomsByResort: async (
    resortId: string
  ): Promise<{ resort: any; rooms: Room[] }> => {
    try {
      const response = await apiRequest(`/room/resort/${resortId}`);
      return response;
    } catch (error: any) {
      console.error("Error fetching rooms by resort:", error);

      // Provide user-friendly error messages
      if (error.status === 404) {
        throw new Error("Resort not found or no rooms available.");
      }
      if (error.status === 400) {
        throw new Error("Invalid resort ID. Please try again.");
      }

      throw new Error(
        error.message || "Failed to load resort rooms. Please try again later."
      );
    }
  },

  getRoomsByType: async (
    resortId: string,
    room_type: string
  ): Promise<{ resort: any; rooms: Room[] }> => {
    try {
      const response = await apiRequest(`/room/resort/${resortId}/${room_type}`);
      return response;
    } catch (error: any) {
      console.error("Error fetching rooms by resort:", error);

      // Provide user-friendly error messages
      if (error.status === 404) {
        throw new Error("Resort not found or no rooms available.");
      }
      if (error.status === 400) {
        throw new Error("Invalid resort ID. Please try again.");
      }

      throw new Error(
        error.message || "Failed to load resort rooms. Please try again later."
      );
    }
  },

  getRoomById: async (roomId: string): Promise<Room> => {
    try {
      const response = await apiRequest(`/room/${roomId}`);
      return response;
    } catch (error: any) {
      console.error("Error fetching room by ID:", error);

      // Provide user-friendly error messages
      if (error.status === 404) {
        throw new Error(
          "Room not found. It may have been removed or is no longer available."
        );
      }
      if (error.status === 400) {
        throw new Error("Invalid room ID. Please try again.");
      }

      throw new Error(
        error.message || "Failed to load room details. Please try again later."
      );
    }
  },

  checkRoomAvailability: async (
    roomId: string,
    startDate: string,
    endDate: string
  ): Promise<RoomAvailability> => {
    try {
      const response = await apiRequest(
        `/reservation/availability/${roomId}?start_date=${startDate}&end_date=${endDate}`
      );
      return response;
    } catch (error) {
      console.error("Error checking room availability:", error);
      throw error;
    }
  },

  getBookedDates: async (
    roomId: string
  ): Promise<{ room_id: string; booked_dates: string[] }> => {
    try {
      const response = await apiRequest(`/reservation/booked-dates/${roomId}`);
      return response;
    } catch (error: any) {
      console.error("Error fetching booked dates:", error);

      // Return empty booked dates as fallback instead of failing
      if (error.status === 404 || error.status === 400) {
        console.warn(
          "Room not found or invalid ID, returning empty booked dates"
        );
        return {
          room_id: roomId,
          booked_dates: [],
        };
      }

      // For server errors, also return empty array as fallback
      console.warn(
        "Server error fetching booked dates, returning empty array as fallback"
      );
      return {
        room_id: roomId,
        booked_dates: [],
      };
    }
  },
  updateRoom: async (
    roomId: string,
    roomData: UpdateRoomData
  ): Promise<Room> => {
    try {
      const response = await authenticatedApiRequest(`/room/${roomId}`, {
        method: "PUT",
        body: JSON.stringify(roomData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update room"
      );
    }
  },

  updateRoomV2: async (
    roomId: string,
    roomData: Partial<RoomFormData>,
    selectedFile: File | null,
    token: string
  ): Promise<Room> => {
    try {
      const formData = new FormData();


      if (selectedFile) {
        formData.append("image", selectedFile, selectedFile.name);
      }

        formData.append("room_type", String(roomData.room_type));
        formData.append("capacity", String(roomData.capacity));
        formData.append("price_per_night", String(roomData.price_per_night));
        formData.append("status", String(roomData.status));


        if (roomData.description) {
          formData.append("description", roomData.description);
        }

      const response = await fetch(`${API_BASE_URL}/room/${roomId}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();

      // const response = await authenticatedApiRequest(`/room/${roomId}`, {
      //   method: "PUT",
      //   body: JSON.stringify(roomData),
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update room"
      );
    }
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    try {
      await authenticatedApiRequest(`/room/${roomId}`, {
        method: "DELETE",
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete room"
      );
    }
  },
};
