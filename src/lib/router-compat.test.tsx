import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, it } from "vitest";
import { useSearchParams } from "./router-compat";

function BookingQuery() {
  const [params] = useSearchParams();
  return <output>{params.get("service")} / {params.get("barber")}</output>;
}

it.each([
  "/?service=%222%22&barber=%221%22",
  "/?service=2&barber=1",
])("reads legacy booking IDs from %s", async (entry) => {
  const router = createRouter({
    routeTree: createRootRoute({ component: BookingQuery }),
    history: createMemoryHistory({ initialEntries: [entry] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  expect(await screen.findByText("2 / 1")).toBeInTheDocument();
});
