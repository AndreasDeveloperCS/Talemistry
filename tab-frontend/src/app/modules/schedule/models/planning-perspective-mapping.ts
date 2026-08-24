import { PlanningPerspectiveOption } from "./schedule-default-settings";

export const planningPerspectiveMapping: Record<string, PlanningPerspectiveOption> = {
  day: PlanningPerspectiveOption.day,
  week: PlanningPerspectiveOption.week,
  fortnight: PlanningPerspectiveOption.fortnight,
  month: PlanningPerspectiveOption.month,
  quarter: PlanningPerspectiveOption.quarter,
  year: PlanningPerspectiveOption.year,
  custom: PlanningPerspectiveOption.custom
};