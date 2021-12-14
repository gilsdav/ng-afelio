/* tslint:disable:no-unused-variable */
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { BsDatepickerModule, defineLocale, frLocale } from 'ngx-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { DatepickerComponent } from './datepicker.component';
import { DatepickerSubComponent } from './component/datepicker-sub.component';

defineLocale('fr', frLocale);

describe('DatepickerComponent', () => {
  let component: DatepickerComponent;
  let fixture: ComponentFixture<DatepickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        imports: [
            FormsModule,
            ReactiveFormsModule,
            BsDatepickerModule.forRoot(),
            TranslateModule.forRoot()
        ],
      declarations: [ DatepickerComponent, DatepickerSubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatepickerComponent);
    component = fixture.componentInstance;
    const controlKey = 'test';
    const form = new FormGroup({ [controlKey]: new FormControl() });
    component.field = {
        key: controlKey,
        templateOptions: {},
        form,
        formControl: form.get(controlKey),
        options: { showError: () => false }
    };
    defineLocale('fr');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
