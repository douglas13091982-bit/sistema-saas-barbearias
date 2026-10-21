import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminAppointments";

export const Route = createFileRoute("/admin/agendamentos")({
  head: () => ({
    meta: [
      { title: "Agendamentos | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Agendamentos" },
      { property: "og:title", content: "Agendamentos | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Agendamentos" },
    ],
  }),
  component: Page,
});
