/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from './button.component';
import { FormControl, FormGroup } from '@angular/forms';

describe('ButtonComponent', () => {
    let component: ButtonComponent;
    let fixture: ComponentFixture<ButtonComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot()
            ],
            declarations: [ButtonComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ButtonComponent);
        component = fixture.componentInstance;
        const controlKey = 'test';
        const form = new FormGroup({ [controlKey]: new FormControl() });
        component.field = {
            key: controlKey,
            templateOptions: {
                label: 'bob',
                click: () => {},
                className: 'my-class'
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

    it('should setLabel', () => {
        const shownLabel = (fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement).innerText;
        expect(shownLabel).toBe('bob');
    });

    it('should call click', () => {
        const spyer = spyOn(component.field.templateOptions, 'click');
        (fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement).click();
        expect(spyer).toHaveBeenCalled();
    });

    it('should set class', () => {
        const shownClass = (fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement).className;
        expect(shownClass).toContain('my-class');
    });
});
