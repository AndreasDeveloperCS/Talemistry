import { BaseEntity, OwnerEntity } from '../../general/models/base-entity';
import { PositionDetails, PositionStatus } from './position-details';

export function getItem(section: string, order: number): PositionItem {
  const item: PositionItem = new PositionItem();
  item.sectionName = section;
  item.sectionKey = section
    .replace(' ', '')
    .replace(' ', '')
    .replace('""', '');
  item.sectionContent = '';
  item.isIncluded = true;
  item.orderId = order;
  return item;

}

export class OpenPosition implements BaseEntity, OwnerEntity {

  _id?: any;
  title: string = '';
  titleCode: string = '';
  status: PositionStatus = PositionStatus.ACTIVE;

  positionDetails: PositionDetails = new PositionDetails();
  projectDescription: ProjectDescription = new ProjectDescription();
  jobResponsibilities: JobResponsibilities = new JobResponsibilities();

  requirements: PositionRequirements = new PositionRequirements();
  benefits: PositionBenefits = new PositionBenefits();
  summary: PositionSummary = new PositionSummary();

  positionElements: PositionItem[]; // current variant
  positionAlternativeElements: PositionItem[]; // initial variant

  contactNumber: string = '';
  isVerified = true;
  userId: any;
  createdBy: any;
  modifiedBy: any;
  applicantsCount?: number;

  constructor() {

    this.positionAlternativeElements = [
      //TODO Remove face item form this list
      getItem("Talent Role", 0),
      getItem("Details (General Info & Contract Conditions)", 1),
      getItem("Details (Position Requirements)", 2),
      getItem(this.projectDescription.sectionName, 3),
      getItem(this.jobResponsibilities.sectionName, 4),
      getItem(this.requirements.sectionName, 5),
      getItem(this.benefits.sectionName, 6),
      getItem(this.summary.sectionName, 7),
      getItem('Success', 8)
    ];

    this.positionElements = [
      //TODO Remove face item form this list
      getItem('Details', 0),
      getItem('Short Project Description', 1),
      getItem('Job Responsibilities', 2),
      getItem('Mandatory requirements', 3),
      getItem('Desired skills and knowledge', 4),
      getItem('Extra Points', 5),
      getItem('Nice to have', 6),
      getItem('Benefits', 7),
      getItem('Summary', 8),
    ];
  }

  getSkill?(section: string, order: number): PositionItem {
    const item: PositionItem = new PositionItem();
    item.sectionName = section;  // skill and coficient ()
    // item.sectionContent= '';
    item.isIncluded = true;
    item.orderId = order;
    return item;
  }

  createdDate: Date = new Date();
  modifiedDate?: Date;
}

export interface TabItem {
  sectionKey: string
  orderId: number;
  sectionContent?: string;
  sectionName?: string;
  isIncluded?: boolean;
}

export class PositionItem implements TabItem {

  sectionName: string = '';
  sectionKey: string = '';

  sectionContent: string = '';

  private _isIncluded: boolean = true;
  public get isIncluded(): boolean {
    return this._isIncluded;
  }
  public set isIncluded(value: boolean) {
    this._isIncluded = value;
  }
  orderId: number = -1;
  key: string = `${this.orderId}`;
}

export class PositionRequirements extends PositionItem {
  override sectionName: string = 'Requirements';
  override sectionKey: string = 'PositionRequirements';
  requirementSections: PositionItem[] = [
    getItem('Mandatory requirements', 0),
    getItem('Desired skills and knowledge', 1),
    getItem('Extra Points', 2),
    getItem('Nice to have', 3)
  ];
}

export class ProjectDescription extends PositionItem {
  override sectionName: string = 'Short Project Description';
  override sectionKey: string = 'ShortProjectDescription';
}

export class JobResponsibilities extends PositionItem {
  override sectionName: string = 'Job Responsibilities';
  override sectionKey: string = 'JobResponsibilities';
}

export class PositionBenefits extends PositionItem {
  override sectionName: string = 'Benefits';
  override sectionKey: string = 'Benefits';
}

export class PositionSummary extends PositionItem {
  override sectionName: string = 'Summary';
  override sectionKey: string = 'Summary';
  summarySections: PositionItem[] = [];
}