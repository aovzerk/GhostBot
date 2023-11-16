import { BotCLient } from "../Client";
import { BaseCallbackWatcher } from "./BaseCallbackWatcher";

export class BaseModule extends BaseCallbackWatcher {
	moduleName: string;
	constructor(client: BotCLient, moduleName?: string) {
		super(client);
		this.moduleName = moduleName ? moduleName : "Default Module name";
	}
	public async init(): Promise<boolean> {
		return true;
	}
	public async load(): Promise<boolean> {
		this.init();
		console.log(`Module ${this.moduleName} loaded`);
		return true;
	}
}