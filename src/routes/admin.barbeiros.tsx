import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminBarbers";

export const Route = createFileRoute("/admin/barbeiros")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Barbeiros | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Barbeiros" },
      { property: "og:title", content: "Barbeiros | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Barbeiros" },
    ],
  }),
  component: Page,
});
