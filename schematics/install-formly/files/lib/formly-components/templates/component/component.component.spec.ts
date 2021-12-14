import { TranslateModule } from '@ngx-translate/core';
import { FormlyModule } from '@ngx-formly/core';
/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, DebugElement, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { FormGeneratorResult, FormlyComponentsModule } from '@fcsd-daenae/form-components';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'daenae-my-component',
    template: `
        <h1>test</h1>
        <p>{{ title }}</p>
    `
})
export class MyComponent implements OnInit, OnChanges {

    @Input() title: string;
    @Input() second: string;

    public previousChanges: SimpleChanges;

    constructor() { }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        this.previousChanges = changes;
    }

}

@Component({
    template: `
        <form [formGroup]="form.formGroup" class="form">
            <formly-form [fields]="form.formlyConfig" [form]="form.formGroup" [model]="form.model">
            </formly-form>
        </form>`
})
class FakeComponent implements OnInit {

    public form: FormGeneratorResult;

    ngOnInit(): void {
        this.form = this.generateFormGroup();
    }

    private generateFormGroup(): FormGeneratorResult {
        return {
            formGroup: new FormGroup({}),
            model: {},
            formlyConfig: [
                {
                    key: 'bob',
                    type: 'component',
                    templateOptions: {
                        component: MyComponent,
                        componentProperties: {
                            title: 'Coucou',
                            second: 'Yo'
                        }
                    }
                }
            ]
        };
    }

}

describe('ComponentComponent', () => {
    let component: FakeComponent;
    let fixture: ComponentFixture<FakeComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot(),
                FormlyModule.forRoot(),
                FormlyComponentsModule
            ],
            declarations: [FakeComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FakeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show component', () => {
        const h1 = fixture.debugElement.query(By.css('h1'));
        expect(h1).toBeTruthy();
        expect(h1.nativeElement.textContent.trim()).toContain('test');
    });

    it('should show input', () => {
        const p = fixture.debugElement.query(By.css('p'));
        expect(p).toBeTruthy();
        expect(p.nativeElement.textContent.trim()).toContain('Coucou');
    });

    it('should call ngOnChanges', () => {
        const myComponent = fixture.debugElement.query(By.css('daenae-my-component')).componentInstance;
        const changes: SimpleChanges = {
            title: {
                currentValue: 'Coucou',
                previousValue: undefined,
                firstChange: true,
                isFirstChange: () => true
            },
            second: {
                currentValue: 'Yo',
                previousValue: undefined,
                firstChange: true,
                isFirstChange: () => true
            }
        };
        expect(JSON.stringify(myComponent.previousChanges)).toEqual(JSON.stringify(changes));
    });

});
