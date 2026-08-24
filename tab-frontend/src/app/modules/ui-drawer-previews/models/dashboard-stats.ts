export interface HrDashboardStats {

  positions: {
    active: number;
    closed: number;
    draft: number;

    newThisWeek: number;
    newThisMonth: number;
  };

  candidates: {
    total: number;

    addedThisWeek: number;
    addedThisMonth: number;
  };

  meetings: {
    today: number;
    week: number;
    month: number;
    total: number;
  };

  pipeline: {
    interviews: number;
    offers: number;
    hires: number;
  };

  trends: {
    positionsDeltaWeek: number;
    candidatesDeltaWeek: number;
    interviewsDeltaWeek: number;
  };
}