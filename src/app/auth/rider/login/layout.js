export const metadata = {
  title: "Rider Login",
  description:
    "Sign in to the MelaChow rider portal to manage food delivery requests and rider account activity.",
  alternates: {
    canonical: "https://www.melachow.com/auth/rider/login",
  },
  openGraph: {
    title: "Rider Login | MelaChow",
    description: "Access the MelaChow rider portal.",
    url: "https://www.melachow.com/auth/rider/login",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Rider Login" }],
  },
};

export default function RiderLoginLayout({ children }) {
  return children;
}
