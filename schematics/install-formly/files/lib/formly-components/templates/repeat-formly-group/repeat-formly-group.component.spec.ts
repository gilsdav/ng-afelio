import { MatTooltipModule } from '@angular/material/tooltip';
import { Component, OnInit } from '@angular/core';
/* tslint:disable:no-unused-variable */
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { SmartTranslatePipe } from './../../../pipes/smart-translate.pipe';
import { RepeatFormlyGroupComponent } from './repeat-formly-group.component';

@Component({
    template: `
    <ng-container *ngIf="formlyConfig">
        <form [formGroup]="formGroup" class="form">
            <formly-form [fields]="formlyConfig" [form]="formGroup" [model]="model">
            </formly-form>
        </form>
    </ng-container>
    `
})
class RepeatGroupFakeComponent implements OnInit {
    public formGroup =  new FormGroup({});
    public model = {};
    public formlyConfig: FormlyFieldConfig[] = [{
        key: 'repeatKey',
        type: 'repeat',
        templateOptions: {
            addText: 'ADD'
        },
        fieldArray: {
            fieldGroup:  [
                {
                   template: '<div>TEST</div>'
                }
            ]
        }
    }];

    ngOnInit() {

    }

}

describe('RepeatFormlyGroupComponent', () => {
    let component: RepeatGroupFakeComponent;
    let fixture: ComponentFixture<RepeatGroupFakeComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ RepeatFormlyGroupComponent, SmartTranslatePipe, RepeatGroupFakeComponent ],
            imports: [
                FormlyModule.forRoot({
                    types: [
                        {name: 'repeat',  component: RepeatFormlyGroupComponent, wrappers: []}
                    ]
                }),
                TranslateModule.forRoot(),
                ReactiveFormsModule,
                MatTooltipModule
            ]
        }).compileComponents();

    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(RepeatGroupFakeComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();

    });


    it('should have an add button, no remove button', () => {
        fixture.detectChanges();

        const addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));
        expect(addButton).toBeTruthy();

        const removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));
        expect(removeButton).toBeFalsy();

    });

    it('should show the proper label on the add button', () => {
        fixture.detectChanges();

        const addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));
        expect(addButton.nativeElement.textContent).toContain('ADD');
    });

    it('should have a remove button if the number of group is more than zero', () => {
        fixture.detectChanges();

        const addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));
        let removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));
        expect(removeButton).toBeFalsy();

        // Add one groups
        addButton.nativeElement.dispatchEvent(new MouseEvent('click'));

        fixture.detectChanges();
        removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));
        expect(removeButton).toBeTruthy();

    });

    xit('should have a remove button only if the number of groups is more than the minRepeat', () => {
        component.formlyConfig[0].templateOptions.minRepeat = 1;
        fixture.detectChanges();

        const addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));
        let removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));
        expect(removeButton).toBeFalsy();

        // Add two groups
        addButton.nativeElement.dispatchEvent(new MouseEvent('click'));

        fixture.detectChanges();
        removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));
        expect(removeButton).toBeFalsy();

        addButton.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));
        expect(removeButton).toBeTruthy();
    });

    xit('should have the minimum groups if minRepeat is set', fakeAsync(() => {
        component.formlyConfig[0].templateOptions.minRepeat = 2;
        fixture.detectChanges();
        tick(100);
        const formArray = component.formGroup.controls.repeatKey as FormArray;

        expect(formArray.controls.length).toBe(2);
    }));

    it('should disable the add button if maxRepeat is reached', () => {
        component.formlyConfig[0].templateOptions.maxRepeat = 2;
        fixture.detectChanges();

        let addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));
        expect(addButton).toBeTruthy();

        addButton.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        addButton.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));

        expect(addButton).toBeFalsy();
    });

    it('should have the proper number of group after each action', () => {
        fixture.detectChanges();

        const addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));
        const formArray = component.formGroup.controls.repeatKey as FormArray;

        expect(formArray.controls.length).toBe(0);
        addButton.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        expect(formArray.controls.length).toBe(1);
        addButton.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        expect(formArray.controls.length).toBe(2);

        const removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));
        removeButton.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        expect(formArray.controls.length).toBe(1);

    });

    it('should hide add and remove buttons if form is disabled', () => {
        fixture.detectChanges();
        let addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));
        addButton.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        let removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));

        expect(addButton).toBeTruthy();
        expect(removeButton).toBeTruthy();

        component.formGroup.disable();
        fixture.detectChanges();
        addButton = fixture.debugElement.query(By.css('[data-test="addButton"]'));
        removeButton = fixture.debugElement.query(By.css('[data-test="removeButton"]'));
        expect(addButton).toBeFalsy();
        expect(removeButton).toBeFalsy();
    });
});
