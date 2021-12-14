/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HourInputComponent } from './hour-input.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { isHourValid } from '../../validators/hour.validator';

describe('HourInputComponent', () => {
    let component: HourInputComponent;
    let fixture: ComponentFixture<HourInputComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports:[
                ReactiveFormsModule
            ],
            declarations: [ HourInputComponent ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HourInputComponent);
        component = fixture.componentInstance;
        const form = new FormGroup({ ['hourStart']: new FormControl() });
        component.field = {
            key: 'hour-input',
            templateOptions: {
                label: 'Détail de la prestation',
                placeholder: '11:00',
                required: true
            },
            form,
            formControl: form.get('hourStart'),
            options: { showError: () => false },
            validators: {
                validation: [isHourValid]
            }
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have filled with Formly fieldType properties', () => {
        expect(component.key).toBe('hour-input');
        const input = fixture.debugElement.query(By.css('.textfield__field')).nativeElement;
        expect(input.placeholder).toBe('11:00');
        expect(component.formControl.errors).toEqual({required: true});
    })

    it('should be invalid with 25:90', () => {
        component.formControl.setValue('25:90');
        expect(component.formControl.valid).toBeFalsy();
        expect(component.formControl.errors).toEqual({invalidHour: true});
    })

    it('should be valid with 23:59', () => {
        component.formControl.setValue('23:59');
        expect(component.formControl.valid).toBeTruthy();
        expect(component.formControl.errors).toEqual(null);
    })
});
