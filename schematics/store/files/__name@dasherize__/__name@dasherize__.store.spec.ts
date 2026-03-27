import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { <%= classify(name) %>State } from './<%= dasherize(name) %>.store';

describe('<%= classify(name) %> state', () => {
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [provideStore([<%= classify(name) %>State])],
            providers: [],
        }).compileComponents();

        store = TestBed.inject(Store);
    });

    it('should be created', () => {
        expect(store).toBeDefined();
    });
});