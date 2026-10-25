import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminHome";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Painel administrativo | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Painel administrativo" },
      { property: "og:title", content: "Painel administrativo | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Painel administrativo" },
    ],
  }),
  component: Page,
});
