import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormControl, NgControl } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { createTranslateLoader } from '../../storybook-util/create-translate-loader.function';
import { RadioComponent } from './radio.component';
import { RadioModule } from './radio.module';
// @ts-ignore
import markdown from './radio.stories.md';

export default {
  title: 'DS/angular-components/Radio',
  component: RadioComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        BrowserAnimationsModule,
        HttpClientModule,
        TranslateModule.forRoot({
          defaultLanguage: 'fr',
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader),
            deps: [HttpClient]
          }
        }),
        RadioModule
      ],
      providers: [
        {
          provide: NgControl, useValue: { control: new FormControl() }
        }
      ]
    }),
  ],
  parameters: {
    notes: { markdown },
  }
} as Meta;

const Template: Story<RadioComponent> = (args: RadioComponent) => ({
  component: RadioComponent,
  props: args,
});

export const Default: Story<RadioComponent> = Template.bind({});
Default.args = {
  label: undefined,
  id: 'id',
  name: 'name',
  value: 'value',
  isDisabled: undefined,
  customClasses: []
};

export const Labelized: Story<RadioComponent> = Template.bind({});
Labelized.args = {
  label: {label: 'With label'},
  id: 'id',
  name: 'name',
  value: 'value',
  isDisabled: undefined,
  customClasses: []
};

export const isDisabled: Story<RadioComponent> = Template.bind({});
isDisabled.args = {
  isDisabled: true,
  label: {label: 'With label'},
  id: 'id',
  name: 'name',
  value: 'value',
  customClasses: []
};
