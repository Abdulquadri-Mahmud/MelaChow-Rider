export default function VendorProfileImageSkeleton() {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 
        animate-[shimmer_1.6s_infinite] bg-[length:200%_100%]" />
    </div>
  );
}
