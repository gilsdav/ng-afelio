/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FormlyModule } from '@ngx-formly/core';
import { FormlySelectModule } from '@ngx-formly/core/select';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SmartTranslatePipe } from './../../../pipes/smart-translate.pipe';
import { ContextualMenuComponent } from './contextual-menu.component';


describe('ContextualMenuComponent', () => {
    let component: ContextualMenuComponent;
    let fixture: ComponentFixture<ContextualMenuComponent>;
    const options = [
        {
            value: { nom: 'toto', id: 1 },
            label: 'toto',
            group: '1'
        },
        {
            value: { nom: 'titi', id: 2 },
            label: 'titi',
            group: '1'
        },
        {
            value: { nom: 'tata', id: 3 },
            label: 'tata',
            group: '2'
        },
    ];

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                ContextualMenuComponent,
                SmartTranslatePipe
            ],
            imports: [
                FormlyModule,
                TranslateModule.forRoot(),
                ReactiveFormsModule,
                FormlySelectModule
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContextualMenuComponent);
        component = fixture.componentInstance;

        const controlKey = 'test';
        const form = new FormGroup({ [controlKey]: new FormControl() });
        component.field = {
            key: controlKey,
            type: 'contextual-menu',
            templateOptions: {
                buttonLabel: 'Remplir avec les infos de',
                options: of(options),
                click: (field, value) => {
                }
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

    it('should toggle menu on click on label', () => {
        const menuLabel = fixture.debugElement.query(By.css('[data-test="menu-label"]'));
        menuLabel.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        let menu = fixture.debugElement.query(By.css('.menu'));
        expect(menu).toBeTruthy();
        menuLabel.nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        menu = fixture.debugElement.query(By.css('.menu'));
        expect(menu).toBeFalsy();
    });

    it('should hide menu when click outside', () => {
        component.toggleMenu();
        fixture.detectChanges();
        let menu = fixture.debugElement.query(By.css('.menu'));
        expect(menu).toBeTruthy();
        document.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        menu = fixture.debugElement.query(By.css('.menu'));
        expect(menu).toBeFalsy();
    });

    it('should emit click callback with correct informations', () => {
        component.toggleMenu();
        fixture.detectChanges();
        const spy = spyOn(component.field.templateOptions, 'click');
        const li = fixture.debugElement.queryAll(By.css('li'));
        li[0].nativeElement.dispatchEvent(new MouseEvent('click'));
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(component.field, { value: options[0].value, group: options[0].group });
    });

    it('should display correct items with group', () => {
        component.toggleMenu();
        fixture.detectChanges();
        const li = fixture.debugElement.queryAll(By.css('li'));
        expect(li[0].nativeElement.textContent).toBe('toto');
        expect(li[1].nativeElement.textContent).toBe('titi');
        expect(li[2].nativeElement.children[0].nodeName).toBe('SPAN');
        expect(li[3].nativeElement.textContent).toBe('tata');
    });
});
