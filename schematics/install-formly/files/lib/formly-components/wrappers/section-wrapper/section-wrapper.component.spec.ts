/* tslint:disable:no-unused-variable */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SmartTranslatePipe } from '../../../pipes/smart-translate.pipe';
import { SectionWrapperComponent } from './section-wrapper.component';

describe('SectionWrapperComponent', () => {
    let component: SectionWrapperComponent;
    let fixture: ComponentFixture<SectionWrapperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                CommonModule,
                TranslateModule.forRoot()
            ],
            declarations: [SectionWrapperComponent, SmartTranslatePipe]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SectionWrapperComponent);
        component = fixture.componentInstance;
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
