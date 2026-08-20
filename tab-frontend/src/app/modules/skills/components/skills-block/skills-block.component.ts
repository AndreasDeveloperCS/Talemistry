import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-skills-block',
  templateUrl: './skills-block.component.html',
  styleUrl: './skills-block.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsBlockComponent {

  constructor() { }
}
