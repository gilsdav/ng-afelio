import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ButtonComponent, FormsComponent, MarginComponent, PaddingComponent } from './components';

const routes: Routes = [
  { path: 'home', component: HomeComponent, pathMatch: 'full', data: {category: 'Home', name: 'Home'} },
  { path: 'button', component: ButtonComponent, pathMatch: 'full', data: {category: 'Components', name: 'Buttons'} },
  { path: 'forms', component: FormsComponent, pathMatch: 'full', data: {category: 'Fragments', name: 'Forms'} },
  { path: 'margin', component: MarginComponent, pathMatch: 'full', data: {category: 'Properties', name: 'margin'} },
  { path: 'padding', component: PaddingComponent, pathMatch: 'full', data: {category: 'Properties', name: 'padding'} },
  { path: '**', redirectTo: '/home' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
