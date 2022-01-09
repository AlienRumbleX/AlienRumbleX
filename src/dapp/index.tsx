import React, { useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Redirect } from "react-router-dom";
import "regenerator-runtime/runtime";
import { UALProvider, withUAL } from "ual-reactjs-renderer";
import { AppCtx, BLOCKCHAIN, DAPP_NAME, WAX_CHAIN } from "./constants";
import Welcome from "./pages/Welcome";
import "./style.less";
import { Crew, CrewConf, GameUser, UAL, Weapon, WeaponConf } from "./types";

function useForceUpdate() {
	const [, setValue] = useState<number>(0);
	return () => setValue(value => (value + 1) % 10);
}

function AlienRumbleX(): JSX.Element {
	const { ual } = useContext(AppCtx);
	const forceUpdate = useForceUpdate();

	const handleVisibilityChange = () => {
		if (!document.hidden) {
			forceUpdate();
		}
	};

	useEffect(() => document.addEventListener("visibilitychange", () => handleVisibilityChange(), false), []);

	return (
		<>
			{ual.activeUser ? <Redirect to="/home" /> : <Redirect to="/" />}
			{!ual.activeUser && <Welcome />}
			{/* {ual.activeUser && <Game />} */}
		</>
	);
}

export default function App(props: React.PropsWithChildren<{ ual?: UAL }>): JSX.Element {
	const [accountBalance, setAccountBalance] = useState<number>(NaN);
	const [gameBalance, setGameBalance] = useState<number>(NaN);
	const [userInfo, setUserInfo] = useState<GameUser>(null);

	const [crewConfs, setCrewConfs] = useState<CrewConf[]>(null);
	const [weaponConfs, setWeaponConfs] = useState<WeaponConf[]>(null);

	const [crews, setCrews] = useState<Crew[]>(null);
	const [weapons, setWeapons] = useState<Weapon[]>(null);

	return (
		<AppCtx.Provider
			value={{
				ual: props.ual,
				accountBalance,
				setAccountBalance,
				gameBalance,
				setGameBalance,
				userInfo,
				setUserInfo,
				crewConfs,
				setCrewConfs,
				weaponConfs,
				setWeaponConfs,
				crews,
				setCrews,
				weapons,
				setWeapons,
			}}
		>
			{props.children}
		</AppCtx.Provider>
	);
}

const AlienRumbleXUAL = withUAL(App);

ReactDOM.render(
	<UALProvider chains={[WAX_CHAIN]} authenticators={BLOCKCHAIN.AUTHENTICATORS} appName={DAPP_NAME}>
		<AlienRumbleXUAL>
			<AppCtx.Consumer>
				{() => (
					<Router>
						<AlienRumbleX />
					</Router>
				)}
			</AppCtx.Consumer>
		</AlienRumbleXUAL>
	</UALProvider>,
	document.querySelector("#root"),
);
