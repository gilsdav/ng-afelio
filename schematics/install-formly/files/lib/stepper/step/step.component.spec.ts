/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { CdkStepper, CdkStepperModule } from '@angular/cdk/stepper';

import { StepComponent } from './step.component';

describe('StepComponent', () => {
    let component: StepComponent;
    let fixture: ComponentFixture<StepComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                CdkStepperModule
            ],
            declarations: [StepComponent],
            providers: [
                { provide: CdkStepper, useValue: new CdkStepper(null, null) }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(StepComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
