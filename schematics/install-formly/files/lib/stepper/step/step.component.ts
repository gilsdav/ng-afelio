import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { CdkStep } from '@angular/cdk/stepper';

@Component({
  selector: 'daenae-step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepComponent extends CdkStep {

    @Input() groupHeaderLabel?: string;

}
