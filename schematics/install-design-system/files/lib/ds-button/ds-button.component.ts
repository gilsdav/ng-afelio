import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DS_IconsEnum, DS_icon_placement_Enum, DS_size_Enum, DS_ButtonTypeEnum } from '../enums/public-api';
import { DS_LabelWithParam } from '../interfaces/public-api';

/**
 * Doc on the button
 */
@Component({
  selector: 'ds-button',
  templateUrl: './ds-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
// tslint:disable-next-line: class-name
export class DS_ButtonComponent implements OnInit {

  /**
   * Button label
   *
   * @required
   */
  @Input()
  public label!: DS_LabelWithParam;

  /**
   * What kind of button it is? Default is primary
   */
  @Input()
  public type: DS_ButtonTypeEnum = DS_ButtonTypeEnum.PRIMARY;

  /**
   * Disable button
   */
  @Input()
  public disabled = false;

  //#region ICONS

  /**
   * Does the icon before or after the label ?
   */
  @Input()
  public iconPlacement: DS_icon_placement_Enum = DS_icon_placement_Enum.before;

  /**
   * What icon do you want to show ?
   */
  @Input()
  public icon?: DS_IconsEnum;

  //#endregion

  //#region SIZES

  /**
   * Button is full container width
   */
  @Input()
  public isFullWidth = true;

  /**
   * Button has a minimum width
   */
  @Input()
  public minimumwidth = true;

  /**
   * Button size
   *
   */
  @Input()
  public size: DS_size_Enum = DS_size_Enum.normal;

  //#endregion

  /**
   * Button custom HTML classes
   *
   */
  @Input()
  public customClasses: string[] = [];

  //#region OUTPUT

  /**
   * Optional click handler
   */
  @Output()
  public clicked = new EventEmitter();

  //#endregion

  constructor() {}

  ngOnInit(): void {}

  get classes(): { [key: string]: boolean } {
    const classes = {
      [this.type]: true,
      '-disabled': this.disabled,
      [this.size]: true,
      '-auto': !this.isFullWidth,
      '-no-min': !this.minimumwidth && !this.isFullWidth,
    };

    if (!!this.icon) {
      classes[this.iconPlacement] = true;
    }

    if (this.customClasses && this.customClasses.length > 0) {
      this.customClasses.forEach((customClass: string) => {
        classes[customClass] = true;
      });
    }

    return classes;
  }

  get iconClass(): { [key: string]: boolean } {
    if (!!this.icon) {
      return {[this.icon]: true};
    } else {
      return {};
    }
  }

  buttonClicked(): void {
    this.clicked.emit();
  }

}
