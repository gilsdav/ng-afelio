import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ButtonComponent } from './components';

const routes: Routes = [
  { path: 'home', component: HomeComponent, pathMatch: 'full', data: {category: 'Home', name: 'Home'} },
  { path: 'button', component: ButtonComponent, pathMatch: 'full', data: {category: 'Components', name: 'Buttons'} },
  { path: 'grid', component: HomeComponent, pathMatch: 'full', data: {category: 'Layout', name: 'Grid'} },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
