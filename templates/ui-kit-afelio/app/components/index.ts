import { ButtonComponent } from './button/button.component';
import { FormsComponent } from './forms/forms.component';
import { MarginComponent } from './margin/margin.component';
import { PaddingComponent } from './padding/padding.component';
import { GridComponent } from './grid/grid.component';

export const components = [
  ButtonComponent,
  FormsComponent,
  MarginComponent,
  PaddingComponent,
  GridComponent
];

export * from './button/button.component';
export { FormsComponent } from './forms/forms.component';
export { MarginComponent } from './margin/margin.component';
export { PaddingComponent } from './padding/padding.component';
export { GridComponent } from './grid/grid.component';
