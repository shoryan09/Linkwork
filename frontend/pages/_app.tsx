import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";

function SocketInitializer() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    socket.emit("join-room", user.id);
    return () => {
      // Best-effort: there is no listener on server for leaving user room,
      // but we can disconnect to avoid duplicate listeners across reloads.
      // Do not disconnect globally to avoid killing others; rely on page lifecycle.
    };
  }, [user?.id]);
  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketInitializer />
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}
