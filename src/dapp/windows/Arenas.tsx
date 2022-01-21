import React, { useContext, useState } from "react";
import { SignTransactionResponse } from "universal-authenticator-library";
import { AppCtx, BLOCKCHAIN } from "../constants";
import { Arena, Crew, Weapon, WindowProps } from "../types";

function ArenasWindow(props: WindowProps): JSX.Element {
	const { ual, crews, weapons, arenas, queue, gameBalance, userInfo } = useContext(AppCtx);
	const [selectedArena, setSelectedArena] = useState<Arena>(null);
	const [selectedMinion, setSelectedMinion] = useState<Crew>(null);
	const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(null);

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
													gameBalance < parseFloat(arena.cost.quantity) && "disabled",
													queue
														?.find(e => e.player == ual.activeUser.accountName)
														?.queues?.find(e => e.arena_name == arena.name) && "entered",
													selectedArena?.name == arena.name && "selected",
												]
													.filter(c => !!c)
													.join(" ")}
												title={[
													arena.name,
													gameBalance < parseFloat(arena.cost.quantity) && "Insufficient balance to enter",
													queue
														?.find(e => e.player == ual.activeUser.accountName)
														?.queues?.find(e => e.arena_name == arena.name) &&
														"You can't enter the same arena twice",
												]
													.filter(t => !!t)
													.join("\n")}
												key={arena.name}
												onClick={() =>
													gameBalance < parseFloat(arena.cost.quantity) ||
													queue
														?.find(e => e.player == ual.activeUser.accountName)
														?.queues?.find(e => e.arena_name == arena.name)
														? void 0
														: setSelectedArena(arena)
												}
											>
												<span className="name">{arena.name}</span>
												<span className="cost">{`${parseFloat(arena.cost.quantity).toLocaleString("en", {
													useGrouping: true,
													maximumFractionDigits: 4,
													minimumFractionDigits: 0,
												})} ${BLOCKCHAIN.TOKEN_SYMBOL}`}</span>
												<span className="fee">{(arena.fee / 100).toLocaleString("en", { style: "percent" })}</span>
												<span className="players">
													{`${
														queue?.flatMap(e => e.queues)?.filter(e => e.arena_name == arena.name)?.length || 0
													} warrior(s) waiting...`}
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
				{!(crews && weapons && queue && userInfo) && <span className="loading-indicator-m">loading...</span>}
			</div>
		</>
	);
}

export default ArenasWindow;
