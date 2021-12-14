/* tslint:disable:no-unused-variable */
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';

import { MultiselectComponent } from './multiselect.component';

describe('MultiselectComponent', () => {
    let component: MultiselectComponent;
    let fixture: ComponentFixture<MultiselectComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                TranslateModule.forRoot(),
                NgSelectModule
            ],
            declarations: [MultiselectComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MultiselectComponent);
        component = fixture.componentInstance;
        const controlKey = 'test';
        const form = new FormGroup({ [controlKey]: new FormControl() });
        component.field = {
            key: controlKey,
            templateOptions: {
                name: controlKey
            },
            form,
            formControl: form.get(controlKey),
            options: { showError: () => false }
        };

        component.to.options = [
            { label: 'm', value: false },
            { label: 'f', value: true }
        ];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
