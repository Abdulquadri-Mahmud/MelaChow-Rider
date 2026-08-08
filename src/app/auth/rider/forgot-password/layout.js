export const metadata = {
  title: "Rider Forgot Password",
  description:
    "Reset your password for the MelaChow rider portal to maintain access to delivery operations.",
  alternates: {
    canonical: "https://www.melachow.com/auth/rider/forgot-password",
  },
  openGraph: {
    title: "Rider Forgot Password | MelaChow",
    description: "Request a password reset code for your MelaChow rider account.",
    url: "https://www.melachow.com/auth/rider/forgot-password",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Rider Forgot Password" }],
  },
};

export default function RiderForgotPasswordLayout({ children }) {
  return children;
}
