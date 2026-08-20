import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core"
import { CalendarView } from "../../models/meeting.model"

@Component({
  selector: "app-view-switcher",
  templateUrl: './view-switcher.component.html',
  styleUrl: './view-switcher.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewSwitcherComponent {
  @Input() currentView!: CalendarView
  @Output() onViewChange = new EventEmitter<CalendarView>()

  views = [
    { key: "month" as const, label: "Month", icon: "calendar_month" },
    { key: "week" as const, label: "Week", icon: "view_week" },
    { key: "day" as const, label: "Day", icon: "calendar_today" },
  ];
}
