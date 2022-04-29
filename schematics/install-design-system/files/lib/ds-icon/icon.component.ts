import { BehaviorSubject } from 'rxjs';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { DS_IconsEnum } from '../enums/ds-icons.enum';
import { DS_IconService } from './icon.service';

/**
 * Doc on the icon
 */
@Component({
  selector: 'ds-icon',
  templateUrl: './icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DS_IconComponent implements OnChanges {

  /**
   * Icon
   *
   * @required
   */
  @Input()
  public icon!: DS_IconsEnum;

  /**
   * Custom HTML classes
   *
   */
  @Input()
  public customClasses?: string[];

  classes$ = new BehaviorSubject<string[]>([]);

  @ViewChild('svgContainer', {static: true}) svgReceiver!: ElementRef<any>;

  constructor(private DS_IconService: DS_IconService, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.classes$.next(this.getClasses());
    if (changes && changes['icon']) {
      this.setIcon();
    }
  }

  getClasses(): string[] {
    const classes: string[] = ['icon'];

    if (this.customClasses && this.customClasses.length > 0) {
      classes.push(...this.customClasses);
    }

    return classes;
  }

  private setIcon(): void {
    this.DS_IconService.getIcon(this.icon).subscribe(svg => {
      const div = this.renderer.createElement('div');
      div.innerHTML = svg as unknown as string;

      const svgElement = div.querySelector('svg') as SVGElement;
      if (this.svgReceiver.nativeElement.children && this.svgReceiver.nativeElement.children.length > 0) {
        while (this.svgReceiver.nativeElement.children.length > 0) {
          this.svgReceiver.nativeElement.children[0].remove();
        }
      }
      this.renderer.appendChild(this.svgReceiver.nativeElement, svgElement);
    });
  }

}
