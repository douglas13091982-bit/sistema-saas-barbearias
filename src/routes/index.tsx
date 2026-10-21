import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/public/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Agendamento Online | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Agendamento Online" },
      { property: "og:title", content: "Agendamento Online | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Agendamento Online" },
    ],
  }),
  component: Page,
});
