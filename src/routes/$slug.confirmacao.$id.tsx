import {createFileRoute} from "@tanstack/react-router";
import Page from "@/views/public/BookingConfirmation";
export const Route=createFileRoute("/$slug/confirmacao/$id")({component:Page});
