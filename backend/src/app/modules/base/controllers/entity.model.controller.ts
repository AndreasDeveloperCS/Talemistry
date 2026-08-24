import { Type } from "@nestjs/common";

export interface IEntityModelController<T> {
    getEntity(): Promise<Type<T>>;
}