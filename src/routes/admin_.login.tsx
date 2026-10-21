import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/admin/AdminLogin";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Login administrativo | BarberShop Pro" },
      { name: "description", content: "BarberShop Pro - Login administrativo" },
      { property: "og:title", content: "Login administrativo | BarberShop Pro" },
      { property: "og:description", content: "BarberShop Pro - Login administrativo" },
    ],
  }),
  component: Page,
});
