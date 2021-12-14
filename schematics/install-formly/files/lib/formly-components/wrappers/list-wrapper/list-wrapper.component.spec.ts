/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ListWrapperComponent } from './list-wrapper.component';
import { CommonModule } from '@angular/common';
import { FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormGroup } from '@angular/forms';

describe('ListWrapperComponent', () => {
  let component: ListWrapperComponent;
  let fixture: ComponentFixture<ListWrapperComponent>;
  
  beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
          imports: [
              CommonModule,
              FormlyModule,
              TranslateModule.forRoot()
          ],
          declarations: [ListWrapperComponent]
      })
          .compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(ListWrapperComponent);
      component = fixture.componentInstance;
      component.field = {
          templateOptions: {},
          form: new FormGroup({}),
          options: { showError: () => false }
      };
      fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
