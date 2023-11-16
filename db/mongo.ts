import { MongoClient } from "mongodb";
import { config } from "../config/config";

const mongoClient = new MongoClient(config.mongoUrl);
const connected = false;

export function getMongoClient() {
	return mongoClient;
}

export async function connectMongo() {
	try {
		if (connected) {
			return true;
		}
		await mongoClient.connect();
		console.log("MongoDb Connected");
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}

}
