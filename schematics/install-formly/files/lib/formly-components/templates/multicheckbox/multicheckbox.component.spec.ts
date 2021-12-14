/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MulticheckboxComponent } from './multicheckbox.component';

const mockFormcontrol = {
    'm': new FormControl(false),
    'f': new FormControl(true)
};

describe('MulticheckboxComponent', () => {

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                FormlyModule,
                TranslateModule.forRoot()
            ],
            declarations: [MulticheckboxComponent]
        })
            .compileComponents();
    }));

    describe('With Non observableOptions', () => {
        let component: MulticheckboxComponent;
        let fixture: ComponentFixture<MulticheckboxComponent>;

        beforeEach(() => {
            fixture = TestBed.createComponent(MulticheckboxComponent);
            component = fixture.componentInstance;
            const controlKey = 'test';
            const form = new FormGroup({ [controlKey]: new FormControl() });
            component.field = {
                key: controlKey,
                templateOptions: {
                    name: 'test',
                    toggleAll: true
                },
                form,
                formControl: form.get(controlKey),
                options: { showError: () => false }
            };

            component.to.options = [
                { key: 'm', value: false },
                { key: 'f', value: true }
            ];
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should contain allToggable option', () => {
            const title = fixture.debugElement.query(By.css('[data-test="allTogglableCheckbox"'));
            expect(title).toBeTruthy();
            expect(title.nativeElement.textContent).toContain('FORM.ACTION_LABELS.SELECT_ALL');
        });

        it('should contain allToggable option and check all', () => {
            const title = fixture.debugElement.query(By.css('[data-test="allTogglableCheckbox"'));
            expect(title).toBeTruthy();
            expect(title.nativeElement.textContent).toContain('FORM.ACTION_LABELS.SELECT_ALL');
        });

        it('should proprely fill form from options values', (async(done) => {
            component.checkboxes$.subscribe((values) => {
                    expect(component.formCheckbox.get('f').value)
                        .toEqual((component.to.options as any[]).find((option) => option.key === 'f').value);
                    expect(component.formCheckbox.get('m').value)
                        .toEqual((component.to.options as any[]).find((option) => option.key === 'm').value);
                    done();
                });
        }));

        it('should test if form is correctly filled', () => {
            component.field = {...component.field, templateOptions : {...component.field.templateOptions, toggleAll: false}};
            fixture.detectChanges();
            const title = fixture.debugElement.query(By.css('[data-test="allTogglableCheckbox"]'));
            expect(title).toBeFalsy();
        });
    });

    describe('Test for toggleAll ', () => {
        let component: MulticheckboxComponent;
        let fixture: ComponentFixture<MulticheckboxComponent>;

        beforeEach(() => {
            fixture = TestBed.createComponent(MulticheckboxComponent);
            component = fixture.componentInstance;
            const controlKey = 'test';
            const form = new FormGroup({ [controlKey]: new FormControl() });
            component.field = {
                key: controlKey,
                templateOptions: {
                    name: 'test',
                    toggleAll: true
                },
                form,
                formControl: form.get(controlKey),
                options: { showError: () => false }
            };

            component.to.options = [
                { key: 'one', label: 'one', value: false },
                { key: 'two', label: 'two', value: false },
                { key: 'three', label: 'three', value: false }
            ];
        });

        it('should properly set -partial class with FormControl', () => {
            fixture.detectChanges();
            const checkboxDiv = fixture.debugElement.query(By.css('[data-test="allTogglableCheckbox"]>div'));
            fixture.detectChanges();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('-partial')).toBeFalsy();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('checked')).toBeFalsy();
            (component.formCheckbox as FormGroup).get('one').setValue(true);
            fixture.detectChanges();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('-partial')).toBeTruthy();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('checked')).toBeFalsy();
            (component.formCheckbox as FormGroup).get('two').setValue(true);
            (component.formCheckbox as FormGroup).get('three').setValue(true);
            fixture.detectChanges();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('-partial')).toBeFalsy();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('checked')).toBeTruthy();
        });

        it('should properly set -partial class with click Event', () => {
            fixture.detectChanges();
            const checkboxDiv = fixture.debugElement.query(By.css('[data-test="allTogglableCheckbox"]>div'));
            const checkboxLabel = fixture.debugElement.query(By.css('[data-test="allTogglableCheckbox"] button'));
            (component.formCheckbox as FormGroup).get('two').setValue(true);

            fixture.detectChanges();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('-partial')).toBeTruthy();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('checked')).toBeFalsy();
            (checkboxLabel.nativeElement as HTMLElement).dispatchEvent(new MouseEvent('click'));
            fixture.detectChanges();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('-partial')).toBeFalsy();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('checked')).toBeFalsy();
            (checkboxLabel.nativeElement as HTMLElement).dispatchEvent(new MouseEvent('click'));
            fixture.detectChanges();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('-partial')).toBeFalsy();
            expect((checkboxDiv.nativeElement as HTMLElement).classList.contains('checked')).toBeTruthy();
        });
    });

    describe('With observable options', () => {
        let component: MulticheckboxComponent;
        let fixture: ComponentFixture<MulticheckboxComponent>;
        const mock1 = [
            { key: 'one', label: 'one', value: false },
            { key: 'two', label: 'two', value: false },
            { key: 'three', label: 'three', value: false }
        ];

        beforeEach(() => {
            fixture = TestBed.createComponent(MulticheckboxComponent);
            component = fixture.componentInstance;
            const controlKey = 'test';
            const form = new FormGroup({ [controlKey]: new FormControl() });
            component.field = {
                key: controlKey,
                templateOptions: {
                    name: 'test',
                    toggleAll: true
                },
                form,
                formControl: form.get(controlKey),
                options: { showError: () => false }
            };
        });

        it('should properly fill checboxes when options are Observables', ((done) => {
            component.to.options = of(mock1).pipe(delay(200));
            fixture.detectChanges();
            component.checkboxes$.subscribe((values) => {
                Object.keys(component.formCheckbox.controls).forEach((optionKey: string, indice: number) => {
                    expect(optionKey).toEqual(mock1[indice].key);
                    expect(component.formCheckbox.controls[optionKey].value).toEqual(mock1[indice].value);
                });
                fixture.detectChanges();
                const HTMLCheckBoxes = fixture.debugElement.queryAll(By.css('[data-test="checkbox-label"]'));
                HTMLCheckBoxes.forEach((HTMLCheckBox, indice) => {
                    expect(HTMLCheckBox.nativeElement.textContent).toEqual(mock1[indice].label);
                });
                done();
            });
        }));
    });
});
