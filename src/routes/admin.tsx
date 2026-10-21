import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Painel" },
      { property: "og:title", content: "Painel | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Painel" },
    ],
  }),
  component: Page,
});
