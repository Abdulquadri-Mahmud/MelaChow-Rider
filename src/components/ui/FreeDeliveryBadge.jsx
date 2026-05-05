export default function FreeDeliveryBadge({ type = "vendor" }) {
  const label =
    type === "vendor"
      ? "🏪 Free Delivery"
      : "🎁 Free Delivery";

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                 text-xs font-semibold bg-green-100 text-green-800 border
                 border-green-200"
    >
      {label}
    </span>
  );
}
