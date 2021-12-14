import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { TextareaComponent } from './textarea.component';
import { AutosizeModule } from 'ngx-autosize';



describe('TextareaComponent', () => {
  let component: TextareaComponent;
  let fixture: ComponentFixture<TextareaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        imports: [ReactiveFormsModule, FormlyModule, TranslateModule.forRoot(), AutosizeModule],
      declarations: [ TextareaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextareaComponent);
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
});
