export const metadata = {
  title: "Rider Registration",
  description:
    "Apply to become a MelaChow rider and receive delivery offers after platform approval.",
  alternates: {
    canonical: "https://www.melachow.com/auth/rider/register",
  },
  openGraph: {
    title: "Rider Registration | MelaChow",
    description: "Apply to join the MelaChow rider network.",
    url: "https://www.melachow.com/auth/rider/register",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Rider Registration" }],
  },
};

export default function RiderRegisterLayout({ children }) {
  return children;
}
