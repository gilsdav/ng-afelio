/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { EmailComponent } from './email.component';

describe('EmailComponent', () => {
  let component: EmailComponent;
  let fixture: ComponentFixture<EmailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        imports: [ReactiveFormsModule, FormlyModule, TranslateModule.forRoot()],
        declarations: [ EmailComponent ],
        providers: []
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailComponent);
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create an error', () => {
    component.formControl.setValue('blabla');
    expect(component.formControl.errors).toEqual({emailInvalid: true});
    expect(component.field.form.valid).toBeFalsy();
  });

  it('should not create errors', () => {
    component.formControl.setValue('blabla@mail.be');
    expect(component.formControl.errors).toEqual(null);
    expect(component.field.form.valid).toBeTruthy();
  });
});
