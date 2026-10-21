import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/Dashboard";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Dashboard" },
      { property: "og:title", content: "Dashboard | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Dashboard" },
    ],
  }),
  component: Page,
});
