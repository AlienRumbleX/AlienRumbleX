import { Authenticator, Chain, UALError, User as UALUser } from "universal-authenticator-library";

export type User = { accountName: string; requestPermission: string } & Pick<UALUser, "signTransaction">;

export type UAL = {
	activeAuthenticator: Authenticator;
	activeUser: User;
	appName: string;
	authenticators: Authenticator[];
	chains: Chain[];
	error: UALError;
	hideModal: () => void;
	isAutoLogin: boolean;
	loading: boolean;
	logout: () => void;
	message: string;
	modal: boolean;
	restart: () => void;
	showModal: () => void;
	users: User[];
};

export type WindowProps = {
	visible: boolean;
	showPopup: (type: "success" | "error", message: string) => void;
	refreshData: () => void;
};

export type GameUser = {
	account: string;
	balance: {
		contract: string;
		quantity: string;
	};
	battle_count: number;
	win_count: number;
};

export type WeaponConf = {
	template_id: number;
	weapon_class: string;
	attack: number;
	defense: number;
};

export type CrewConf = {
	template_id: number;
	race: string;
	element: string;
	attack: number;
	defense: number;
};

export type AssetItem = {
	asset_id: string;
	collection_name: string;
	schema_name: string;
	template_id: number;
};

export type AssetTemplate = {
	name: string;
	img: string;
	template_id: number;
	rarity: string;
	shine: string;
};

export type Crew = AssetItem & AssetTemplate & CrewConf;
export type Weapon = AssetItem & AssetTemplate & WeaponConf;

export type Arena = {
	name: string;
	cost: {
		contract: string;
		quantity: string;
	};
	fee: number;
};

export type QueueEntry = {
	arena_name: string;
	minion_id: string;
	weapon_id: string;
};

export type UserQueueEntry = {
	player: string;
	queues: QueueEntry[];
};

export type Battle = {
	battle_id: number;
	arena_name: string;
	players: string[];
	winner: string;
};
