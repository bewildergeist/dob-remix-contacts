type ContactMutation = {
    _id?: string;
    first?: string;
    last?: string;
    avatar?: string;
    twitter?: string;
    notes?: string;
    favorite?: boolean;
};

export type ContactRecord = ContactMutation & {
    _id: string;
    createdAt: string;
};
