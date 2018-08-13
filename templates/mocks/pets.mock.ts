import { HttpResponse } from '@angular/common/http';

const petsMock = (request) => new HttpResponse({
    status: 200,
    body: {
        url: 'https://www.wikipedia.org'
    }
});

export const listeners = [
    { url: '/store/inventory', methods: 'GET', name: 'getPets', response: petsMock }
];
