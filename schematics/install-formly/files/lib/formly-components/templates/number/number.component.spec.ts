import { TranslateModule } from '@ngx-translate/core';
/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NumberComponent } from './number.component';


describe('NumberComponent', () => {
    let component: NumberComponent;
    let fixture: ComponentFixture<NumberComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                TranslateModule.forRoot()
            ],
            declarations: [NumberComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NumberComponent);
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

    it('should stop char', () => {
        let preventDefaultCalls = 0;
        const event: any = {
            key: 'e',
            preventDefault: () => { preventDefaultCalls += 1; }
        };
        component.onKeyDown(event);
        expect(preventDefaultCalls).toBe(1);
        event.key = '-';
        component.onKeyDown(event);
        expect(preventDefaultCalls).toBe(2);
        event.key = '5';
        component.onKeyDown(event);
        expect(preventDefaultCalls).toBe(2);
        event.key = '.';
        component.onKeyDown(event);
        expect(preventDefaultCalls).toBe(3);
        event.key = '7';
        component.onKeyDown(event);
        expect(preventDefaultCalls).toBe(3);
        event.key = ',';
        component.onKeyDown(event);
        expect(preventDefaultCalls).toBe(4);
        event.key = '+';
        component.onKeyDown(event);
        expect(preventDefaultCalls).toBe(5);
    });

    it('should stop paste', () => {
        let preventDefaultCalls = 0;
        const valueToTest = {
            text: '123brbr'
        };
        const event: any = {
            clipboardData: {
                getData: () => valueToTest.text
            },
            preventDefault: () => { preventDefaultCalls += 1; }
        };
        component.onPaste(event);
        expect(preventDefaultCalls).toBe(1);
        valueToTest.text = '8754';
        component.onPaste(event);
        expect(preventDefaultCalls).toBe(1);
        valueToTest.text = 'vevzv';
        component.onPaste(event);
        expect(preventDefaultCalls).toBe(2);
        valueToTest.text = '87e54';
        component.onPaste(event);
        expect(preventDefaultCalls).toBe(3);
        valueToTest.text = '448.587';
        component.onPaste(event);
        expect(preventDefaultCalls).toBe(4);
        valueToTest.text = '448587';
        component.onPaste(event);
        expect(preventDefaultCalls).toBe(4);
    });

});
