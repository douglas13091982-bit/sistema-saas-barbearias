import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminReports";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Relatórios | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Relatórios" },
      { property: "og:title", content: "Relatórios | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Relatórios" },
    ],
  }),
  component: Page,
});
