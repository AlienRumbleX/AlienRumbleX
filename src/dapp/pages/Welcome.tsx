import React, { useContext } from "react";
import { withRouter } from "react-router-dom";
import BottomBar from "../components/BottomBar";
import Logo from "../components/Logo";
import { AppCtx } from "../constants";

function Welcome(): JSX.Element {
	const { ual } = useContext(AppCtx);

	return (
		<div className="page">
			<div className="main welcome">
				<Logo />
				<div className="welcome-message">
					<h1>Welcome to AlienRumbleX, the greatest battle arena in the metaverse</h1>
					<h2>
						Use your Alien Worlds NFTs and send them to fight in epic battles, and prove you are the greatest warrior in the
						metaverse
					</h2>
				</div>
				<div className="login">
					<button className="button login-button" onClick={() => ual.showModal()}>
						Login
					</button>
				</div>
			</div>
			<BottomBar />
		</div>
	);
}

export default withRouter(Welcome);
