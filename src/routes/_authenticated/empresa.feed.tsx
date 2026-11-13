import { createFileRoute } from "@tanstack/react-router";
import { FeedPage } from "@/components/eloflow/FeedPage";

export const Route = createFileRoute("/_authenticated/empresa/feed")({
  component: FeedPage,
});