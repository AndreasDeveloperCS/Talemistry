interface TelegramUser {
    id: number;
    first_name?: string;
    username?: string;
}

interface TelegramChat {
    id: number;
    type: string;
}

interface TelegramMessage {
    message_id: number;
    from: TelegramUser;
    chat: TelegramChat;
    text?: string;
}

interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
}