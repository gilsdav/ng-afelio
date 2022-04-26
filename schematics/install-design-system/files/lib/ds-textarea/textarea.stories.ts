import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormControl, NgControl } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { createTranslateLoader } from '../../storybook-util/create-translate-loader.function';
import { TextareaComponent } from './textarea.component';
import { TextareaModule } from './textarea.module';
// @ts-ignore
import markdown from './textarea.stories.md';


const defaultArgTypes = {};

export default {
  title: 'DS/angular-components/Textarea',
  component: TextareaComponent,
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
        TextareaModule
      ],
      providers: [
        {
          provide: NgControl, useValue: {control: new FormControl()}
        }
      ]
    }),
  ],
  argTypes: defaultArgTypes,
  parameters: {
    notes: {markdown},
  }
} as Meta;

const Template: Story<TextareaComponent> = (args: TextareaComponent) => ({
  component: TextareaComponent,
  props: args,
});

export const Example: Story<TextareaComponent> = Template.bind({});
Example.args = {
  placeholder: {label: 'Placeholder'},
  isDisabled: false,
  maxlength: '',
  isOnError: false,
  customClasses: []
};
