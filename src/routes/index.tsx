import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/saas/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Gestão completa para barbearias | MenuBarber" },
      { name: "description", content: "Site, agenda, equipe, faturamento e repasses por barbeiro em um só sistema para barbearias." },
      { property: "og:title", content: "Gestão completa para barbearias | MenuBarber" },
      { property: "og:description", content: "Site, agenda, equipe, faturamento e repasses por barbeiro em um só sistema para barbearias." },
    ],
  }),
  component: Page,
});
