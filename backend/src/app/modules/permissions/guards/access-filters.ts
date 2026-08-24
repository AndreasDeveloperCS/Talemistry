
import { ObjectId } from "bson";
import { Filtering, FilterRule } from "../../../helpers/filtering";
import { User } from "../../users/models/user";

export function getPublicAccessFilter(): Filtering {
    const filters: Filtering = [{
        property: 'isVerified',
        rule: FilterRule.EQUALS,
        value: true
    }];
    return filters;
}

export function getOwnerFilter(userId: any): Filtering {
    let id: ObjectId;
    //console.log('getOwnerFilter', userId, typeof userId);

    if (typeof userId === 'string') {
        id = new ObjectId(`${userId}`);
    } else if (userId instanceof ObjectId) {
        id = userId;
    } else {
        throw new Error('Invalid userId type: expected string or ObjectId');
    }

    //console.log('getOwnerFilter id', id);

    // return [{
    //     property: 'userId',
    //     rule: FilterRule.IN,
    //     value: `${id},${id.toString()}`
    // }];
    return [
        {
            property: 'userId',
            rule: FilterRule.EQUALS,
            value: `${id}`
        },
    ];
}

export function getSharedReadFilter(user: User): Filtering {
    return [{
        property: 'sharedReadIds',
        rule: FilterRule.IN,
        value: user._id
    },
    {
        property: 'sharedReadEmails',
        rule: FilterRule.IN,
        value: user.email
    },
    {
        property: 'participants.userId',
        rule: FilterRule.IN,
        value: user._id
    },
    {
        property: 'participants.email',
        rule: FilterRule.IN,
        value: user.email
    }];
}

export function getSharedEditFilter(user: User): Filtering {
    return [{
        property: 'sharedEditIds',
        rule: FilterRule.IN,
        value: user._id
    },
    {
        property: 'sharedEditEmails',
        rule: FilterRule.IN,
        value: user.email
    },
    {
        property: 'participants.userId',
        rule: FilterRule.IN,
        value: user._id
    },
    {
        property: 'participants.email',
        rule: FilterRule.IN,
        value: user.email
    }];
}

