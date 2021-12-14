/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { InamiInputComponent } from './inami-input.component';


describe('TextComponent', () => {
    let component: InamiInputComponent;
    let fixture: ComponentFixture<InamiInputComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [InamiInputComponent],
            imports: [
                TranslateModule.forRoot(),
                FormlyModule,
                ReactiveFormsModule]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InamiInputComponent);
        component = fixture.componentInstance;
        const controlKey = 'test';
        const form = new FormGroup({ [controlKey]: new FormControl() });
        component.field = {
            key: controlKey,
            type: 'contextual-menu',
            templateOptions: {
            },
            form,
            formControl: form.get(controlKey),
            options: { showError: () => false }
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
