"use client";
import API from "@/app/lib/vendorApi";
import toast from "react-hot-toast";

const STATUS_FLOW = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

export default function StatusButtons({ order, refresh }) {
  const nextStatus = STATUS_FLOW[order.orderStatus];

  const updateStatus = async () => {
    try {
      await API.put(`/orders/${order._id}`, { status: nextStatus });
      toast.success(`Order marked as ${nextStatus}`);
      refresh();
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  if (!nextStatus) return null;

  return (
    <button
      onClick={updateStatus}
      className="mt-5 bg-black text-white px-5 py-3 rounded-lg"
    >
      Mark as {nextStatus}
    </button>
  );
}
