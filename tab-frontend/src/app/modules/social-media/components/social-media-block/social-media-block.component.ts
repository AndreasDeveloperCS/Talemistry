import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-social-media-block',
    templateUrl: './social-media-block.component.html',
    styleUrl: './social-media-block.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialMediaBlockComponent {

  constructor(  ) {}
}
