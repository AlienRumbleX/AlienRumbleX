import { Wax } from "@eosdacio/ual-wax";
import React from "react";
import { Anchor } from "ual-anchor";
import { Arena, AssetTemplate, Crew, CrewConf, GameUser, UAL, UserQueueEntry, Weapon, WeaponConf } from "./types";

export const RARITIES = {
	Abundant: 1,
	Common: 2,
	Rare: 3,
	Epic: 4,
	Legendary: 5,
	Mythical: 6,
};

export const SHINES = {
	Stone: 1,
	Gold: 2,
	Stardust: 3,
	Antimatter: 4,
	XDimension: 5,
};

export interface AppContextInterface {
	ual: UAL;

	accountBalance: number;
	setAccountBalance: (balance: number) => void;

	gameBalance: number;
	setGameBalance: (balance: number) => void;

	userInfo: GameUser | false;
	setUserInfo: (info: GameUser | false) => void;

	crewConfs: CrewConf[];
	setCrewConfs: (crews: CrewConf[]) => void;

	weaponConfs: WeaponConf[];
	setWeaponConfs: (weapons: WeaponConf[]) => void;

	crews: Crew[];
	setCrews: (crews: Crew[]) => void;

	weapons: Weapon[];
	setWeapons: (weapons: Weapon[]) => void;

	assetsTemplates: AssetTemplate[];
	setAssetsTemplates: (templates: AssetTemplate[]) => void;

	arenas: Arena[];
	setArenas: (arenas: Arena[]) => void;

	queue: UserQueueEntry[];
	setQueue: (battles: UserQueueEntry[]) => void;
}

export const AppCtx = React.createContext<AppContextInterface | null>(null);

const MAINNET = {
	CHAIN: "1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4",
	ENDPOINT: "wax.eosphere.io",
	DAPP_CONTRACT: "alienrumblex",
	AA_COLLECTION: "alien.worlds",
	TOKEN_CONTRACT: "alien.worlds",
	TOKEN_SYMBOL: "TLM",
	AUTHENTICATORS: [],
};
const TESTNET = {
	CHAIN: "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12",
	ENDPOINT: "wax-testnet.eosphere.io",
	DAPP_CONTRACT: "alienrumblex", // doesn't exist
	AA_COLLECTION: "alien.worlds", // doesn't exist
	TOKEN_CONTRACT: "alien.worlds", // doesn't exist
	TOKEN_SYMBOL: "TLM", // doesn't exist
	AUTHENTICATORS: [],
};

export const WAX_CHAIN = { chainId: MAINNET.CHAIN, rpcEndpoints: [{ protocol: "https", host: MAINNET.ENDPOINT, port: 443 }] };
export const DAPP_NAME = "alienrumblex";

MAINNET.AUTHENTICATORS = [new Anchor([WAX_CHAIN], { appName: DAPP_NAME }), new Wax([WAX_CHAIN], {})];
TESTNET.AUTHENTICATORS = [new Anchor([WAX_CHAIN], { appName: DAPP_NAME })];

export const BLOCKCHAIN = { ...MAINNET };
