import { createFileRoute } from "@tanstack/react-router";
import { GoalsPage } from "@/routes/_app.employee.goals";

export const Route = createFileRoute("/_app/employee/create-goal")({
  component: GoalsPage,
});
