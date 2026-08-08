export const metadata = {
  title: "Rider Reset Password",
  description:
    "Enter your OTP reset code and create a new secure password for your MelaChow rider account.",
  alternates: {
    canonical: "https://www.melachow.com/auth/rider/reset-password",
  },
  openGraph: {
    title: "Rider Reset Password | MelaChow",
    description: "Create a new password for your MelaChow rider account.",
    url: "https://www.melachow.com/auth/rider/reset-password",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Rider Reset Password" }],
  },
};

export default function RiderResetPasswordLayout({ children }) {
  return children;
}
