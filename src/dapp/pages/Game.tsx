import axios from "axios";
import _ from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { Link, useRouteMatch, withRouter } from "react-router-dom";
import { SignTransactionResponse } from "universal-authenticator-library";
import BottomBar from "../components/BottomBar";
import Logo from "../components/Logo";
import { AppCtx, BLOCKCHAIN, ENDPOINTS, RARITIES, SHINES } from "../constants";
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
	const [selectedAPIEndpoint, setSelectedAPIEndpoint] = useState<string>(null);
	const [selectedAtomicEndpoint, setSelectedAtomicEndpoint] = useState<string>(null);
	const [refetchSpinning, setRefetchSpinning] = useState<boolean>(false);
	const [isTesting, setTesting] = useState<boolean>(true);
	const [atomicEndpoints, setAtomicEndpoints] = useState<string[]>(null);
	const [apiEndpoints, setAPIEndpoints] = useState<string[]>(null);

	let lastAutoRefetch = 0;

	const match = useRouteMatch(["/home", "/arenas", "/wallet"]);

	useEffect(() => startTestingEndpoints(), []);
	useEffect(() => refreshCrews(), [crewAssets, assetsTemplates, crewConfs]);
	useEffect(() => refreshWeapons(), [weaponAssets, assetsTemplates, weaponConfs]);
	useEffect(() => setLoading(!((userInfo || userInfo === false) && crews && weapons)), [userInfo, crews, weapons]);
	useEffect(() => document.addEventListener("visibilitychange", () => handleVisibilityChange(), false), []);

	const handleVisibilityChange = () => {
		if (!document.hidden) {
			if (Date.now() - lastAutoRefetch > 5 * 60 * 1e3) {
				lastAutoRefetch = Date.now();
				refetchData();
			}
		}
	};

	const setAPIEndpoint = (endpoint: string) => {
		BLOCKCHAIN.API_ENDPOINT = endpoint;
		setSelectedAPIEndpoint(endpoint);
		refetchData();
	};

	const setAtomicEndpoint = (endpoint: string) => {
		BLOCKCHAIN.ATOMIC_ENDPOINT = endpoint;
		setSelectedAtomicEndpoint(endpoint);
		refetchData();
	};

	const startTestingEndpoints = () => {
		testAPIEndpoints();
	};

	const testAPIEndpoints = async () => {
		setTesting(true);
		const [atomicEndpoints, apiEndpoints] = await Promise.all([
			Promise.all(
				ENDPOINTS.ATOMIC.map<Promise<string>>(async endpoint =>
					axios
						.get(`https://${endpoint}/atomicassets/v1/collections/alien.worlds`, {
							responseType: "json",
							headers: { "Content-Type": "application/json;charset=UTF-8" },
							timeout: 10e3,
						})
						.then(() => endpoint)
						.catch(() => null),
				),
			),
			Promise.all(
				ENDPOINTS.API.map<Promise<string>>(async endpoint =>
					axios
						.post(
							`https://${endpoint}/v1/chain/get_info`,
							{},
							{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" }, timeout: 10e3 },
						)
						.then(() => endpoint)
						.catch(() => null),
				),
			),
		]);

		setAtomicEndpoints(atomicEndpoints.filter(e => !!e).sort());
		setAPIEndpoints(apiEndpoints.filter(e => !!e).sort());
		setTesting(false);
	};

	const chooseRandomEndpoints = async () => {
		setAtomicEndpoint(_.sample(atomicEndpoints));
		setAPIEndpoint(_.sample(apiEndpoints));
	};

	const refetchData = async (userInput = false) => {
		if (userInput) {
			setRefetchSpinning(true);
		}

		refetchBalances();

		await fetchUserCrewsWeapons(userInput);

		await Promise.all([
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

		await Promise.all([fetchCrewsConfigurations(), await fetchWeaponsConfigurations()]);
		await fetchArenas();

		refreshCrews();
		refreshWeapons();
		setRefetchSpinning(false);
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

	const refetchBalances = () => {
		checkUserInfo();
		fetchAccountBalance();
	};

	const refreshQueue = async () => {
		const response = await axios.post(
			`https://${BLOCKCHAIN.API_ENDPOINT}/v1/chain/get_table_rows`,
			{ json: true, code: BLOCKCHAIN.DAPP_CONTRACT, scope: BLOCKCHAIN.DAPP_CONTRACT, table: "queues", limit: 1000 },
			{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" } },
		);

		setQueue(response.data.rows);
	};

	const fetchAssetsTemplates = async (schema: string): Promise<AssetTemplate[]> => {
		const cache = getStorageItem<AssetTemplate[]>(`${schema}.templates`, null);
		if (cache) {
			return cache;
		}

		const response = await axios.get(
			`https://${BLOCKCHAIN.ATOMIC_ENDPOINT}/atomicassets/v1/templates?collection_name=alien.worlds&schema_name=${schema}&page=1&limit=200&order=desc&sort=created`,
			{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" } },
		);

		const templates = [...response.data.data].map<AssetTemplate>(t => ({
			img: t.immutable_data.img,
			name: t.immutable_data.name,
			rarity: t.immutable_data.rarity,
			shine: t.immutable_data.shine,
			template_id: t.template_id,
		}));

		setStorageItem<AssetTemplate[]>(`${schema}.templates`, templates, 0);
		return templates;
	};

	const fetchCrewsConfigurations = async () => {
		const cache = getStorageItem<CrewConf[]>("crewconf", null);
		if (cache) {
			setCrewConfs(cache);
			return;
		}

		const response = await axios.post(
			`https://${BLOCKCHAIN.API_ENDPOINT}/v1/chain/get_table_rows`,
			{ json: true, code: BLOCKCHAIN.DAPP_CONTRACT, scope: BLOCKCHAIN.DAPP_CONTRACT, table: "crewconf", limit: 1000 },
			{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" } },
		);

		setStorageItem<CrewConf[]>("crewconf", response.data.rows, 0);
		setCrewConfs(response.data.rows);
	};

	const fetchWeaponsConfigurations = async () => {
		const cache = getStorageItem<WeaponConf[]>("weaponconf", null);
		if (cache) {
			setWeaponConfs(cache);
			return;
		}

		const response = await axios.post(
			`https://${BLOCKCHAIN.API_ENDPOINT}/v1/chain/get_table_rows`,
			{ json: true, code: BLOCKCHAIN.DAPP_CONTRACT, scope: BLOCKCHAIN.DAPP_CONTRACT, table: "weaponconf", limit: 1000 },
			{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" } },
		);

		setStorageItem<WeaponConf[]>("weaponconf", response.data.rows, 0);
		setWeaponConfs(response.data.rows);
	};

	const fetchArenas = async () => {
		const response = await axios.post(
			`https://${BLOCKCHAIN.API_ENDPOINT}/v1/chain/get_table_rows`,
			{ json: true, code: BLOCKCHAIN.DAPP_CONTRACT, scope: BLOCKCHAIN.DAPP_CONTRACT, table: "arenas", limit: 1000 },
			{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" } },
		);

		setArenas(response.data.rows);
	};

	const fetchUserCrewsWeapons = async (forceRefetch = false) => {
		const minionAssets: AssetItem[] = await fetchUserAssets("crew.worlds", forceRefetch);
		const weaponAssets: AssetItem[] = await fetchUserAssets("arms.worlds", forceRefetch);
		const minions = minionAssets.filter(a => a.collection_name == BLOCKCHAIN.AA_COLLECTION && a.schema_name == "crew.worlds");
		const weapons = weaponAssets.filter(a => a.collection_name == BLOCKCHAIN.AA_COLLECTION && a.schema_name == "arms.worlds");
		setCrewAssets(minions);
		setWeaponAssets(weapons);
	};

	const fetchUserAssets = async (schema: string, forceRefetch = false): Promise<AssetItem[]> => {
		if (!forceRefetch) {
			const cache = getStorageItem<AssetItem[]>(`${ual.activeUser.accountName}.${schema}.assets`, null);
			if (cache) {
				return cache;
			}
		}

		const response = await axios.get(
			`https://${BLOCKCHAIN.ATOMIC_ENDPOINT}/atomicassets/v1/assets?collection_name=alien.worlds&schema_name=${schema}&owner=${ual.activeUser.accountName}&page=1&limit=500`,
			{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" } },
		);

		const assets = [...response.data.data].map<AssetItem>(a => ({
			asset_id: a.asset_id,
			collection_name: a.collection.collection_name,
			schema_name: a.schema.schema_name,
			template_id: a.template.template_id,
		}));

		setStorageItem<AssetItem[]>(`${ual.activeUser.accountName}.${schema}.assets`, assets, 300);
		return assets;
	};

	const checkUserInfo = async () => {
		const response = await axios.post(
			`https://${BLOCKCHAIN.API_ENDPOINT}/v1/chain/get_table_rows`,
			{
				json: true,
				code: BLOCKCHAIN.DAPP_CONTRACT,
				scope: BLOCKCHAIN.DAPP_CONTRACT,
				table: "accounts",
				lower_bound: ual.activeUser.accountName,
				upper_bound: ual.activeUser.accountName,
				limit: 1,
			},
			{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" } },
		);

		const data: { rows: GameUser[] } = response.data;

		setUserInfo(data?.rows[0] || false);
		setGameBalance((data?.rows.length && parseFloat(data?.rows[0]?.balance?.quantity)) || 0);
	};

	const fetchAccountBalance = async () => {
		const response = await axios.post(
			`https://${BLOCKCHAIN.API_ENDPOINT}/v1/chain/get_currency_balance`,
			{ code: BLOCKCHAIN.TOKEN_CONTRACT, account: ual.activeUser.accountName, symbol: BLOCKCHAIN.TOKEN_SYMBOL },
			{ responseType: "json", headers: { "Content-Type": "application/json;charset=UTF-8" } },
		);

		setAccountBalance(parseFloat(response.data[0]) || 0);
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
					{isTesting && (
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
								<span className="rpc-message">Testing API endpoints to find the best one</span>
								<span className="rpc-message">Please wait...</span>
							</div>
						</>
					)}
					{!isTesting && !(selectedAPIEndpoint && selectedAtomicEndpoint) && (
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

							{!(apiEndpoints.length && atomicEndpoints.length) && (
								<div className="endpoint-select">
									<span className="rpc-message">No working endpoints found :(</span>
									<span className="rpc-message">Check your internet connection and refresh to try again</span>
								</div>
							)}

							{apiEndpoints.length * atomicEndpoints.length > 0 && (
								<div className="endpoint-select">
									<span className="rpc-message">Please choose a WAX endpoint to connect to</span>
									<select defaultValue="none" onChange={e => setAPIEndpoint(e.target.value)}>
										<option disabled value="none">
											Select API Endpoint
										</option>

										{apiEndpoints.map(endpoint => (
											<option value={endpoint} key={endpoint}>
												{endpoint}
											</option>
										))}
									</select>
									<select defaultValue="none" onChange={e => setAtomicEndpoint(e.target.value)}>
										<option disabled value="none">
											Select Atomic Endpoint
										</option>

										{atomicEndpoints.map(endpoint => (
											<option value={endpoint} key={endpoint}>
												{endpoint}
											</option>
										))}
									</select>

									<button className="button random-endpoint-button" onClick={() => chooseRandomEndpoints()}>
										Choose for me
									</button>
								</div>
							)}
						</>
					)}
					{selectedAPIEndpoint && selectedAtomicEndpoint && (
						<>
							{isLoading && <span className="loading-indicator">loading...</span>}
							{!isLoading && (
								<>
									{userInfo === false && (
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

															<button
																className={`refetch ${refetchSpinning ? "spin" : ""}`}
																onClick={() => refetchData(true)}
															>
																&#10227;
															</button>
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
