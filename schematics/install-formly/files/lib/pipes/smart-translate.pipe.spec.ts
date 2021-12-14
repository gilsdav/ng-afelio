import { TranslateService } from '@ngx-translate/core';
/* tslint:disable:no-unused-variable */

import { TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SmartTranslatePipe } from './smart-translate.pipe';
import { ChangeDetectorRef } from '@angular/core';

class FakeChangeDetectorRef extends ChangeDetectorRef {
    markForCheck(): void {}
    detach(): void {}
    detectChanges(): void {}
    checkNoChanges(): void {}
    reattach(): void {}
}

describe('Pipe: SmartTranslate', () => {
    let translateService: TranslateService;
    let smartTranslatePipe: SmartTranslatePipe;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                SmartTranslatePipe
            ],
            providers: [],
            imports: [
                TranslateModule.forRoot()
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        translateService = TestBed.get(TranslateService);
        translateService.use('fr');
        translateService.setTranslation('fr', {
            'TEST': {
                'LABEL': 'TestLabel',
                'LABEL_TWO': {
                    'HELLO': 'Coucou'
                },
                'NAME': 'Bonjour {{name}}',
                'NAME_BIS': 'and {{name}}',
                'FIRSTNAME': 'Mr {{firstname}}'
            }
        });
        smartTranslatePipe = new SmartTranslatePipe(translateService, new FakeChangeDetectorRef());
    });

    it ('should create', () => {
        expect(smartTranslatePipe).toBeTruthy();
    });

    it ('should translate only one key', () => {
        expect(smartTranslatePipe.transform('TEST.LABEL')).toBe('TestLabel');
    });

    it ('should translate one key with other text', () => {
        expect(smartTranslatePipe.transform('test TEST.LABEL test')).toBe('test TestLabel test', '1');
        expect(smartTranslatePipe.transform('testTEST.LABEL test')).toBe('testTestLabel test', '2');
        expect(smartTranslatePipe.transform('test TEST.LABELtest')).toBe('test TestLabeltest', '3');
        expect(smartTranslatePipe.transform('testTEST.LABELtest')).toBe('testTestLabeltest', '4');
        expect(smartTranslatePipe.transform('test\nTEST.LABEL\ntest')).toBe('test\nTestLabel\ntest', '5');
        expect(smartTranslatePipe.transform('test\r\nTEST.LABEL\r\ntest')).toBe('test\r\nTestLabel\r\ntest', '6');
    });

    it('should not translate', () => {
        expect(smartTranslatePipe.transform('test TESTLABEL test')).toBe('test TESTLABEL test');
    });

    it('should translate multiple keys', () => {
        expect(smartTranslatePipe.transform('test TEST.LABEL test TEST.LABEL_TWO.HELLO')).toBe('test TestLabel test Coucou', '1');
        expect(smartTranslatePipe.transform('testTEST.LABEL testTEST.LABEL_TWO.HELLO')).toBe('testTestLabel testCoucou', '2');
        expect(smartTranslatePipe.transform('test TEST.LABELtest TEST.LABEL_TWO.HELLOtest')).toBe('test TestLabeltest Coucoutest', '3');
        expect(smartTranslatePipe.transform('testTEST.LABELtestTEST.LABEL_TWO.HELLO')).toBe('testTestLabeltestCoucou', '4');
        expect(smartTranslatePipe.transform('test\nTEST.LABEL\ntest\nTEST.LABEL_TWO.HELLO')).toBe('test\nTestLabel\ntest\nCoucou', '5');
        expect(smartTranslatePipe.transform('test\r\nTEST.LABEL\r\ntest\r\nTEST.LABEL_TWO.HELLO')).toBe('test\r\nTestLabel\r\ntest\r\nCoucou', '6');
        expect(smartTranslatePipe.transform('TEST.LABEL TEST.LABEL_TWO.HELLO')).toBe('TestLabel Coucou', '7');
        expect(smartTranslatePipe.transform('TEST.LABELTEST.LABEL_TWO.HELLO')).toBe('TEST.LABELTEST.LABEL_TWO.HELLO', '8');
    });

    it('should translate with parameters', () => {
        expect(smartTranslatePipe.transform('TEST.NAME', { name: 'Marley' })).toBe('Bonjour Marley', '1');
        expect(smartTranslatePipe.transform('TEST.NAME TEST.NAME_BIS', { name: 'Marley' })).toBe('Bonjour Marley and Marley', '2');
        expect(smartTranslatePipe.transform('TEST.NAME TEST.FIRSTNAME TEST.NAME_BIS', { name: 'Marley', firstname: 'Bob' })).toBe('Bonjour Marley Mr Bob and Marley', '3');
    });

});
