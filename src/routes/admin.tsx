import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Painel | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Painel" },
      { property: "og:title", content: "Painel | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Painel" },
    ],
  }),
  component: Page,
});
