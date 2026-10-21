import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminUsers";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Usuários | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Usuários" },
      { property: "og:title", content: "Usuários | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Usuários" },
    ],
  }),
  component: Page,
});
