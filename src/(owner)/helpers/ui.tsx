export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "#10B981";
    case "pending":
      return "#F59E0B";
    case "rejected":
      return "#EF4444";
    case "cancelled":
      return "#EF4444";
    case "completed":
      return "#8B5CF6";
    default:
      return "#6B7280";
  }
};
