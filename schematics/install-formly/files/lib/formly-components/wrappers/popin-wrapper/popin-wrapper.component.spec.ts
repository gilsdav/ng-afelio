/* tslint:disable:no-unused-variable */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { PopinWrapperComponent } from './popin-wrapper.component';


describe('PopinWrapperComponent', () => {
  let component: PopinWrapperComponent;
  let fixture: ComponentFixture<PopinWrapperComponent>;

  beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
          imports: [
              CommonModule,
              FormlyModule,
              TranslateModule.forRoot()
          ],
          declarations: [PopinWrapperComponent]
      })
          .compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(PopinWrapperComponent);
      component = fixture.componentInstance;
      component.field = {
          templateOptions: {},
          form: new FormGroup({}),
          options: {
              showError: () => false,
              updateInitialValue: () => null
            }
      };
      fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
