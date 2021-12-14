
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DatepickerSubComponent } from './datepicker-sub.component';
import { Component } from '@angular/core';
import { BsDatepickerModule, defineLocale, frLocale } from 'ngx-bootstrap';

defineLocale('fr', frLocale);

@Component({
  selector: `daenae-host-component`,
  template: `<daenae-sub-datepicker [formControl]="dateControl"  [placeholder]="placeholder" [dateFormat]="dateFormat"
  ></daenae-sub-datepicker>`
})
class TestHostComponent {
  public disabled = false;
  public placeholder: string;
  public dateFormat = 'DD/MM/YYYY';

  public minDate = '01/01/1920';
  public maxDate = new Date();

  public dateControl: FormControl;

  public constructor() {
    this.dateControl = new FormControl({ value: null });
  }
}
describe('DatepickerComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule,
        ReactiveFormsModule,
        BsDatepickerModule.forRoot()],
      declarations: [DatepickerSubComponent, TestHostComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();
  });

  it('should create', () => {
    expect(testHostComponent).toBeTruthy();
  });

  it('should update the formcontrol with the value', () => {
    testHostComponent.dateControl.patchValue('10/06/1993');
    testHostFixture.detectChanges();
    expect(testHostComponent.dateControl.value).toBe('10/06/1993');
    expect(testHostComponent.dateControl.valid).toBeTruthy();
  });


  it('should update the formcontrol with the value', () => {
    testHostComponent.dateControl.patchValue('10/06/1993');
    testHostFixture.detectChanges();
    expect(testHostComponent.dateControl.value).toBe('10/06/1993');
    expect(testHostComponent.dateControl.valid).toBeTruthy();
  });

  // TODO: improve the unit tests + tester datemin - datemax

});
