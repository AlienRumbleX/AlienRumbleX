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
	refetchBalances: () => void;
	refetchTools: () => void;
};

export type GameUser = {
	account: string;
	balance: string;
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

export type Crew = {};

export type Weapon = {};

export type Arena = {
	name: string;
	cost: string;
	fee: number;
};

export type Queue = {
	player: string;
	arena_name: string;
	minion_id: string;
	weapon_id: string;
};

export type Battle = {
	battle_id: number;
	arena_name: string;
	players: string[];
	winner: string;
};
