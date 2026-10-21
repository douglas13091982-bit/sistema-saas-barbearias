import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/public/BookingConfirmation";

export const Route = createFileRoute("/confirmacao/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Confirmação | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Confirmação" },
      { property: "og:title", content: "Confirmação | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Confirmação" },
    ],
  }),
  component: Page,
});
