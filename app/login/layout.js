// Login page has no auth required — it IS the entry point.
// We give it a title (uses root template: "Sign In | LancerLink")
// but keep robots directives permissive so users can find it.
export const metadata = {
  title: "Sign In",
  description:
    "Sign in to your LancerLink client portal. Access your project dashboard, invoices, and shared files with a secure magic-link login.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({ children }) {
  return children;
}
