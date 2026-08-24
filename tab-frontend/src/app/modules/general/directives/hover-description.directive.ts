import { Directive, HostListener, Input, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[hoverDescription]',
  standalone: false
})
export class HoverDescriptionDirective {
  @Input('hoverDescription') description!: string;
  tooltip!: HTMLElement; 

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.description) return;
  
    this.tooltip = this.renderer.createElement('div');
    const text = this.renderer.createText(this.description);
    this.renderer.appendChild(this.tooltip, text);
    this.renderer.appendChild(document.body, this.tooltip);
  
    this.renderer.setStyle(this.tooltip, 'position', 'absolute');
    this.renderer.setStyle(this.tooltip, 'background', '#00145a');
    this.renderer.setStyle(this.tooltip, 'padding', '8px 12px');
    this.renderer.setStyle(this.tooltip, 'border-radius', '5px');
    this.renderer.setStyle(this.tooltip, 'border', '1px solid #caeaff');
    this.renderer.setStyle(this.tooltip, 'font-size', '14px');
    this.renderer.setStyle(this.tooltip, 'color', 'white');
    this.renderer.setStyle(this.tooltip, 'white-space', 'nowrap');
    this.renderer.setStyle(this.tooltip, 'pointer-events', 'none');
    this.renderer.setStyle(this.tooltip, 'z-index', '1000');
    this.renderer.setStyle(this.tooltip, 'max-width', '15rem'); 
    this.renderer.setStyle(this.tooltip, 'max-width', 'fit-content'); 
    this.renderer.setStyle(this.tooltip, 'word-wrap', 'break-word'); 
    this.renderer.setStyle(this.tooltip, 'white-space', 'normal');
    this.renderer.setStyle(this.tooltip, 'overflow-wrap', 'break-word'); 
  
    const rect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
  
    const top = rect.bottom + window.scrollY + 5; 
    const left = rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;
  
    this.renderer.setStyle(this.tooltip, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltip, 'opacity', '0');
    this.renderer.setStyle(this.tooltip, 'transition', 'opacity 0.2s ease-in-out');

    setTimeout(() => {
    this.renderer.setStyle(this.tooltip, 'opacity', '1');
    }, 10);
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltip) {
      this.renderer.removeChild(document.body, this.tooltip);
    }
  }
}