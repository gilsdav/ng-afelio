import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormControl, NgControl } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { createTranslateLoader } from '../../storybook-util/create-translate-loader.function';
import { DS_IconsEnum, DS_icon_placement_Enum, DS_Textfield_type_Enum } from '../enums/public-api';
import { TextfieldComponent } from './textfield.component';
import { TextfieldModule } from './textfield.module';
// @ts-ignore
import markdown from './textfield.stories.md';

const defaultArgTypes = {
  iconPlacement: {
    control: {
      type: 'select',
    },
    options: Object.values(DS_icon_placement_Enum)
  },
  icon: {
    control: {
      type: 'select',
    },
    options: Object.values(DS_IconsEnum)
  },
  type: {
    control: {
      type: 'select',
    },
    options: Object.values(DS_Textfield_type_Enum)
  }
};

export default {
  title: 'DS/angular-components/Textfield',
  component: TextfieldComponent,
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
        TextfieldModule
      ],
      providers: [
        {
          provide: NgControl, useValue: { control: new FormControl() }
        }
      ]
    }),
  ],
  argTypes: defaultArgTypes,
  parameters: {
    notes: { markdown },
  }
} as Meta;

const Template: Story<TextfieldComponent> = (args: TextfieldComponent) => ({
  component: TextfieldComponent,
  props: args,
});

export const Example: Story<TextfieldComponent> = Template.bind({});
Example.args = {
  placeholder: { label: 'Placeholder' },
  isDisabled: false,
  type: DS_Textfield_type_Enum.text,
  iconPlacement: undefined,
  icon: undefined,
  customClasses: [],
};

export const Disabled: Story<TextfieldComponent> = Template.bind({});
Disabled.args = {
  isDisabled: true,
  placeholder: { label: 'Disabled' },
  type: DS_Textfield_type_Enum.text,
  iconPlacement: undefined,
  icon: undefined,
  customClasses: []
};

export const IconBefore: Story<TextfieldComponent> = Template.bind({});
IconBefore.args = {
  icon: DS_IconsEnum.esigna,
  iconPlacement: DS_icon_placement_Enum.before,
  isDisabled: false,
  placeholder: { label: 'Icon before' },
  type: DS_Textfield_type_Enum.text,
  customClasses: []
};

export const IconAfter: Story<TextfieldComponent> = Template.bind({});
IconAfter.args = {
  icon: DS_IconsEnum.esigna,
  iconPlacement: DS_icon_placement_Enum.after,
  placeholder: { label: 'Icon after' },
  isDisabled: false,
  type: DS_Textfield_type_Enum.text,
  customClasses: []
};
