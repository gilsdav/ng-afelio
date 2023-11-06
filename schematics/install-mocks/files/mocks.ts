import { Mock } from './mock.model';
import { listeners as petsMocks } from './pets.mock';

/**
 * Pay attention to the order, especially if you use a RegExp or angularPathMatcher.
 */
export const mocks: Mock[] = [
    ...petsMocks
];
