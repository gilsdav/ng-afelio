/* tslint:disable:no-unused-variable */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { SimpleFieldWrapperComponent } from './simple-field-wrapper.component';


describe('SimpleFieldWrapperComponent', () => {
    let component: SimpleFieldWrapperComponent;
    let fixture: ComponentFixture<SimpleFieldWrapperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormlyModule,
                TranslateModule.forRoot(),
                MatTooltipModule
            ],
            declarations: [SimpleFieldWrapperComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SimpleFieldWrapperComponent);
        component = fixture.componentInstance;
        component.field = {
            templateOptions: {},
            form: new FormGroup({}),
            formControl: new FormGroup({}),
            options: { showError: () => false }
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
