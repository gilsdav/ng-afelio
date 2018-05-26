import {
    ActionReducerMap,
    createFeatureSelector,
    createSelector,
} from '@ngrx/store';

// import * as fromExample from './example.reducer';

// feature state
export interface FeatureState {
    // example: fromExample.ExampleState;
}

// reducers
export const reducers: ActionReducerMap<FeatureState> = {
    // example: fromExample.reducer
};

// feature selector
export const getFeatureState = createFeatureSelector<FeatureState>('myFeature');

// example
// export const getExampleState = createSelector(
//     getFeatureState,
//     (state: FeatureState) => state.example
// );

// export const getSubState = createSelector(getExampleState, fromExample.getSubState);
