import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { DS_IconsEnum, DS_icon_placement_Enum, DS_size_Enum, DS_ButtonTypeEnum } from '../enums';
import { createTranslateLoader } from '../../storybook-util/create-translate-loader.function';
import { DS_ButtonComponent } from './ds-button.component';
import { DS_ButtonModule } from './ds-button.module';
// @ts-ignore
import markdown from './ds-button.stories.md';

export default {
  title: 'DS/angular-components/Buttons',
  component: DS_ButtonComponent,
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
            deps: [HttpClient],
          },
        }),
        DS_ButtonModule,
      ],
    }),
  ],
  argTypes: {
    clicked: {
      action: 'clicked',
    },
    type: {
      control: {
        type: 'select',
      },
      options: Object.values(DS_ButtonTypeEnum),
    },
    size: {
      control: {
        type: 'select',
      },
      options: Object.values(DS_size_Enum),
    },
    iconPlacement: {
      control: {
        type: 'select',
      },
      options: Object.values(DS_icon_placement_Enum),
    },
    icon: {
      control: {
        type: 'select',
      },
      options: Object.values(DS_IconsEnum),
    },
  },
  parameters: {
    notes: { markdown },
  },
} as Meta;

const Template: Story<DS_ButtonComponent> = (args: DS_ButtonComponent) => ({
  component: DS_ButtonComponent,
  props: args,
});

export const Primary: Story<DS_ButtonComponent> = Template.bind({});
Primary.args = {
  label: { label: 'Primary' },
  type: DS_ButtonTypeEnum.PRIMARY,
  disabled: false,
  iconPlacement: undefined,
  icon: undefined,
  isFullWidth: true,
  minimumwidth: true,
  size: DS_size_Enum.normal,
  customClasses: [],
};

export const Secondary: Story<DS_ButtonComponent> = Template.bind({});
Secondary.args = {
  label: { label: 'Secondary' },
  type: DS_ButtonTypeEnum.SECONDARY,
};

export const Ternary: Story<DS_ButtonComponent> = Template.bind({});
Ternary.args = {
  label: { label: 'Ternary' },
  type: DS_ButtonTypeEnum.TERNARY,
  disabled: false,
  iconPlacement: undefined,
  icon: undefined,
  isFullWidth: true,
  minimumwidth: true,
  size: DS_size_Enum.normal,
  customClasses: [],
};

export const Link: Story<DS_ButtonComponent> = Template.bind({});
Link.args = {
  label: { label: 'Link' },
  type: DS_ButtonTypeEnum.LINK,
  disabled: false,
  icon: DS_IconsEnum.admin,
  iconPlacement: DS_icon_placement_Enum.after,
  isFullWidth: true,
  minimumwidth: true,
  size: DS_size_Enum.normal,
  customClasses: [],
};

export const Disabled: Story<DS_ButtonComponent> = Template.bind({});
Disabled.args = {
  label: { label: 'Disabled' },
  type: DS_ButtonTypeEnum.PRIMARY,
  disabled: true,
  iconPlacement: undefined,
  icon: undefined,
  isFullWidth: true,
  minimumwidth: true,
  size: DS_size_Enum.normal,
  customClasses: [],
};

export const NotFullWidth: Story<DS_ButtonComponent> = Template.bind({});
NotFullWidth.args = {
  label: { label: 'Not full width' },
  type: DS_ButtonTypeEnum.PRIMARY,
  isFullWidth: false,
  disabled: false,
  iconPlacement: undefined,
  icon: undefined,
  minimumwidth: true,
  size: DS_size_Enum.normal,
  customClasses: [],
};

export const WidthAuto: Story<DS_ButtonComponent> = Template.bind({});
WidthAuto.args = {
  label: { label: 'Width Auto' },
  type: DS_ButtonTypeEnum.PRIMARY,
  isFullWidth: false,
  minimumwidth: false,
  disabled: false,
  iconPlacement: undefined,
  icon: undefined,
  size: DS_size_Enum.normal,
  customClasses: [],
};

export const Small: Story<DS_ButtonComponent> = Template.bind({});
Small.args = {
  label: { label: 'Small' },
  type: DS_ButtonTypeEnum.PRIMARY,
  isFullWidth: false,
  size: DS_size_Enum.small,
  disabled: false,
  iconPlacement: undefined,
  icon: undefined,
  minimumwidth: true,
  customClasses: [],
};

export const ExtraSmall: Story<DS_ButtonComponent> = Template.bind({});
ExtraSmall.args = {
  label: { label: 'Extra Small' },
  type: DS_ButtonTypeEnum.PRIMARY,
  isFullWidth: false,
  size: DS_size_Enum.extraSmall,
  disabled: false,
  iconPlacement: undefined,
  icon: undefined,
  minimumwidth: true,
  customClasses: [],
};
export const IconBefore: Story<DS_ButtonComponent> = Template.bind({});
IconBefore.args = {
  label: { label: 'Width Auto' },
  type: DS_ButtonTypeEnum.PRIMARY,
  isFullWidth: false,
  icon: DS_IconsEnum.admin,
  iconPlacement: DS_icon_placement_Enum.before,
  disabled: false,
  minimumwidth: true,
  size: DS_size_Enum.normal,
  customClasses: [],
};

export const IconAfter: Story<DS_ButtonComponent> = Template.bind({});
IconAfter.args = {
  label: { label: 'Width Auto' },
  type: DS_ButtonTypeEnum.PRIMARY,
  isFullWidth: false,
  icon: DS_IconsEnum.admin,
  iconPlacement: DS_icon_placement_Enum.after,
  disabled: false,
  minimumwidth: true,
  size: DS_size_Enum.normal,
  customClasses: [],
};
