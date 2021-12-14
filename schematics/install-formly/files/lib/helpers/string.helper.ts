import moment from 'moment-es6';

export function capitalize_Words(str: string) {
    if (!str) {
        return str;
    }
    return str.replace(/(^|[\s-])\S/g, function (match) {
        return match.toUpperCase();
    });
    // What is under TitlePipe:
    // return str.replace(/\w\S*/g, function(txt) {
    //     return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    // });
}


export function durationBetweenTwoDatesInHours(startDate: Date, endDate: Date): string {
    const momentStart = moment(startDate);
    const momentEnd = moment(endDate);
    const durationSeconds = momentEnd.diff(momentStart, 'seconds');
    return formatDuration(durationSeconds);
}

export function formatDuration(durationSeconds: number): string {
    const hours =  Math.floor(durationSeconds / 3600);
    durationSeconds %= 3600;
    const minutes = durationSeconds !== 0 ? durationSeconds / 60 : 0;

    return `${hours}h${String(minutes).padStart(2, '0')}`;
}


export function capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function nameCase(name: string) {
    return name.replace(/([\wÀ-ž]+)/g, (a: string) => {
        return capitalizeFirstLetter(a);
    });
}
