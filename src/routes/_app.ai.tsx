import { createFileRoute } from "@tanstack/react-router";
import { AIAssistantPage } from "./_app.employee.ai";

export const Route = createFileRoute("/_app/ai")({
  component: AIAssistantPage,
});
