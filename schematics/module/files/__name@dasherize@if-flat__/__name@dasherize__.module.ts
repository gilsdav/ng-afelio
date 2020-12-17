import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';<% if(stores) { %>
import { NgxsModule } from '@ngxs/store';<% } %>

import { <%= classify(name) %>RoutingModule } from './<%= dasherize(name) %>-routing.module';
import { components } from './components';
import { containers } from './containers';<% if(pipes) { %>
import { pipes } from './pipes';<% } %>
import { services } from './services';<% if(guards) { %>
import { guards } from './guards';<% } %><% if(stores) { %>
import { stores } from './stores';<% } %>

@NgModule({
  imports: [
    CommonModule,
    <%= classify(name) %>RoutingModule,<% if(stores) { %>
    NgxsModule.forFeature(stores),<% } %>
  ],
  declarations: [
    ...components,
    ...containers,<% if(pipes) { %>
    ...pipes,<% } %>
  ],
  providers: [
    ...services,<% if(guards) { %>
    ...guards,<% } %>
  ]
})
export class <%= classify(name) %>Module {}
