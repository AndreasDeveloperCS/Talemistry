export class GdprPolicyModel {
  public gdprTitle: string = '';
  public gdprIcon: string = '';
  public statements: GdprStatement[] = [];
  public confirmationText: string = '';
  public rejectText: string = '';
}

export interface GdprStatement{
  icon: string;
  statementTitle: string;
  statementContent: string[];
}
