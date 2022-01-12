import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppCtx } from "../constants";
import { WindowProps } from "../types";

function HomeWindow(props: WindowProps): JSX.Element {
	const { weapons, crews, queue, userInfo } = useContext(AppCtx);

	useEffect(() => props.refreshData(), []);

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
									<span className="help">What are you waiting for ?</span>
									<span className="help">Pick your warrior and send them to battle</span>

									<button className="button">
										<Link to="/arenas">Choose Arena</Link>
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

export default HomeWindow;
