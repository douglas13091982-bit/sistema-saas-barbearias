import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminAppointments";

export const Route = createFileRoute("/admin/agendamentos")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Agendamentos | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Agendamentos" },
      { property: "og:title", content: "Agendamentos | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Agendamentos" },
    ],
  }),
  component: Page,
});
