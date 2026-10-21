import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminHomeContent";

export const Route = createFileRoute("/admin/conteudo")({
  head: () => ({
    meta: [
      { title: "Conteúdo | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Conteúdo" },
      { property: "og:title", content: "Conteúdo | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Conteúdo" },
    ],
  }),
  component: Page,
});
