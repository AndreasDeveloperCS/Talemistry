import { FUNCTIONALBLOCK } from "../../permissions/models/functional-block-enum";

export class MenuItem {
    //selectedIndex?:number;
    index?: number;
    name: string = "";
    label: string = "";
    route: string = "";
    icon?: string = "";
    functionalBlock!: FUNCTIONALBLOCK;
    private _isAvailable?: boolean = false;

    public get isAvailable(): boolean {
        return this._isAvailable ?? false;
    }
    public set isAvailable(value: boolean) {
        this._isAvailable = value;
    }
}