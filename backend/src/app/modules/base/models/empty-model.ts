import { SchemaFactory } from "@nestjs/mongoose";

export class EmptyModel {
    // This class intentionally left empty
    // It can be used as a placeholder or for type checking
    // in various parts of the application where no specific model is needed.
}

export const EmptySchema = SchemaFactory.createForClass(EmptyModel);

export type EmptyDocument = EmptyModel & Document;
