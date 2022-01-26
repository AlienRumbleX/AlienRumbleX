import React, { useContext, useEffect } from "react";
import { AppCtx } from "../constants";
import { WindowProps } from "../types";

function BattlesWindow(props: WindowProps): JSX.Element {
	const { ual, battles, userInfo } = useContext(AppCtx);

	useEffect(() => props.refreshData(), []);

	return (
		<>
			<div className="window" style={{ display: props.visible ? "" : "none" }}>
				{battles && userInfo && battles.length > 0 && (
					<div className="battles">
						<div className="battle header">
							<span className="arena">Arena</span>
							<span className="winner">Winner</span>
							<span className="date">Date</span>
						</div>

						{battles
							.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
							.map(battle => (
								<div
									className={[
										"battle",
										battle.players.includes(ual.activeUser.accountName) && "participated",
										battle.winner == ual.activeUser.accountName && "won",
									]
										.filter(c => !!c)
										.join(" ")}
									key={`battle-${battle.battle_id}`}
								>
									<span className="arena">{battle.arena_name}</span>
									<span className="winner">{battle.winner}</span>
									<span className="date">
										{new Date(battle.timestamp).toLocaleString("en", {
											year: "numeric",
											month: "short",
											day: "2-digit",
											hour12: false,
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
							))}
					</div>
				)}
				{!(battles && userInfo) && <span className="loading-indicator-m">loading...</span>}
			</div>
		</>
	);
}

export default BattlesWindow;
