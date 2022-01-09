import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppCtx, BLOCKCHAIN } from "../constants";
import { QueueEntry, WindowProps } from "../types";

function HomeWindow(props: WindowProps): JSX.Element {
	const { ual, weapons, crews, queue, setQueue } = useContext(AppCtx);
	const [currentQueueEntry, setCurrentQueueEntry] = useState<QueueEntry>(null);

	useEffect(() => refreshData(), []);
	useEffect(() => setCurrentQueueEntry(queue?.find(entry => entry.player == ual.activeUser.accountName)), [queue]);

	const refreshData = () => {
		refreshQueue();
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
									<div className="message">
										<span className="help">What are you waiting for ?</span>
										<span className="help">Pick your warrior and send them to battle</span>

										<button className="button">
											<Link to="/arenas">Choose Arena</Link>
										</button>
									</div>
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

export default HomeWindow;
