import { Mock } from './mockHttpInterceptor';
import { listeners as petsMocks } from './pets.mock';

/**
 * Pay attention to the order, especially if you use a RegExp.
 */
export const mocks: Mock[] = [
    ...petsMocks
];
