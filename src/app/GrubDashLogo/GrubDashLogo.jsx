
const LogoImage = () => (
  <img
    src="/logo.png"
    alt="MelaChow Logo"
    className="md:w-[280px] w-[270px] object-contain"
  />
);

export default function MelaChowLogo() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <LogoImage />

      {/* Animated Bar Loader */}
      <div className="relative w-44 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
        <div className="absolute h-full w-1/3 bg-[#FF6600] animate-bar-move rounded-full"></div>
      </div>

      {/* Animation Style */}
      <style jsx>{`
        @keyframes bar-move {
          0% {
            left: -35%;
            width: 30%;
          }
          50% {
            left: 35%;
            width: 50%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }

        .animate-bar-move {
          animation: bar-move 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

