/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { TextInformationComponent } from './text-information.component';
import { SmartTranslatePipe } from './../../../pipes/smart-translate.pipe';


describe('TextInformationComponent', () => {
  let component: TextInformationComponent;
  let fixture: ComponentFixture<TextInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TextInformationComponent, SmartTranslatePipe ],
      imports: [ TranslateModule.forRoot() ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextInformationComponent);
    component = fixture.componentInstance;
    const controlKey = 'test';
    const form = new FormGroup({ [controlKey]: new FormControl() });
    component.field = {
      key: controlKey,
      templateOptions: {
        text: '<p>text de test</p>'
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

  it('should not contain raw html tag', () => {
    const element = fixture.debugElement.query(By.css("[data-test]"));
    expect(element.nativeElement.textContent).toEqual('text de test');
  });


});
