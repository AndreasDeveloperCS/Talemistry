import { ChangeDetectionStrategy, Component } from '@angular/core';
import { take } from 'rxjs';
import { CandidateUserProfile } from 'src/app/modules/expertise/models/candidate-user-profile';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';
import { Filtering, Sorting } from 'src/app/modules/general/services/search-logic.service';

@Component({
  selector: 'app-users-block',
  templateUrl: './users-block.component.html',
  styleUrl: './users-block.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersBlockComponent {
  public sorting: Sorting = {
    property: 'createdDate',
    direction: "ASC"
  } 
  filtering: Filtering = [];
  
  constructor(public service: CandidateUserProfileService,) {}

  ngOnInit() {
    this.service
      .getAllAsync(50, 0, this.sorting, this.filtering, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('CandidateUserProfile', res);
        },
        error: (err) => {
          console.error('Error loading data', err);
        },
      });
  }
}
