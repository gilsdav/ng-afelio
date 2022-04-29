import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { componentWrapperDecorator, Meta, moduleMetadata, Story } from '@storybook/angular';
import { createTranslateLoader } from '../../storybook-util/create-translate-loader.function';
import { DS_IconsEnum } from '../enums/public-api';
import { DS_IconComponent } from './icon.component';
import { DS_IconModule } from './icon.module';
// @ts-ignore
import markdown from './icon.stories.md';

export default {
  title: 'DS/angular-components/Icon',
  component: DS_IconComponent,
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
        DS_IconModule
      ],
    }),
    componentWrapperDecorator((story) => `
      <div class="flex flex-center">
        <div class="w-25">${story}</div>
      </div>
    `),
  ],
  argTypes: {
  },
  parameters: {
    notes: { markdown },
  }
} as Meta;

const Template: Story<DS_IconComponent> = (args: DS_IconComponent) => ({
  component: DS_IconComponent,
  props: args,
});

export const Example: Story<DS_IconComponent> = Template.bind({});
Example.args = {
  icon: DS_IconsEnum.home
};
