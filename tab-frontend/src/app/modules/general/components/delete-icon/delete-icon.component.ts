import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-delete-icon',
    templateUrl: './delete-icon.component.html',
    styleUrl: './delete-icon.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteIconComponent {

}
