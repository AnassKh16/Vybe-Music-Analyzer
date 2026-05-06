import { useEffect } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { BottomNav } from "../components/BottomNav";
import { TopNav } from "../components/TopNav";
import { BackgroundParticles } from "../components/BackgroundParticles";
import { startNotificationsLivePoll } from "../lib/notificationsFeed";
import { getVybeUser, startAuthListener, subscribeVybeAuth } from "../lib/authStore";

import appCss from "../styles.css?url";
import waveFavicon from "../vybe-wave-favicon.svg?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ backgroundColor: "#000000" }}>
      <div className="max-w-md text-center">
        <h1 className="text-[clamp(3rem,12vw,5rem)] font-bold font-clash" style={{ color: "white" }}>404</h1>
        <h2 className="mt-4 text-xl font-semibold font-clash" style={{ color: "white" }}>Page not found</h2>
        <p className="mt-2 text-sm" style={{ color: "#A0A0A0" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="vybe-btn-primary inline-flex w-auto px-6"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Vybe — Feel the Data" },
      { name: "description", content: "Spotify-style music statistics and discovery app" },
      { name: "author", content: "Vybe" },
      { property: "og:title", content: "Vybe — Feel the Data" },
      { property: "og:description", content: "Spotify-style music statistics and discovery app" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Vybe — Feel the Data" },
      { name: "twitter:description", content: "Spotify-style music statistics and discovery app" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/061230cc-1a7a-4ee9-823b-0e76ae4b7d10/id-preview-5b7aab0d--ef5a5c26-4031-48bb-b425-e5c0cc920a08.lovable.app-1777625349268.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/061230cc-1a7a-4ee9-823b-0e76ae4b7d10/id-preview-5b7aab0d--ef5a5c26-4031-48bb-b425-e5c0cc920a08.lovable.app-1777625349268.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: waveFavicon,
      },
      {
        rel: "shortcut icon",
        href: waveFavicon,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: "#000000" }}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const noNavRoutes = ["/", "/signup", "/login"];
const publicRoutes = ["/", "/signup", "/login"];

function RootComponent() {
  const location = useLocation();
  const nav = useNavigate();
  const showNav = !noNavRoutes.includes(location.pathname);

  useEffect(() => {
    startNotificationsLivePoll();
  }, []);

  useEffect(() => {
    startAuthListener();
    const guard = () => {
      const user = getVybeUser();
      const path = location.pathname;
      const isPublic = publicRoutes.includes(path);
      if (user && (path === "/login" || path === "/signup" || path === "/")) {
        nav({ to: "/home" });
        return;
      }
      if (!user && !isPublic) {
        nav({ to: "/login" });
      }
    };
    guard();
    const unsub = subscribeVybeAuth(guard);
    return () => unsub();
  }, [location.pathname, nav]);

  return (
    <div
      className="vybe-shell-width mx-auto relative w-full min-w-0 overflow-x-clip"
      style={{ backgroundColor: "#000000", minHeight: "100dvh" }}
    >
      <BackgroundParticles />
      {showNav && <TopNav />}
      <div className="relative z-10 min-w-0 w-full">
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
