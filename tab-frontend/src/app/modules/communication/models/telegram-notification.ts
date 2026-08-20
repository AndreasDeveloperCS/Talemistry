export class TelegramNotification {
    _id?: string;
    roomId: string = '';
    content: string = '';
    userId: string = '';
    createdBy: string = '';
    createdDate: Date = new Date();
}