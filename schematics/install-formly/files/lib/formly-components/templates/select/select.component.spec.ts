/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { SelectComponent } from './select.component';


describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectComponent ],
      imports: [
        ReactiveFormsModule,
        FormlyModule,
        TranslateModule.forRoot()
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectComponent);
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

  it('should add or not placeholder', () => {
    let childDebugElement = fixture.debugElement.query(By.css('.test_placeholder'));
    expect(childDebugElement).toBeFalsy();
    component.to.placeholder = 'test';
    fixture.detectChanges();
    childDebugElement = fixture.debugElement.query(By.css('.test_placeholder'));
    expect(childDebugElement).toBeTruthy();
  });
});
