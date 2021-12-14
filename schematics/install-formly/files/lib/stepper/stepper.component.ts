import { CdkStep, CdkStepper, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { Component, ContentChildren, Input, QueryList } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { scrollToError } from '../helpers/controls-errors.helper';
import { markAllControlsAsTouched } from '../helpers/formgroup.helper';
import { scrollToTop } from '../helpers/navigation.helper';
import { StepComponent } from './step/step.component';


@Component({
    selector: 'daenae-stepper',
    templateUrl: './stepper.component.html',
    styleUrls: ['./stepper.component.scss'],
    providers: [
        { provide: CdkStepper, useExisting: StepperComponent },
        { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }
    ]
})
export class StepperComponent extends CdkStepper {

    /** Full list of steps inside the stepper, including inside nested steppers. */
    @ContentChildren(StepComponent, {descendants: true}) _steps: QueryList<StepComponent>;

    /** Steps that belong to the current stepper, excluding ones from nested steppers. */
    readonly steps: QueryList<StepComponent> = new QueryList<StepComponent>();

    @Input() canLeaveWhenInvalid = true;
    @Input() linearDaenae = true;
    @Input() autoScrollTop = true;
    @Input() stepState: {disabled?: boolean, readonly?: boolean}[] = [];

    public maximumStepThrough = 0;

    public get currentIndex(): number {
        return this.selectedIndex;
    }

    public selectStepByIndex(index: number): void {
        const currentStep = this.steps.find((step: CdkStep, i: number) => {
            return i === this.selectedIndex;
        });
        if (this.stepState && this.stepState[index] && this.stepState[index].disabled) {
            return ;
        }
        if (!this.canLeaveWhenInvalid) {
            if (index <= (this.steps.length - 1) && index >= 0 && (!currentStep.stepControl || currentStep.stepControl.valid)) {
                if ((index > this.selectedIndex && this.canForward(index)) || (index < this.selectedIndex  && this.canBackward(index))) {
                    this.selectedIndex = index;
                    this.scrollToTop();
                }
            } else if (currentStep.stepControl) {
                markAllControlsAsTouched(currentStep.stepControl as AbstractControl);
                scrollToError();
            }
        } else {
            if (currentStep.stepControl) {
                markAllControlsAsTouched(currentStep.stepControl as AbstractControl);
            }
            if ((index > this.selectedIndex && this.canForward(index)) || (index < this.selectedIndex  && this.canBackward(index))) {
                if (index <= (this.steps.length - 1) && index >= 0) {
                    this.selectedIndex = index;
                    this.scrollToTop();
                }
            } else {
                scrollToError();
            }
        }
    }

    private canForward(newIndex: number): boolean {
        if (!this.linearDaenae) {
            return true;
        }
        const hasInvalidStep = this.steps.some((step, index) => {
            if (index >= this.selectedIndex && index < newIndex) {
                if (step.stepControl && step.stepControl.invalid) {
                    return true;
                }
            }
        });
        return !hasInvalidStep;
    }

    private canBackward(newIndex: number): boolean {
        if (!this.linearDaenae) {
            return true;
        }
        const hasInvalidStep = this.steps.some((step, index) => {
            if (index >= this.selectedIndex && index <= newIndex) {
                if (step.stepControl && step.stepControl.invalid) {
                    return true;
                }
            }
        });
        return !hasInvalidStep;
    }

    public nextStep() {
        this.selectStepByIndex(this.selectedIndex + 1);
    }

    public previousStep() {
        this.selectStepByIndex(this.selectedIndex - 1);
    }

    private scrollToTop() {
        if (this.autoScrollTop) {
            scrollToTop();
        }
    }

}
