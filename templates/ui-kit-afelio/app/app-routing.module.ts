import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ButtonComponent, FormsComponent, MarginComponent, PaddingComponent, GridComponent } from './components';

const routes: Routes = [
  { path: 'home', component: HomeComponent, pathMatch: 'full', data: {category: 'Home', name: 'Home'} },
  // Components
  { path: 'button', component: ButtonComponent, pathMatch: 'full', data: {category: 'Components', name: 'Buttons'} },
  // Fragments
  { path: 'forms', component: FormsComponent, pathMatch: 'full', data: {category: 'Fragments', name: 'Forms'} },
  // Layout
  { path: 'grid', component: GridComponent, pathMatch: 'full', data: {category: 'Layout', name: 'Grid'} },
  // Properties
  { path: 'margin', component: MarginComponent, pathMatch: 'full', data: {category: 'Properties', name: 'Margin'} },
  { path: 'padding', component: PaddingComponent, pathMatch: 'full', data: {category: 'Properties', name: 'Padding'} },
  // Other
  { path: '**', redirectTo: '/home' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
