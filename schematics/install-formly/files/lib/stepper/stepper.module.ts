import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { StepperComponent } from './stepper.component';
import { StepComponent } from './step/step.component';

@NgModule({
    declarations: [StepperComponent, StepComponent],
    imports: [CommonModule, CdkStepperModule],
    exports: [StepperComponent, StepComponent, CdkStepperModule]
})
export class StepperModule { }
