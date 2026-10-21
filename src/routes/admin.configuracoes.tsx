import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminSettings";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Configurações" },
      { property: "og:title", content: "Configurações | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Configurações" },
    ],
  }),
  component: Page,
});
