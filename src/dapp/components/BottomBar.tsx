import React from "react";

function BottomBar(): JSX.Element {
	return (
		<div className="bottom-bar">
			<span className="copyright">2022 | AlienRumbleX</span>
			<div className="links">
				{/* <a href="https://discord.com/" target="_blank" rel="noreferrer" className="link">
					Discord
				</a> */}
			</div>
			<div className="website">
				<a href="https://github.com/benjiewheeler/AlienRumbleX" target="_blank" rel="noreferrer" className="link">
					Github
				</a>
			</div>
		</div>
	);
}

export default BottomBar;
