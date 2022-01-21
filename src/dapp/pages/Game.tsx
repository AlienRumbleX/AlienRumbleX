import { deserialize, ObjectSchema } from "atomicassets";
import _ from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { Link, useRouteMatch, withRouter } from "react-router-dom";
import { SignTransactionResponse } from "universal-authenticator-library";
import BottomBar from "../components/BottomBar";
import Logo from "../components/Logo";
import { AppCtx, BLOCKCHAIN, RARITIES, SHINES } from "../constants";
import { AssetItem, Crew, GameUser, Weapon } from "../types";
import ArenasWindow from "../windows/Arenas";
import HomeWindow from "../windows/Home";
import WalletWindow from "../windows/Wallet";

function Game(): JSX.Element {
	const {
		ual,
		accountBalance,
		gameBalance,
		userInfo,
		setAccountBalance,
		setGameBalance,
		setUserInfo,
		crewConfs,
		setCrewConfs,
		weaponConfs,
		setWeaponConfs,
		setCrews,
		setWeapons,
		setArenas,
		assetsTemplates,
		setAssetsTemplates,
		setQueue,
	} = useContext(AppCtx);

	const [isLoading, setLoading] = useState<boolean>(true);
	const [popupMessage, setPopupMessage] = useState<string>(null);
	const [popupType, setPopupType] = useState<"success" | "error">(null);
	const [crewAssets, setCrewAssets] = useState<AssetItem[]>(null);
	const [weaponAssets, setWeaponAssets] = useState<AssetItem[]>(null);

	const match = useRouteMatch(["/home", "/arenas", "/wallet"]);

	useEffect(() => refetchData(), []);
	useEffect(() => refreshCrews(), [crewAssets, assetsTemplates, crewConfs]);
	useEffect(() => refreshWeapons(), [weaponAssets, assetsTemplates, weaponConfs]);

	const refetchData = () => {
		refetchBalances(true);

		fetchUserCrewsWeapons();
		fetchAssetsTemplates();

		fetchCrewsConfigurations();
		fetchWeaponsConfigurations();
		fetchArenas();

		refreshCrews();
		refreshWeapons();
	};

	const refreshData = () => {
		refetchBalances();
		refreshQueue();
	};

	const refreshCrews = () => {
		const assets = crewAssets?.map<Crew>(minion => ({
			...minion,
			...assetsTemplates?.find(t => t.template_id == minion.template_id),
			...crewConfs?.find(t => t.template_id == minion.template_id),
		}));

		setCrews(
			_(assets)
				.orderBy([a => RARITIES[a.rarity], a => SHINES[a.shine], a => a.attack + a.defense], ["desc", "desc", "desc"])
				.value(),
		);
	};

	const refreshWeapons = () => {
		const assets = weaponAssets?.map<Weapon>(weapon => ({
			...weapon,
			...assetsTemplates?.find(t => t.template_id == weapon.template_id),
			...weaponConfs?.find(t => t.template_id == weapon.template_id),
		}));

		setWeapons(
			_(assets)
				.orderBy([a => RARITIES[a.rarity], a => SHINES[a.shine], a => a.attack + a.defense], ["desc", "desc", "desc"])
				.value(),
		);
	};

	const refetchBalances = (showLoading = false) => {
		checkUserInfo(showLoading);
		fetchAccountBalance();
	};

	const refreshQueue = async () => {
		const response = await fetch(`https://${BLOCKCHAIN.ENDPOINT}/v1/chain/get_table_rows`, {
			headers: { "content-type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				json: true,
				code: BLOCKCHAIN.DAPP_CONTRACT,
				scope: BLOCKCHAIN.DAPP_CONTRACT,
				table: "queues",
				limit: 1000,
			}),
			method: "POST",
			mode: "cors",
			credentials: "omit",
		});

		const data = await response.json();
		setQueue(data.rows);
	};

	const fetchAssetsTemplates = async (showLoading = false) => {
		if (showLoading) {
			setLoading(true);
		}

		const response = await fetch(`https://${BLOCKCHAIN.ENDPOINT}/v1/chain/get_table_rows`, {
			headers: { "content-type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				json: true,
				code: "atomicassets",
				scope: BLOCKCHAIN.AA_COLLECTION,
				table: "templates",
				limit: 1000,
			}),
			method: "POST",
			mode: "cors",
			credentials: "omit",
		});

		const data = await response.json();

		const crewSchema = ObjectSchema([
			{ name: "cardid", type: "uint16" },
			{ name: "name", type: "string" },
			{ name: "img", type: "image" },
			{ name: "backimg", type: "image" },
			{ name: "rarity", type: "string" },
			{ name: "shine", type: "string" },
			{ name: "material_grade", type: "uint64" },
			{ name: "race", type: "string" },
			{ name: "description", type: "string" },
			{ name: "element", type: "string" },
			{ name: "attack", type: "uint8" },
			{ name: "defense", type: "uint8" },
			{ name: "movecost", type: "uint8" },
			{ name: "td_fights", type: "uint16" },
			{ name: "td_wins", type: "uint16" },
			{ name: "td_winstreak", type: "uint16" },
		]);

		const weaponSchema = ObjectSchema([
			{ name: "cardid", type: "uint16" },
			{ name: "name", type: "string" },
			{ name: "img", type: "image" },
			{ name: "backimg", type: "image" },
			{ name: "rarity", type: "string" },
			{ name: "shine", type: "string" },
			{ name: "material_grade", type: "uint64" },
			{ name: "description", type: "string" },
			{ name: "class", type: "string" },
			{ name: "attack", type: "uint8" },
			{ name: "defense", type: "uint8" },
		]);

		setAssetsTemplates([
			...data.rows
				.filter(({ schema_name }) => schema_name == "crew.worlds")
				.map(({ template_id, immutable_serialized_data }) => ({
					template_id,
					...deserialize(new Uint8Array(immutable_serialized_data), crewSchema),
				})),
			...data.rows
				.filter(({ schema_name }) => schema_name == "arms.worlds")
				.map(({ template_id, immutable_serialized_data }) => ({
					template_id,
					...deserialize(new Uint8Array(immutable_serialized_data), weaponSchema),
				})),
		]);
		setLoading(false);
	};

	const fetchCrewsConfigurations = async (showLoading = false) => {
		if (showLoading) {
			setLoading(true);
		}

		const response = await fetch(`https://${BLOCKCHAIN.ENDPOINT}/v1/chain/get_table_rows`, {
			headers: { "content-type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				json: true,
				code: BLOCKCHAIN.DAPP_CONTRACT,
				scope: BLOCKCHAIN.DAPP_CONTRACT,
				table: "crewconf",
				limit: 1000,
			}),
			method: "POST",
			mode: "cors",
			credentials: "omit",
		});

		const data = await response.json();

		setCrewConfs(data.rows);
		setLoading(false);
	};

	const fetchWeaponsConfigurations = async (showLoading = false) => {
		if (showLoading) {
			setLoading(true);
		}
		const response = await fetch(`https://${BLOCKCHAIN.ENDPOINT}/v1/chain/get_table_rows`, {
			headers: { "content-type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				json: true,
				code: BLOCKCHAIN.DAPP_CONTRACT,
				scope: BLOCKCHAIN.DAPP_CONTRACT,
				table: "weaponconf",
				limit: 1000,
			}),
			method: "POST",
			mode: "cors",
			credentials: "omit",
		});

		const data = await response.json();

		setWeaponConfs(data.rows);
		setLoading(false);
	};

	const fetchArenas = async (showLoading = false) => {
		if (showLoading) {
			setLoading(true);
		}
		const response = await fetch(`https://${BLOCKCHAIN.ENDPOINT}/v1/chain/get_table_rows`, {
			headers: { "content-type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				json: true,
				code: BLOCKCHAIN.DAPP_CONTRACT,
				scope: BLOCKCHAIN.DAPP_CONTRACT,
				table: "arenas",
				limit: 1000,
			}),
			method: "POST",
			mode: "cors",
			credentials: "omit",
		});

		const data = await response.json();

		setArenas(data.rows);
		setLoading(false);
	};

	const fetchUserCrewsWeapons = async () => {
		const assets: AssetItem[] = await fetchUserAssets();
		const minions = assets.filter(a => a.collection_name == BLOCKCHAIN.AA_COLLECTION && a.schema_name == "crew.worlds");
		const weapons = assets.filter(a => a.collection_name == BLOCKCHAIN.AA_COLLECTION && a.schema_name == "arms.worlds");
		setCrewAssets(minions);
		setWeaponAssets(weapons);
	};

	const fetchUserAssets = async (lower?: string) => {
		const response = await fetch(`https://${BLOCKCHAIN.ENDPOINT}/v1/chain/get_table_rows`, {
			headers: { "content-type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				json: true,
				code: "atomicassets",
				scope: ual.activeUser.accountName,
				table: "assets",
				lower_bound: lower,
				limit: 1000,
			}),
			method: "POST",
			mode: "cors",
			credentials: "omit",
		});

		const data = await response.json();
		if (data.more) {
			return [...data.rows, ...(await fetchUserAssets(data.next_key))];
		}

		return data.rows;
	};

	const checkUserInfo = async (showLoading = false) => {
		if (showLoading) {
			setLoading(true);
		}
		const response = await fetch(`https://${BLOCKCHAIN.ENDPOINT}/v1/chain/get_table_rows`, {
			headers: { "content-type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				json: true,
				code: BLOCKCHAIN.DAPP_CONTRACT,
				scope: BLOCKCHAIN.DAPP_CONTRACT,
				table: "accounts",
				lower_bound: ual.activeUser.accountName,
				upper_bound: ual.activeUser.accountName,
				limit: 1,
			}),
			method: "POST",
			mode: "cors",
			credentials: "omit",
		});

		const data: { rows: GameUser[] } = await response.json();

		setUserInfo(data?.rows[0]);
		setGameBalance((data?.rows.length && parseFloat(data?.rows[0]?.balance?.quantity)) || 0);

		setLoading(false);
	};

	const fetchAccountBalance = async () => {
		const response = await fetch(`https://${BLOCKCHAIN.ENDPOINT}/v1/chain/get_currency_balance`, {
			headers: { "content-type": "application/json;charset=UTF-8" },
			body: JSON.stringify({ code: BLOCKCHAIN.TOKEN_CONTRACT, account: ual.activeUser.accountName, symbol: BLOCKCHAIN.TOKEN_SYMBOL }),
			method: "POST",
			mode: "cors",
			credentials: "omit",
		});

		const data = await response.json();
		setAccountBalance(parseFloat(data[0]) || 0);
	};

	const registerAccount = async () => {
		const res: SignTransactionResponse | Error = await ual.activeUser
			.signTransaction(
				{
					actions: [
						{
							account: BLOCKCHAIN.DAPP_CONTRACT,
							name: "regnewuser",
							authorization: [{ actor: ual.activeUser.accountName, permission: ual.activeUser.requestPermission }],
							data: { user: ual.activeUser.accountName },
						},
					],
				},
				{ broadcast: true, blocksBehind: 3, expireSeconds: 1800 },
			)
			.then(res => res)
			.catch(error => error);

		if (res instanceof Error) {
			showPopup("error", res.message);
		} else {
			showPopup("success", "Account registered successfully");
			refetchData();
		}
	};

	const showPopup = (type: "success" | "error", message: string) => {
		setPopupMessage(message);
		setPopupType(type);
		window.setTimeout(() => setPopupMessage(null), 5e3);
	};

	return (
		<>
			<div className="page">
				<div className="main game">
					{isLoading && <span className="loading-indicator">loading...</span>}
					{!isLoading && (
						<>
							{!userInfo && (
								<div className="register">
									<div className="register-inner">
										<h1>Register an account to start playing</h1>
										<div className="buttons">
											<button className="button register-btn" onClick={() => registerAccount()}>
												Register
											</button>
											<button className="button logout-btn" onClick={() => ual.logout()}>
												Logout
											</button>
										</div>
									</div>
								</div>
							)}
							{userInfo && (
								<>
									<div className="topbar">
										<Logo />
										<div className="right-side">
											<div className="balance">
												<span className="in-game">
													{isNaN(gameBalance)
														? "..."
														: `Game: ${gameBalance.toLocaleString("en", {
																useGrouping: true,
																maximumFractionDigits: 4,
																minimumFractionDigits: 0,
														  })} ${BLOCKCHAIN.TOKEN_SYMBOL}`}
												</span>
												<span className="in-account">
													{isNaN(accountBalance)
														? "..."
														: `Account: ${accountBalance.toLocaleString("en", {
																useGrouping: true,
																maximumFractionDigits: 4,
																minimumFractionDigits: 0,
														  })} ${BLOCKCHAIN.TOKEN_SYMBOL}`}
												</span>
											</div>
											<span className="account-name">{ual.activeUser.accountName}</span>
											<button className="button logout-button" onClick={() => ual.logout()}>
												Logout
											</button>
										</div>
									</div>

									<div className="window-ui">
										<div className="center-ui">
											<div className="center-ui-inner">
												<div className="controls">
													<div className="controls-inner">
														<Link className="button" to="/home">
															Home
														</Link>
														<Link className="button" to="/arenas">
															Arenas
														</Link>
														<Link className="button" to="/wallet">
															Wallet
														</Link>
													</div>
												</div>
												<div className="windows">
													<HomeWindow
														refreshData={refreshData}
														showPopup={showPopup}
														visible={match?.path == "/home"}
													/>
													<ArenasWindow
														refreshData={refreshData}
														showPopup={showPopup}
														visible={match?.path == "/arenas"}
													/>
													<WalletWindow
														refreshData={refreshData}
														showPopup={showPopup}
														visible={match?.path == "/wallet"}
													/>
												</div>
											</div>
										</div>
									</div>
								</>
							)}
						</>
					)}
				</div>

				<BottomBar />
			</div>
			{popupMessage && (
				<div className={["popup-message", popupType].join(" ")}>
					<span className="message">{popupMessage}</span>
				</div>
			)}
		</>
	);
}

export default withRouter(Game);
