import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormControl, NgControl } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { moduleMetadata, Meta, Story } from '@storybook/angular';
import { createTranslateLoader } from '../../storybook-util/create-translate-loader.function';

import { CheckboxComponent } from './checkbox.component';
import { CheckboxModule } from './checkbox.module';
// @ts-ignore
import markdown from './checkbox.stories.md';

export default {
  title: 'DS/angular-components/Checkbox',
  component: CheckboxComponent,
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
        CheckboxModule
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

const Template: Story<CheckboxComponent> = (args: CheckboxComponent) => ({
  component: CheckboxComponent,
  props: args,
});

export const ExampleWithLabel: Story<CheckboxComponent> = Template.bind({});
ExampleWithLabel.args = {
  label: {label: 'Checkbox with label'},
  id: 'checkBoxId',
  isDisabled: false,
  isFullWidth: true,
  customClasses: []
};

export const ExampleWithoutLabel: Story<CheckboxComponent> = Template.bind({});
ExampleWithoutLabel.args = {
  label: undefined,
  id: 'checkBoxId',
  isDisabled: false,
  isFullWidth: true,
  customClasses: []
};

export const ExampleNotfullWidth: Story<CheckboxComponent> = Template.bind({});
ExampleNotfullWidth.args = {
  isFullWidth: false,
  label: undefined,
  id: 'checkBoxId',
  isDisabled: false,
  customClasses: []
};
