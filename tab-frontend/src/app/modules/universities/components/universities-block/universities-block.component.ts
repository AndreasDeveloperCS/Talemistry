import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContentService } from '../../../general/services/content.service';

@Component({
    selector: 'app-universities-block',
    templateUrl: './universities-block.component.html',
    styleUrl: './universities-block.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniversitiesBlockComponent {
    constructor(public content: ContentService) {}
}
