import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/public/Booking";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Agendar horário | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Agendar horário" },
      { property: "og:title", content: "Agendar horário | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Agendar horário" },
    ],
  }),
  component: Page,
});
