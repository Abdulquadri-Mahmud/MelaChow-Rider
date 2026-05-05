export default function StatusBadge({ status }) {
  const colors = {
    pending: "bg-yellow-500",
    accepted: "bg-blue-500",
    preparing: "bg-purple-500",
    ready: "bg-green-500",
    completed: "bg-green-700",
    cancelled: "bg-red-500",
  };

  return (
    <span className={`text-white px-3 py-1 rounded-full text-sm ${colors[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
