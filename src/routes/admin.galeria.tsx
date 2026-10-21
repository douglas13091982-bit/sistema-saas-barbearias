import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminGallery";

export const Route = createFileRoute("/admin/galeria")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Galeria | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Galeria" },
      { property: "og:title", content: "Galeria | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Galeria" },
    ],
  }),
  component: Page,
});
