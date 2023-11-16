/* eslint-disable @typescript-eslint/no-explicit-any */
import { BotCLient } from "../Client";
import { funcArg } from "../types/types";

export class BaseCallbackWatcher {
	client: BotCLient;
	callbacks: Map<string, funcArg[]>;
	constructor(client: BotCLient) {
		this.client = client;
		this.callbacks = new Map();
	}
	public regCallback(eventName: string, func: funcArg, once = false) {
		let callbacks = this.callbacks.get(eventName);
		if (callbacks === undefined) {
			this.callbacks.set(eventName, []);
			callbacks = this.callbacks.get(eventName);
		}
		callbacks!.push(func);
		if (once) this.client.once(eventName, func);
		else this.client.on(eventName, func);
		this.callbacks.set(eventName, callbacks!);
	}
	public removeCallback(eventName: string, func: funcArg) {
		let callbacks = this.callbacks.get(eventName);
		if (callbacks === undefined) return;
		callbacks = callbacks.filter(el => el != func);
		this.client.removeListener(eventName, func);
		this.callbacks.set(eventName, callbacks!);
	}
	public destroyCallbacs() {
		for (const handl of this.callbacks) {
			for (const func of handl[1]) {
				this.removeCallback(handl[0], func);
			}
		}
		this.callbacks = new Map();
	}
}