import { config } from "../config/config";
import { getMongoClient } from "../db/mongo";
import { guildDb, nullGuildDb } from "../src/types/types";
const collectionGuilds = getMongoClient().db(config.dbName).collection("Guilds");
function createNullGuild(guildId: string): nullGuildDb {
	return {
		"guildId": guildId,
		"channelNewUsers": null,
		"enabledAdvCommand": false,
		"rolesNewUsers": null
	};
}
async function createGuildDb(guildId: string) {
	const guild = await collectionGuilds.findOne({
		"guildId": guildId
	});
	if (guild) return new GuildDB(guild as guildDb);
	return null;
}
export async function getGuildDb(guildId: string) {
	const guildDB = await createGuildDb(guildId);
	if (guildDB !== null) return guildDB;
	const nullGuild = createNullGuild(guildId);
	await collectionGuilds.updateOne({
		"guildId": nullGuild.guildId
	}, {
		"$set": nullGuild
	}, {
		"upsert": true
	});
	return createGuildDb(guildId);
}
class GuildDB {
	oldGuildInfo: guildDb;
	guildInfo: guildDb;
	constructor(guilddb: guildDb) {
		this.guildInfo = guilddb;
		this.oldGuildInfo = guilddb;
	}
	async save() {
		if (this.oldGuildInfo.guildId !== this.guildInfo.guildId) {
			return false;
		}
		const tmp = JSON.parse(JSON.stringify(this.guildInfo));
		delete tmp._id;
		await collectionGuilds.updateOne({
			"guildId": this.guildInfo.guildId
		}, {
			"$set": tmp
		});
		return true;
	}
}
