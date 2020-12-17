import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

export interface <%= classify(name) %>StateModel {<% if(example) { %>
    // data: string<% } %>
}

@State<<%= classify(name) %>StateModel>({
    name: 'globalConfig',
    defaults: {<% if(example) { %>
        // data: ''<% } %>
    }
})
@Injectable()
export class <%= classify(name) %>State {

    constructor() {}
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
