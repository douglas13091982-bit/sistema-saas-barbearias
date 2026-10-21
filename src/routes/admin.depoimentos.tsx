import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminTestimonials";

export const Route = createFileRoute("/admin/depoimentos")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Depoimentos | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Depoimentos" },
      { property: "og:title", content: "Depoimentos | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Depoimentos" },
    ],
  }),
  component: Page,
});
