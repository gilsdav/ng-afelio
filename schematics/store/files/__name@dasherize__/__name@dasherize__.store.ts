import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';

import { ClearState } from './<%= dasherize(name) %>.actions'

export interface <%= classify(name) %>StateModel {<% if(example) { %>
    // data: string<% } %>
}

const defaultStateModel: <%= classify(name) %>StateModel = {<% if(example) { %>
    // data: ''<% } %>
}

@State<<%= classify(name) %>StateModel>({
    name: 'globalConfig',
    defaults: { ...defaultStateModel }
})
@Injectable()
export class <%= classify(name) %>State {

    constructor() {}

    @Action(ClearState)
    ClearState(ctx: StateContext<<%= classify(name) %>StateModel>) {
        ctx.setState({ ...defaultStateModel });
    }
<% if(example) { %>
    // @Selector()
    // static data(currentState: <%= classify(name) %>StateModel): string {
    //     return currentState.data;
    // }

    // @Action(FeedData)
    // feedData(ctx: StateContext<<%= classify(name) %>StateModel>, action: FeedData) {
    //     ctx.patchState({
    //         data: 'this is data'
    //     });
    // }
<% } %>
}
