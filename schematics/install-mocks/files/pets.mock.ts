import { HttpRequest, HttpResponse } from '@angular/common/http';

import { Mock } from './mock.model';

const petsMock = (request: HttpRequest<any>) => new HttpResponse({
    status: 200,
    body: {
        url: 'https://www.wikipedia.org'
    }
});

export const listeners: Mock[] = [
    { url: '/store/inventory', methods: 'GET', name: 'getPets', response: petsMock }
];
