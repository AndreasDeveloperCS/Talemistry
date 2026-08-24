import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-computer-logo',
    templateUrl: './computer-logo.component.html',
    styleUrl: './computer-logo.component.scss',
    standalone: true,
    imports: [VideoPlayerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComputerLogoComponent {
    public videoSrc = `${environment.apiUrl}presentation-content/video-promo-comp`;
}
