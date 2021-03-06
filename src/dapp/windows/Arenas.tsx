import React, { useContext, useRef, useState } from "react";
import { SignTransactionResponse } from "universal-authenticator-library";
import { AppCtx, BLOCKCHAIN } from "../constants";
import { Arena, Crew, Weapon, WindowProps } from "../types";

function ArenasWindow(props: WindowProps): JSX.Element {
	const { ual, crews, weapons, arenas, queue, gameBalance, userInfo } = useContext(AppCtx);
	const arenasRef = useRef<HTMLDivElement>(null);
	const minionsRef = useRef<HTMLDivElement>(null);
	const weaponsRef = useRef<HTMLDivElement>(null);
	const [selectedArena, setSelectedArena] = useState<Arena>(null);
	const [selectedMinion, setSelectedMinion] = useState<Crew>(null);
	const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(null);
	const [selectedWeaponRarity, setSelectedWeaponRarity] = useState<string>("All");
	const [selectedWeaponShine, setSelectedWeaponShine] = useState<string>("All");
	const [selectedWeaponClass, setSelectedWeaponClass] = useState<string>("All");
	const [selectedMinionRarity, setSelectedMinionRarity] = useState<string>("All");
	const [selectedMinionShine, setSelectedMinionShine] = useState<string>("All");
	const [selectedMinionElement, setSelectedMinionElement] = useState<string>("All");
	const [selectedAreaEntry, setSelectedArenaEntry] = useState<string>("All");

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
			setSelectedArena(null);
			setSelectedMinion(null);
			setSelectedWeapon(null);
			props.refreshData();
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
									<span className="help">
										<span>Pick an</span>
										<span
											style={{ cursor: "pointer", marginLeft: "0.2em", color: "var(--color-eight)" }}
											onClick={() => arenasRef.current.scrollIntoView({ behavior: "smooth" })}
										>
											Arena
										</span>
										<span>, a</span>
										<span
											style={{
												cursor: "pointer",
												marginLeft: "0.2em",
												marginRight: "0.2em",
												color: "var(--color-eight)",
											}}
											onClick={() => minionsRef.current.scrollIntoView({ behavior: "smooth" })}
										>
											Minion
										</span>
										<span>and a</span>
										<span
											style={{ cursor: "pointer", marginLeft: "0.2em", color: "var(--color-eight)" }}
											onClick={() => weaponsRef.current.scrollIntoView({ behavior: "smooth" })}
										>
											Weapon
										</span>
										<span>, and send them to battle</span>
									</span>
								</div>
								{(selectedMinion || selectedWeapon) && (
									<div className="selection">
										<div className="section-head">
											<span className="title">Selected and ready for battle</span>
										</div>
										<div className="weapon-list crew-list">
											{selectedMinion && (
												<div className="minion">
													<img
														src={`https://ipfs.hivebp.io/thumbnail?hash=${selectedMinion.img}`}
														alt={selectedMinion.name}
														title={selectedMinion.name}
													/>
													<span className="name">{selectedMinion.name}</span>
												</div>
											)}
											{selectedWeapon && (
												<div className="weapon">
													<img
														src={`https://ipfs.hivebp.io/thumbnail?hash=${selectedWeapon.img}`}
														alt={selectedWeapon.name}
														title={selectedWeapon.name}
													/>
													<span className="name">{selectedWeapon.name}</span>
												</div>
											)}
										</div>
									</div>
								)}
								<div className="controls">
									<button
										className="button enter-battle"
										disabled={!(selectedArena && selectedMinion && selectedWeapon)}
										onClick={() => enterQueue()}
									>
										Enter Battle
									</button>
								</div>
								<div className="arenas" ref={arenasRef}>
									<div className="section-head">
										<span className="title">Arenas</span>

										<div className="filters">
											<div className="filter">
												<span className="name">Entered</span>
												<select
													className="choices"
													onChange={e => setSelectedArenaEntry(e.target.value)}
													defaultValue={selectedAreaEntry}
												>
													{["All", "Yes", "No"].map(r => (
														<option value={r} key={`arena-entered-${r}`}>
															{r}
														</option>
													))}
												</select>
											</div>
										</div>
									</div>
									<div className="arena-list">
										{arenas
											?.sort((a, b) => parseFloat(a.cost.quantity) - parseFloat(b.cost.quantity))
											?.filter(
												arena =>
													selectedAreaEntry == "All" ||
													!!queue
														?.find(e => e.player == ual.activeUser.accountName)
														?.queues?.find(e => e.arena_name == arena.name) ==
														(selectedAreaEntry == "Yes"),
											)
											?.map(arena => (
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
								<div className="crews" ref={minionsRef}>
									<div className="section-head">
										<span className="title">Minions</span>

										<div className="filters">
											<div className="filter">
												<span className="name">Rarity</span>
												<select
													className="choices"
													onChange={e => setSelectedMinionRarity(e.target.value)}
													defaultValue={selectedMinionRarity}
												>
													{["All", "Abundant", "Common", "Rare", "Epic", "Legendary", "Mythical"].map(r => (
														<option value={r} key={`minion-rarity-${r}`}>
															{r}
														</option>
													))}
												</select>
											</div>
											<div className="filter">
												<span className="name">Shine</span>
												<select
													className="choices"
													onChange={e => setSelectedMinionShine(e.target.value)}
													defaultValue={selectedMinionShine}
												>
													{["All", "Stone", "Gold", "Stardust", "Antimatter", "XDimension"].map(s => (
														<option value={s} key={`minion-shine-${s}`}>
															{s}
														</option>
													))}
												</select>
											</div>
											<div className="filter">
												<span className="name">Element</span>
												<select
													className="choices"
													onChange={e => setSelectedMinionElement(e.target.value)}
													defaultValue={selectedMinionElement}
												>
													{["All", "Neutral", "Air", "Fire", "Gem", "Metal", "Nature"].map(s => (
														<option value={s} key={`minion-element-${s}`}>
															{s}
														</option>
													))}
												</select>
											</div>
										</div>
									</div>
									<div className="crew-list">
										{crews
											?.filter(
												minion =>
													(selectedMinionRarity == "All" || minion.rarity == selectedMinionRarity) &&
													(selectedMinionShine == "All" || minion.shine == selectedMinionShine) &&
													(selectedMinionElement == "All" || minion.element == selectedMinionElement),
											)
											?.map(minion => (
												<div
													className={[
														"minion",
														queue
															?.find(e => e.player == ual.activeUser.accountName)
															?.queues?.find(e => e.minion_id == minion.asset_id) && "used",
														selectedMinion?.asset_id == minion.asset_id && "selected",
													]
														.filter(c => !!c)
														.join(" ")}
													key={minion.asset_id}
													onClick={() =>
														queue
															?.find(e => e.player == ual.activeUser.accountName)
															?.queues?.find(e => e.minion_id == minion.asset_id)
															? void 0
															: setSelectedMinion(minion)
													}
													title={[
														minion.name,
														queue
															?.find(e => e.player == ual.activeUser.accountName)
															?.queues?.find(e => e.minion_id == minion.asset_id) &&
															"This minion is used in another arena",
													]
														.filter(t => !!t)
														.join("\n")}
												>
													<img src={`https://ipfs.hivebp.io/thumbnail?hash=${minion.img}`} alt={minion.name} />
													<span className="name">{minion.name}</span>
												</div>
											))}
									</div>
								</div>
								<div className="weapons" ref={weaponsRef}>
									<div className="section-head">
										<span className="title">Weapons</span>

										<div className="filters">
											<div className="filter">
												<span className="name">Rarity</span>
												<select
													className="choices"
													onChange={e => setSelectedWeaponRarity(e.target.value)}
													defaultValue={selectedWeaponRarity}
												>
													{["All", "Abundant", "Common", "Rare", "Epic", "Legendary", "Mythical"].map(r => (
														<option value={r} key={`weapon-rarity-${r}`}>
															{r}
														</option>
													))}
												</select>
											</div>
											<div className="filter">
												<span className="name">Shine</span>
												<select
													className="choices"
													onChange={e => setSelectedWeaponShine(e.target.value)}
													defaultValue={selectedWeaponShine}
												>
													{["All", "Stone", "Gold", "Stardust", "Antimatter", "XDimension"].map(s => (
														<option value={s} key={`weapon-shine-${s}`}>
															{s}
														</option>
													))}
												</select>
											</div>
											<div className="filter">
												<span className="name">Class</span>
												<select
													className="choices"
													onChange={e => setSelectedWeaponClass(e.target.value)}
													defaultValue={selectedWeaponClass}
												>
													{["All", "Neutral", "Air", "Fire", "Gem", "Metal", "Nature"].map(s => (
														<option value={s} key={`weapon-class-${s}`}>
															{s}
														</option>
													))}
												</select>
											</div>
										</div>
									</div>
									<div className="weapon-list">
										{weapons
											?.filter(
												weapon =>
													(selectedWeaponRarity == "All" || weapon.rarity == selectedWeaponRarity) &&
													(selectedWeaponShine == "All" || weapon.shine == selectedWeaponShine) &&
													(selectedWeaponClass == "All" || weapon.weapon_class == selectedWeaponClass),
											)
											?.map(weapon => (
												<div
													className={[
														"weapon",
														queue
															?.find(e => e.player == ual.activeUser.accountName)
															?.queues?.find(e => e.weapon_id == weapon.asset_id) && "used",
														selectedWeapon?.asset_id == weapon.asset_id && "selected",
													]
														.filter(c => !!c)
														.join(" ")}
													key={weapon.asset_id}
													onClick={() =>
														queue
															?.find(e => e.player == ual.activeUser.accountName)
															?.queues?.find(e => e.weapon_id == weapon.asset_id)
															? void 0
															: setSelectedWeapon(weapon)
													}
													title={[
														weapon.name,
														queue
															?.find(e => e.player == ual.activeUser.accountName)
															?.queues?.find(e => e.weapon_id == weapon.asset_id) &&
															"This weapon is used in another arena",
													]
														.filter(t => !!t)
														.join("\n")}
												>
													<img src={`https://ipfs.hivebp.io/thumbnail?hash=${weapon.img}`} alt={weapon.name} />
													<span className="name">{weapon.name}</span>
												</div>
											))}
									</div>
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
