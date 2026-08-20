import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SocialMedia, UserSocialMedia } from '../../../social-media/models/social-media';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-link',
  templateUrl: './link.component.html',
  styleUrl: './link.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkComponent implements OnInit {
  userSocialMediaForm: FormGroup;
  userSocialMediaData: UserSocialMedia = new UserSocialMedia();
  socialMediaList: SocialMedia[] = [];

  constructor(private fb: FormBuilder, public content: ContentService) {
    this.userSocialMediaForm = this.fb.group({
      icon: ['', Validators.required],
      name: ['', Validators.required],
      link: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSave() {}

  remove() {}
}
