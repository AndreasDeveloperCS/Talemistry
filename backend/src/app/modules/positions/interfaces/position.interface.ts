import { OpenPosition } from "../models/open-position";

export interface IEnrichedPositionWithApplicantsCount {
  position: OpenPosition;
  applicantsCount: number;
}