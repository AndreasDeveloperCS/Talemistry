import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { take } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { UserSocialMedia } from '../../../social-media/models/social-media';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';
import { LinkFormComponent } from '../link-form/link-form.component';

@Component({
  selector: 'app-social-media-platforms',
  templateUrl: './social-media-platforms.component.html',
  styleUrl: './social-media-platforms.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialMediaPlatformsComponent {
  public get userSocialMediaList(): UserSocialMedia[] {
    return this.candidateUserProfileService.model.userSocialMediaList;
  }
  public set userSocialMediaList(value: UserSocialMedia[]) {
    this.candidateUserProfileService.model.userSocialMediaList = value;
  }

  constructor(
    public candidateUserProfileService: CandidateUserProfileService,
    private cdr: ChangeDetectorRef,
    private dialogHelper: DialogHelperService, public content: ContentService,
  ) {
    console.log('Social Media List', this.candidateUserProfileService.model.userSocialMediaList);
  }

  add() {
    this.openUserSocialMediaDialog(undefined);
  }

  edit(media: UserSocialMedia) {
    this.openUserSocialMediaDialog(media);
  }

  openUserSocialMediaDialog(media: UserSocialMedia | undefined) {
    this.dialogHelper.openDialog(
      LinkFormComponent,
      (userSociaMedia: UserSocialMedia) => {
        if (!userSociaMedia) {
          return;
        }
        if (media) {
          const index = this.userSocialMediaList.indexOf(media);
          this.userSocialMediaList.splice(index, 1);
        }

        this.candidateUserProfileService.model.userSocialMediaList.push(userSociaMedia);
        this.cdr.markForCheck();

        this.candidateUserProfileService
          .updateAsync(this.candidateUserProfileService.model, true, false).pipe(take(1)).subscribe({
            next: (res) => {
              console.log('Candidate profile updated successfully.', res);
              this.cdr.markForCheck();
            },
            error: (err) => {
              console.error('Error updating candidate profile:', err);
              this.cdr.markForCheck();
            }
        });
      }, { panelClass: "panel-class-dialog", data: media }
    );
  }

  numberToString(value: number | undefined) {
    return value ? value.toString() : '';
  }

  delete(media: UserSocialMedia) {
    const executeDelete = async (data: any) => {
      if (!data) {
        return;
      }
      if (media) {
        const index = this.userSocialMediaList.findIndex(
          (item) => item?.profileLink == media?.profileLink
        );
        this.userSocialMediaList.splice(index, 1);
      }
      this.candidateUserProfileService.model.userSocialMediaList = this.userSocialMediaList;
      this.cdr.markForCheck();

      this.candidateUserProfileService
        .updateAsync(this.candidateUserProfileService.model, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Candidate profile updated successfully.', res);
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error updating candidate profile:', err);
            this.cdr.markForCheck();
          }
      });
    }
    this.dialogHelper.confirmationDialog(executeDelete);
  }

  moveUp(index: number): void {
    this.userSocialMediaList[index].priority = index - 1;
    this.userSocialMediaList.sort((a, b) => a.priority - b.priority);
    this.userSocialMediaList.every((item) => (item.priority = index));
  }

  moveDown(index: number): void {
    this.userSocialMediaList[index].priority += 1;
    this.userSocialMediaList.sort((a, b) => a.priority - b.priority);
  }
}