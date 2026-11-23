import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/tema")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/configuracoes", replace: true });
  },
});
