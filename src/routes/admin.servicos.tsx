import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminServices";

export const Route = createFileRoute("/admin/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Serviços" },
      { property: "og:title", content: "Serviços | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Serviços" },
    ],
  }),
  component: Page,
});
