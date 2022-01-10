import React, { useContext, useEffect, useState } from "react";
import { SignTransactionResponse } from "universal-authenticator-library";
import { AppCtx, BLOCKCHAIN } from "../constants";
import { Arena, Crew, QueueEntry, Weapon, WindowProps } from "../types";

function ArenasWindow(props: WindowProps): JSX.Element {
	const { ual, crews, weapons, arenas, queue, gameBalance } = useContext(AppCtx);
	const [currentQueueEntry, setCurrentQueueEntry] = useState<QueueEntry>(null);
	const [selectedArena, setSelectedArena] = useState<Arena>(null);
	const [selectedMinion, setSelectedMinion] = useState<Crew>(null);
	const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(null);

	useEffect(() => setCurrentQueueEntry(queue?.find(entry => entry.player == ual.activeUser.accountName)), [queue]);

	const enterQueue = async () => {
		const res: SignTransactionResponse | Error = await ual.activeUser
			.signTransaction(
				{
					actions: [
						{
							account: BLOCKCHAIN.DAPP_CONTRACT,
							name: "enterqueue",
							authorization: [{ actor: ual.activeUser.accountName, permission: ual.activeUser.requestPermission }],
							data: {
								user: ual.activeUser.accountName,
								arena_name: selectedArena.name,
								minion_id: selectedMinion.asset_id,
								weapon_id: selectedWeapon.asset_id,
							},
						},
					],
				},
				{ broadcast: true, blocksBehind: 3, expireSeconds: 1800 },
			)
			.then(res => res)
			.catch(error => error);

		if (res instanceof Error) {
			props.showPopup("error", res.message);
		} else {
			props.showPopup("success", "Successfully entered the arena");
		}
	};

	return (
		<>
			<div className="window" style={{ display: props.visible ? "" : "none" }}>
				{crews && weapons && (
					<>
						{(crews.length == 0 || weapons.length == 0) && (
							<>
								<div className="message">
									{crews.length == 0 && <span className="warning">You have no minions</span>}
									{weapons.length == 0 && <span className="warning">You have no weapons</span>}
									<span className="help">You need them to be able to participate in battles</span>
									<span className="help">You can buy them from the secondary market</span>
								</div>
							</>
						)}

						{crews.length > 0 && weapons.length > 0 && (
							<>
								{currentQueueEntry && (
									<div className="message">
										<span className="help">You are already waiting for an arena to begin the battle</span>
									</div>
								)}
								{!currentQueueEntry && (
									<>
										<div className="message">
											<span className="help">Pick an Arena, a Warrior and a Weapon, and send them to battle</span>
										</div>
										<div className="arenas">
											<h3>Arenas</h3>
											<div className="arena-list">
												{arenas?.map(arena => (
													<div
														className={[
															"arena",
															gameBalance < parseFloat(arena.cost) && "disabled",
															selectedArena?.name == arena.name && "selected",
														]
															.filter(c => !!c)
															.join(" ")}
														key={arena.name}
														onClick={() =>
															gameBalance < parseFloat(arena.cost) ? void 0 : setSelectedArena(arena)
														}
													>
														<span className="name">{arena.name}</span>
														<span className="cost">{`${parseFloat(arena.cost).toLocaleString("en", {
															useGrouping: true,
															maximumFractionDigits: 4,
															minimumFractionDigits: 0,
														})} ${BLOCKCHAIN.TOKEN_SYMBOL}`}</span>
														<span className="fee">
															{(arena.fee / 100).toLocaleString("en", { style: "percent" })}
														</span>
													</div>
												))}
											</div>
										</div>
										<div className="crews">
											<h3>Crews</h3>
											<div className="crew-list">
												{crews?.map(minion => (
													<div
														className={["minion", selectedMinion?.asset_id == minion.asset_id && "selected"]
															.filter(c => !!c)
															.join(" ")}
														key={minion.asset_id}
														onClick={() => setSelectedMinion(minion)}
													>
														<img
															src={`https://ipfs.hivebp.io/thumbnail?hash=${minion.img}`}
															alt={minion.name}
															title={minion.name}
														/>
														<span className="name">{minion.name}</span>
													</div>
												))}
											</div>
										</div>
										<div className="weapons">
											<h3>Weapons</h3>
											<div className="weapon-list">
												{weapons?.map(weapon => (
													<div
														className={["weapon", selectedWeapon?.asset_id == weapon.asset_id && "selected"]
															.filter(c => !!c)
															.join(" ")}
														key={weapon.asset_id}
														onClick={() => setSelectedWeapon(weapon)}
													>
														<img
															src={`https://ipfs.hivebp.io/thumbnail?hash=${weapon.img}`}
															alt={weapon.name}
															title={weapon.name}
														/>
														<span className="name">{weapon.name}</span>
													</div>
												))}
											</div>
										</div>
										<div className="controls">
											<button
												className="button enter-battle"
												disabled={!(selectedArena && selectedMinion && selectedWeapon)}
												onClick={() => enterQueue()}
											>
												Enter Battle
											</button>
										</div>
									</>
								)}
							</>
						)}
					</>
				)}
				{!(crews && weapons) && <span className="loading-indicator-m">loading...</span>}
			</div>
		</>
	);
}

export default ArenasWindow;
