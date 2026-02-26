"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";

type GoogleAuthButtonProps = {
  onError?: (message: string) => void;
};

const GOOGLE_BUTTON_STYLE = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
};

export default function GoogleAuthButton({ onError }: GoogleAuthButtonProps) {
  const api = useApi();
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError?.("Google Client ID não configurado");
      return;
    }

    const initialize = () => {
      const googleAccounts = window.google?.accounts?.id;
      if (!googleAccounts || !buttonRef.current) {
        return false;
      }

      googleAccounts.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const data = await api.post("/api/auth/google", {
              credential: response.credential,
            });

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.push("/home");
          } catch (error: any) {
            onError?.(
              error?.message ||
                "Erro ao autenticar com Google. Tente novamente.",
            );
          }
        },
        ux_mode: "popup",
      });

      googleAccounts.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });

      initializedRef.current = true;
      return true;
    };

    if (initialize()) {
      return;
    }

    const interval = window.setInterval(() => {
      if (initialize()) {
        window.clearInterval(interval);
      }
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [api, onError, router]);

  return (
    <Box sx={GOOGLE_BUTTON_STYLE}>
      <div ref={buttonRef} />
    </Box>
  );
}
