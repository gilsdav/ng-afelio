import { Mock } from './mockHttpInterceptor';
import { listeners as petsMocks } from './pets.mock';

export const mocks: Mock[] = [
    ...petsMocks
];
