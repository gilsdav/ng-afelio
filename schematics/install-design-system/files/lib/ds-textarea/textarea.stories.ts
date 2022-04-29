import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormControl, NgControl } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { createTranslateLoader } from '../../storybook-util/create-translate-loader.function';
import { DS_TextareaComponent } from './textarea.component';
import { DS_TextareaModule } from './textarea.module';
// @ts-ignore
import markdown from './textarea.stories.md';


const defaultArgTypes = {};

export default {
  title: 'DS/angular-components/Textarea',
  component: DS_TextareaComponent,
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
        DS_TextareaModule
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

const Template: Story<DS_TextareaComponent> = (args: DS_TextareaComponent) => ({
  component: DS_TextareaComponent,
  props: args,
});

export const Example: Story<DS_TextareaComponent> = Template.bind({});
Example.args = {
  placeholder: {label: 'Placeholder'},
  isDisabled: false,
  maxlength: '',
  isOnError: false,
  customClasses: []
};
