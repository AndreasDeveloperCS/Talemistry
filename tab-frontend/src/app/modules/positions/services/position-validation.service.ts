import { Injectable } from "@angular/core";
import { OpenPosition } from "../models/position";


@Injectable({
  providedIn: 'root'
})
export class PositionValidationService {

  validate(position: OpenPosition): [boolean, string[], string[]] {

    console.log('PositionValidationService', position);

    const validationErrorMessages: string[] = [];
    const validationWarningsMessages: string[] = [];
    position.positionElements[0].isIncluded = false;
    position.positionElements[8].isIncluded = false;
    // position.positionElements.forEach((element, index)=> {
    //     if (element.isIncluded && element.sectionContent === undefined || element.sectionContent === "" ) {
    //         validationErrorMessages.push(`Please fill the section "${element.sectionName}" or remove it`)
    //     }
    // });
    // const requiredSections = ["Job Responsibilities", "Short Project Description", "Benefits", "Summary"];

    if (!position.title || position.title == "") {
      validationErrorMessages.push(`Please fill the title of the position`);
    }
    if (!position.positionDetails.requirements.positionSkills) {
      validationErrorMessages.push(`Please fill position Skills in Details tab`);
    }
    // console.log(validationErrorMessages);
    return [!(validationErrorMessages.length > 0), validationErrorMessages, validationWarningsMessages];
  }

}