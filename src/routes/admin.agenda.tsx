import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminSchedule";

export const Route = createFileRoute("/admin/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Agenda" },
      { property: "og:title", content: "Agenda | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Agenda" },
    ],
  }),
  component: Page,
});
