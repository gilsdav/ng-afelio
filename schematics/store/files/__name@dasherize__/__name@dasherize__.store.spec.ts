import { TestBed, waitForAsync } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { <%= classify(name) %>State } from './<%= dasherize(name) %>.store';

describe('<%= classify(name) %> state', () => {
    let store: Store;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                NgxsModule.forRoot([<%= classify(name) %>State])
            ],
            providers: [
            ]
        }).compileComponents();
        store = TestBed.inject(Store);
    }));

});

