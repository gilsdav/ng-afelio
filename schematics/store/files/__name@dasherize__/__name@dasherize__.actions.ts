
export class ClearState {
    static readonly type = '[<%= classify(name) %>] Clear State';
}
<% if(example) { %>
// export class FeedData {
//     static readonly type = '[<%= classify(name) %>] Feed Data';
// }
<% } %>
