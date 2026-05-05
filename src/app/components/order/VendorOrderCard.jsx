import Link from "next/link";
import { 
  User, MapPin, Phone, ChevronRight, ShoppingBag, 
  Hash, CalendarDays, Clock, Zap, TrendingUp,
  MoreVertical, CheckCircle2, Loader2, Play, PackageCheck,
  Bike
} from "lucide-react";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { updateOrderStatus, completeOrder } from "@/app/lib/vendorApi";
import toast from "react-hot-toast";

export default function VendorOrderCard({ order, onAssign, onRefresh }) {
  const { vendorProfile } = useVendorProfile();
  const vendorDetails = vendorProfile;
  const { userOrderId, restaurantId } = order;
  const user = userOrderId?.userId;
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const detailedItems = userOrderId?.items?.filter(item => item.restaurantId === restaurantId) || [];
  const itemCount = detailedItems.length > 0 ? detailedItems.length : (order.items?.length || 0);

  const vendorOrderId = order._id?.$oid || order._id;

  const handleUpdateStatus = async (newStatus) => {
    setIsUpdating(true);
    setShowMenu(false);
    try {
        if (newStatus === 'completed') {
            await completeOrder(vendorOrderId);
        } else {
            await updateOrderStatus(vendorOrderId, newStatus);
        }
        toast.success(`Order moved to ${newStatus.replace(/_/g, ' ')}`);
        onRefresh?.();
    } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
        setIsUpdating(false);
    }
  };

  // Get status color and icon
  const getStatusConfig = (status) => {
    const configs = {
      'pending': { bg: "bg-amber-50 dark:bg-amber-600/10", text: "text-amber-600", border: "border-amber-200 dark:border-amber-600/30", icon: Clock, label: "Pending" },
      'accepted': { bg: "bg-blue-50 dark:bg-blue-600/10", text: "text-blue-600", border: "border-blue-200 dark:border-blue-600/30", icon: TrendingUp, label: "Accepted" },
      'preparing': { bg: "bg-orange-50 dark:bg-orange-600/10", text: "text-orange-600", border: "border-orange-200 dark:border-orange-600/30", icon: Zap, label: "Preparing" },
      'ready': { bg: "bg-purple-50 dark:bg-purple-600/10", text: "text-purple-600", border: "border-purple-200 dark:border-purple-600/30", icon: CheckCircle2, label: "Ready" },
      'ready_for_pickup': { bg: "bg-purple-50 dark:bg-purple-600/10", text: "text-purple-600", border: "border-purple-200 dark:border-purple-600/30", icon: CheckCircle2, label: "Ready" },
      'rider_assigned': { bg: "bg-indigo-50 dark:bg-indigo-600/10", text: "text-indigo-600", border: "border-indigo-200 dark:border-indigo-600/30", icon: Bike, label: "In Transit" },
      'out_for_delivery': { bg: "bg-cyan-50 dark:bg-cyan-600/10", text: "text-cyan-600", border: "border-cyan-200 dark:border-cyan-600/30", icon: Bike, label: "Delivery" },
      'delivered': { bg: "bg-emerald-50 dark:bg-emerald-600/10", text: "text-emerald-600", border: "border-emerald-200 dark:border-emerald-600/30", icon: CheckCircle2, label: "Delivered" },
      'completed': { bg: "bg-green-50 dark:bg-green-600/10", text: "text-green-600", border: "border-green-200 dark:border-green-600/30", icon: CheckCircle2, label: "Completed" },
      'cancelled': { bg: "bg-rose-50 dark:bg-rose-600/10", text: "text-rose-600", border: "border-rose-200 dark:border-rose-600/30", icon: ShoppingBag, label: "Cancelled" },
      'failed': { bg: "bg-rose-50 dark:bg-rose-600/10", text: "text-rose-600", border: "border-rose-200 dark:border-rose-600/30", icon: ShoppingBag, label: "Failed" },
    };
    return configs[status.toLowerCase()] || configs['pending'];
  };

  const getNextStatus = (current) => {
    const isVendorManaged = vendorDetails?.deliveryManagedBy === 'vendor';
    const status = current?.toLowerCase();

    switch(status) {
        case 'pending': return { label: 'Accept Order', status: 'accepted', icon: TrendingUp };
        case 'accepted': return { label: 'Start Preparing', status: 'preparing', icon: Zap };
        case 'preparing': return { label: 'Mark as Ready', status: 'ready_for_pickup', icon: CheckCircle2 };
        case 'ready':
        case 'ready_for_pickup': 
            return null;
        case 'delivered':
            return isVendorManaged ? { label: 'Mark Completed', status: 'completed', icon: PackageCheck } : null;
        default: return null;
    }
  };

  const nextAction = getNextStatus(order.orderStatus);
  const nextStatusConfig = nextAction ? getStatusConfig(nextAction.status) : null;

  const currentStatus = order.orderStatus?.toLowerCase() || 'pending';
  const statusConfig = getStatusConfig(currentStatus);
  const isUrgent = currentStatus === 'pending';
  const isReady = ['ready_for_pickup', 'ready'].includes(currentStatus);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <div className={`bg-white dark:bg-slate-900 rounded-lg border transition-all duration-300 flex flex-col h-full overflow-hidden ${
        isUrgent ? 'border-amber-300 dark:border-amber-600/50' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      } relative`}>
      
      {/* Quick Action Dots */}
      <div className="absolute top-4 right-3 z-30">
          <button 
             onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
             className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-orange-500 shadow-sm transition-all"
          >
              {isUpdating ? <Loader2 size={14} className="animate-spin text-orange-500" /> : <MoreVertical size={16} />}
          </button>

          <AnimatePresence>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 z-20"
                                        >
                                            {nextAction ? (
                                                <button 
                                                    onClick={() => handleUpdateStatus(nextAction.status)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${nextStatusConfig.bg} ${nextStatusConfig.border} hover:scale-[1.02] active:scale-95 group/item`}
                                                >
                                                    <div className={`p-2 rounded-md ${nextStatusConfig.text} bg-white dark:bg-slate-900 shadow-sm`}>
                                                        <nextAction.icon size={14} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Move to Next</p>
                                                        <p className={`text-xs font-black uppercase tracking-tight ${nextStatusConfig.text}`}>{nextAction.label}</p>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="p-3 text-center">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No Actions Available</p>
                                                </div>
                                            )}

                                            <div className="h-px bg-slate-50 dark:bg-slate-800 my-1" />
                           
                           <Link href={`/vendors/order/${order._id?.$oid || order._id}`} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                               <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400">
                                   <PackageCheck size={14} />
                               </div>
                               <p className="text-xs font-black text-slate-500 uppercase tracking-tight">Order Details</p>
                           </Link>

                           <div className="h-px bg-slate-50 dark:bg-slate-800 my-1" />

                          {['pending', 'accepted', 'preparing', 'ready', 'ready_for_pickup'].includes(order.orderStatus?.toLowerCase()) && (
                              <button 
                                  onClick={() => {
                                      if(window.confirm("Are you sure you want to cancel this order?")) {
                                          handleUpdateStatus('cancelled');
                                      }
                                  }}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-rose-600"
                              >
                                  <div className="p-2 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-600">
                                      <ShoppingBag size={14} />
                                  </div>
                                  <p className="text-xs font-black uppercase tracking-tight">Cancel Order</p>
                              </button>
                          )}
                      </motion.div>
                  </>
              )}
          </AnimatePresence>
      </div>
      
      {/* Status Bar Background */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusConfig.bg}`} />

      {/* Header Section */}
      <div className="p-3 space-y-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`p-1.5 rounded-md border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                <Hash size={10} />
              </div>
              <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                #{(order._id?.$oid || order._id || "").toString().slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 dark:text-slate-400">
              <Clock size={10} className="shrink-0" />
              <span className="truncate">{dateStr} • {timeStr}</span>
            </div>
          </div>
          <div className="mr-10"> {/* Space for dots */}
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider border flex items-center gap-1.5 shrink-0 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
                <statusConfig.icon size={10} />
                {statusConfig.label}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Customer Profile Section */}
      <div className={`p-3 border-b transition-colors ${
        isUrgent ? 'bg-amber-50/50 dark:bg-amber-600/5 border-amber-100/50 dark:border-amber-600/20' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <motion.div 
            className="size-10 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden"
            whileHover={{ scale: 1.05 }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.firstname} className="w-full h-full object-cover" />
            ) : (
              <User size={14} className="text-slate-400" />
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
              {user ? `${user.firstname} ${user.lastname}` : "Guest"}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Phone size={9} className="text-orange-500 shrink-0" />
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {user?.phone || order.userOrderId?.phone || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manifest/Items Section */}
      <div className="flex-1 p-3 border-b border-slate-100 dark:border-slate-800 min-h-0">
        <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2.5">Order Items ({itemCount})</p>

        {detailedItems.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {detailedItems.slice(0, 3).map((item, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-100 dark:border-slate-700 group/item hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="size-8 rounded-md bg-linear-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 shrink-0 flex items-center justify-center border border-orange-200 dark:border-orange-700/30 overflow-hidden">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag size={10} className="text-orange-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate leading-tight">
                    {item.variant?.name || item.name || "Item"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">Qty: {item.quantity}</span>
                    {item.portion_label && (
                      <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {item.portion_label}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {detailedItems.length > 3 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-2 pl-2 py-1 border-l-2 border-orange-300 dark:border-orange-700/50"
              >
                + {detailedItems.length - 3} more item{detailedItems.length - 3 !== 1 ? 's' : ''}
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 p-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-800/20">
            <ShoppingBag size={12} />
            <span className="text-[8px] font-black uppercase tracking-wider">{itemCount} units</span>
          </div>
        )}
      </div>

      {/* Preparation Directive Summary */}
      {detailedItems.length > 0 && (
        <div className="p-3 border-b border-orange-200 dark:border-orange-700/50 bg-orange-200/30 dark:bg-orange-900/20 backdrop-blur-sm">
          <p className="text-[9px] font-black uppercase text-orange-700 dark:text-orange-300 tracking-wider mb-2">📋 Prepare</p>
          <div className="space-y-1">
            {detailedItems.map((item, idx) => {

              const quantity = Number(item.quantity) || 1;
              const portionLabel = item.portion_label || item.metadata?.portion_label || null;
              const portionQuantity = Number(item.portion_quantity) || 1;
              const itemName = item.name || item.variant?.name || "Item";
              const options = item.selected_options || item.metadata?.selected_options || [];
              const totalPortions = portionQuantity * quantity;
              
              const cleanPortionLabel = portionLabel?.trim() || "";
              let portionText = cleanPortionLabel || (totalPortions > 1 ? "portions" : "portion");

              // "X unit(s) of [Item] (Y portions total)"
              let fullSentence = `${quantity} ${quantity > 1 ? "units" : "unit"} of ${itemName}`;
              if (portionQuantity > 0) {
                fullSentence += ` (${totalPortions} ${portionText})`;
              }

              if (options.length > 0) {
                // List options per unit
                const optionsTextList = options.map((opt) => `${opt.quantity || 1} ${opt.label}`);
                const optionsSentence = optionsTextList.length === 1 
                  ? optionsTextList[0] 
                  : optionsTextList.length === 2 
                    ? optionsTextList.join(" and ") 
                    : optionsTextList.slice(0, -1).join(", ") + ", and " + optionsTextList.slice(-1);
                
                fullSentence += `, each with ${optionsSentence}`;
              }
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="text-[10px] text-orange-900 dark:text-orange-100 leading-snug p-2 bg-white/50 dark:bg-orange-950/40 backdrop-blur-sm rounded border border-orange-200 dark:border-orange-700/50"
                >
                  {fullSentence}.
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settlement & Actions Footer */}
      <div className="p-3 bg-linear-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-3">
        
        {/* Settlement Amount */}
        <div className="space-y-1">
          <p className="text-[8px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Settlement</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-black text-slate-400">₦</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {(order.vendorTotal || 0).toLocaleString('en-NG')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/vendors/order/${order._id?.$oid || order._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-4 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all hover:opacity-90 active:scale-95 group/btn"
          >
            View Details
            <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
    </motion.div>
  );
}
