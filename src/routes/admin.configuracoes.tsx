import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminSettings";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Configurações | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Configurações" },
      { property: "og:title", content: "Configurações | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Configurações" },
    ],
  }),
  component: Page,
});
