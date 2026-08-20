export class Interview {
  _id: any;
  talentId: any;
  positionId: any;

  meetingLink!: string;
  scheduledAt!: Date;
  duration!: number;

  recordingUrl?: string;
  liveCodingUrl?: string;
}

export class Assessment {
  _id: any;
  talentId: any;
  positionId: any;

  type!: 'coding' | 'task' | 'quiz';
  score?: number;
  resultUrl?: string;
}