import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/agenda")({
  beforeLoad: () => { throw redirect({ to: "/admin/agendamentos", replace: true }); },
});
