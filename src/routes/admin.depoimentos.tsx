import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminTestimonials";

export const Route = createFileRoute("/admin/depoimentos")({
  head: () => ({
    meta: [
      { title: "Depoimentos | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Depoimentos" },
      { property: "og:title", content: "Depoimentos | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Depoimentos" },
    ],
  }),
  component: Page,
});
