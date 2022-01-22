import _ from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { Link, useRouteMatch, withRouter } from "react-router-dom";
import { SignTransactionResponse } from "universal-authenticator-library";
import BottomBar from "../components/BottomBar";
import Logo from "../components/Logo";
import { AppCtx, BLOCKCHAIN, RARITIES, SHINES } from "../constants";
import { AssetItem, AssetTemplate, Crew, CrewConf, GameUser, Weapon, WeaponConf } from "../types";
import { getStorageItem, setStorageItem } from "../utils";
import ArenasWindow from "../windows/Arenas";
import HomeWindow from "../windows/Home";
import WalletWindow from "../windows/Wallet";

function Game(): JSX.Element {
	const {
		ual,
		accountBalance,
		gameBalance,
		userInfo,
		crews,
		weapons,
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

	const [isLoading, setLoading] = useState<boolean>(false);
	const [popupMessage, setPopupMessage] = useState<string>(null);
	const [popupType, setPopupType] = useState<"success" | "error">(null);
	const [crewAssets, setCrewAssets] = useState<AssetItem[]>(null);
	const [weaponAssets, setWeaponAssets] = useState<AssetItem[]>(null);
	const [selectedEndpoint, setSelectedEndpoint] = useState<string>(null);

	const match = useRouteMatch(["/home", "/arenas", "/wallet"]);

	useEffect(() => refreshCrews(), [crewAssets, assetsTemplates, crewConfs]);
	useEffect(() => refreshWeapons(), [weaponAssets, assetsTemplates, weaponConfs]);
	useEffect(() => setLoading(!(crews && weapons)), [userInfo, crews, weapons]);

	const setEndpoint = (endpoint: string) => {
		BLOCKCHAIN.ENDPOINT = endpoint;
		setSelectedEndpoint(endpoint);
		refetchData();
	};

	const refetchData = () => {
		refetchBalances(true);

		fetchUserCrewsWeapons();

		Promise.all([
			fetchAssetsTemplates("crew.worlds").then(minions => {
				setStorageItem<AssetTemplate[]>("crew.worlds.templates", minions, 0);
				return minions;
			}),
			fetchAssetsTemplates("arms.worlds").then(weapons => {
				setStorageItem<AssetTemplate[]>("arms.worlds.templates", weapons, 0);
				return weapons;
			}),
		]).then(([minions, weapons]) => {
			const templates = [...minions, ...weapons];
			setAssetsTemplates(templates);
		});

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
		if (!(crewAssets && assetsTemplates && crewConfs)) {
			return;
		}

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
		if (!(weaponAssets && assetsTemplates && weaponConfs)) {
			return;
		}

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

	const fetchAssetsTemplates = async (schema: string): Promise<AssetTemplate[]> => {
		const cache = getStorageItem<AssetTemplate[]>(`${schema}.templates`, null);
		if (cache) {
			return cache;
		}

		const response = await fetch(
			`https://wax.api.atomicassets.io/atomicassets/v1/templates?collection_name=alien.worlds&schema_name=${schema}&page=1&limit=200&order=desc&sort=created`,
			{
				headers: { "content-type": "application/json;charset=UTF-8" },
				body: null,
				method: "GET",
				mode: "cors",
				credentials: "omit",
			},
		);

		const data = await response.json();

		const templates = [...data.data].map<AssetTemplate>(t => ({
			img: t.immutable_data.img,
			name: t.immutable_data.name,
			rarity: t.immutable_data.rarity,
			shine: t.immutable_data.shine,
			template_id: t.template_id,
		}));

		setStorageItem<AssetTemplate[]>(`${schema}.templates`, data.rows, 0);
		return templates;
	};

	const fetchCrewsConfigurations = async (showLoading = false) => {
		if (showLoading) {
			setLoading(true);
		}

		const cache = getStorageItem<CrewConf[]>("crewconf", null);
		if (cache) {
			setCrewConfs(cache);
			return;
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
		setStorageItem<CrewConf[]>("crewconf", data.rows, 0);
		setCrewConfs(data.rows);
	};

	const fetchWeaponsConfigurations = async (showLoading = false) => {
		if (showLoading) {
			setLoading(true);
		}

		const cache = getStorageItem<WeaponConf[]>("weaponconf", null);
		if (cache) {
			setWeaponConfs(cache);
			return;
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
		setStorageItem<WeaponConf[]>("weaponconf", data.rows, 0);
		setWeaponConfs(data.rows);
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
	};

	const fetchUserCrewsWeapons = async () => {
		const minionAssets: AssetItem[] = await fetchUserAssets("crew.worlds");
		const weaponAssets: AssetItem[] = await fetchUserAssets("arms.worlds");
		const minions = minionAssets.filter(a => a.collection_name == BLOCKCHAIN.AA_COLLECTION && a.schema_name == "crew.worlds");
		const weapons = weaponAssets.filter(a => a.collection_name == BLOCKCHAIN.AA_COLLECTION && a.schema_name == "arms.worlds");
		setCrewAssets(minions);
		setWeaponAssets(weapons);
	};

	const fetchUserAssets = async (schema: string): Promise<AssetItem[]> => {
		const cache = getStorageItem<AssetItem[]>(`${ual.activeUser.accountName}.${schema}.assets`, null);
		if (cache) {
			return cache;
		}

		const response = await fetch(
			`https://wax.api.atomicassets.io/atomicassets/v1/assets?collection_name=alien.worlds&schema_name=${schema}&owner=${ual.activeUser.accountName}&page=1&limit=500`,
			{
				headers: { "content-type": "application/json;charset=UTF-8" },
				body: null,
				method: "GET",
				mode: "cors",
				credentials: "omit",
			},
		);

		const data = await response.json();
		const assets = [...data.data].map<AssetItem>(a => ({
			asset_id: a.asset_id,
			collection_name: a.collection.collection_name,
			schema_name: a.schema.schema_name,
			template_id: a.template.template_id,
		}));

		setStorageItem<AssetItem[]>(`${ual.activeUser.accountName}.${schema}.assets`, assets, 0);
		return assets;
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
					{!selectedEndpoint && (
						<>
							<div className="topbar">
								<Logo />
								<div className="right-side">
									<span className="account-name">{ual.activeUser.accountName}</span>
									<button className="button logout-button" onClick={() => ual.logout()}>
										Logout
									</button>
								</div>
							</div>

							<div className="endpoint-select">
								<span className="rpc-message">Please choose a WAX endpoint to connect to</span>
								<select defaultValue="none" onChange={e => setEndpoint(e.target.value)}>
									<option disabled value="none">
										Select RPC Endpoint
									</option>

									<option value="api.wax.alohaeos.com">api.wax.alohaeos.com</option>
									<option value="api.wax.greeneosio.com">api.wax.greeneosio.com</option>
									<option value="api.waxsweden.org">api.waxsweden.org</option>
									<option value="wax.cryptolions.io">wax.cryptolions.io</option>
									<option value="wax.dapplica.io">wax.dapplica.io</option>
									<option value="wax.eosphere.io">wax.eosphere.io</option>
									<option value="wax.pink.gg">wax.pink.gg</option>
								</select>
							</div>
						</>
					)}
					{selectedEndpoint && (
						<>
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
			<div
				className={`scrolltop ${document.documentElement.scrollTop > 0 ? "visible" : "invisible"}`}
				onClick={() => document.documentElement.scrollTo({ top: 0, behavior: "smooth" })}
			>
				&#94;
			</div>
		</>
	);
}

export default withRouter(Game);
