import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminClients";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Clientes | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Clientes" },
      { property: "og:title", content: "Clientes | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Clientes" },
    ],
  }),
  component: Page,
});
