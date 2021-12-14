/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SwitchComponent } from './switch.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('SwitchComponent', () => {
  let component: SwitchComponent;
  let fixture: ComponentFixture<SwitchComponent>;
  let form: FormGroup;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwitchComponent, ],
      imports: [
        ReactiveFormsModule,
        FormlyModule,
        TranslateModule.forRoot()
      ],

    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchComponent);
    component = fixture.componentInstance;
    const fc = new FormControl(false);
    form = new FormGroup({
      'test': fc
    });
    const config  = {
      key: 'test',
      type: 'switch',
      form,
      formControl: form.get('test'),
      templateOptions: {
          key: 'test',
          name: 'test',
          switchLabel: 'Rôle éducatif',
          switchDescription: 'Aide scolaire, conseil d\'hygiène de vie',
      }
    };
    component.field = config;


    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
