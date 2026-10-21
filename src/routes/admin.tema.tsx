import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminTheme";

export const Route = createFileRoute("/admin/tema")({
  head: () => ({
    meta: [
      { title: "Personalização | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Personalização" },
      { property: "og:title", content: "Personalização | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Personalização" },
    ],
  }),
  component: Page,
});
