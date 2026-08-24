import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GdprPolicyModel } from '../../models/gdpr-model';
import { GdprService } from '../../services/gdpr.service';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyPolicyComponent implements OnInit {

  public gdprStatus: boolean = false;
  public gdprContent: GdprPolicyModel = new GdprPolicyModel();

  constructor(public content: ContentService,
    private gdprService: GdprService) {
      window.scrollTo(0, 0);
  }

  ngOnInit(): void {
    this.gdprContent = this.gdprService.getGdprPolicy();
  }
}
