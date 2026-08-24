import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivityAccessStatus, RecruiterActivityAccess, RecruiterActivityAccessView, RecruiterSearchResult } from '../../models/recruiter-activity-access.model';
import { RecruiterActivityAccessService } from '../../services/recruiter-activity-access.service';
import { finalize } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-recruiter-activity-access',
  templateUrl: './recruiter-activity-access.component.html',
  styleUrl: './recruiter-activity-access.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecruiterActivityAccessComponent {
  searchEmail = '';
  loading: boolean = false;
  pendingRequestsSent: RecruiterActivityAccess[] = [];
  pendingRequestsReceived: RecruiterActivityAccess[] = [];
  supervisedRecruiters: RecruiterActivityAccess[] = [];
  mySupervisors: RecruiterActivityAccess[] = [];
  foundRecruiter?: RecruiterSearchResult;
  recruiterNotFound: boolean = false;
  userId: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  readonly ActivityAccessStatus = ActivityAccessStatus;

  constructor(
    private recruiterActivityAccessService: RecruiterActivityAccessService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.recruiterActivityAccessService
      .getMyActivityAccess()
      .subscribe({

        next: result => {
          console.log("My Activity Access", result);

          this.pendingRequestsSent = result.pendingRequestsSent;

          this.pendingRequestsReceived = result.pendingRequestsReceived;

          this.supervisedRecruiters = result.supervisedRecruiters;

          this.mySupervisors = result.mySupervisors;

        },

        error: (err) => {

          console.error(err);

        }

    });

}

  searchRecruiter(): void {

    const email = this.searchEmail.trim().toLowerCase();

    if (!email) {
        return;
    }

    this.loading = true;
    this.foundRecruiter = undefined;
    this.recruiterNotFound = false;

    this.recruiterActivityAccessService
      .searchRecruiterByEmail(email)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (recruiter) => {
          if (recruiter) {
            this.foundRecruiter = recruiter;
          } else {
            this.recruiterNotFound = true;
          }
        },
        error: (error) => {
          console.error('Unable to search recruiter', error);
          this.foundRecruiter = undefined;
        }
      });
  }

  requestSupervision(): void {
    if (!this.foundRecruiter) {
      return;
    }

    this.loading = true;
    const entity: RecruiterActivityAccess = {
      supervisorId: this.userId || undefined,
      recruiterId: this.foundRecruiter._id,
      status: ActivityAccessStatus.Pending,
      createdDate: new Date
    }

    this.recruiterActivityAccessService
      .createAsync(entity)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({

        next: () => {
          this.searchEmail = '';
          this.foundRecruiter = undefined;
          this.recruiterNotFound = false;
          this.loadData();
        },

        error: err => {
          console.error('Unable to send request', err);
        }
      });
  }

  grantSupervision() {
    
  }

  acceptRequest(request: RecruiterActivityAccess): void {
    request.status = ActivityAccessStatus.Accepted;
    this.supervisedRecruiters.push(request);
    this.pendingRequestsReceived = this.pendingRequestsReceived.filter(x => x !== request);
  }

  rejectRequest(request: RecruiterActivityAccess): void {
    request.status = ActivityAccessStatus.Rejected;

    this.pendingRequestsReceived = this.pendingRequestsReceived.filter(x => x !== request);
  }

  cancelRequest(request: RecruiterActivityAccess): void {
    this.pendingRequestsSent = this.pendingRequestsSent.filter(x => x !== request);
  }

  removeAccess(request: RecruiterActivityAccess, list: RecruiterActivityAccess[]): void {
    const index = list.indexOf(request);
    if (index >= 0) {
      list.splice(index, 1);
    }
  }

  getUserName(item: any) {
    return 'John Doe';
  }
}