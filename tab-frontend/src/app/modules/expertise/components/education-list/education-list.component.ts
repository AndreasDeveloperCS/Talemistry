import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-education-list',
    templateUrl: './education-list.component.html',
    styleUrl: './education-list.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EducationListComponent {
  educationItems: any[] = [];

  addEducationItems(education: any) {
    this.educationItems.push(education);
  }
}
