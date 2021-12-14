
export interface ListFieldToDisplay {
    type: 'list';
    label: string;
    values: string[];
}

export interface TextboxFieldToDisplay {
    type: 'text';
    label: string;
    value: string;
}
