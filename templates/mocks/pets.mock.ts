import { HttpResponse } from '@angular/common/http';

import { Mock } from './mockHttpInterceptor';

const petsMock = (request) => new HttpResponse({
    status: 200,
    body: {
        url: 'https://www.wikipedia.org'
    }
});

export const listeners: Mock[] = [
    { url: '/store/inventory', methods: 'GET', name: 'getPets', response: petsMock }
];
