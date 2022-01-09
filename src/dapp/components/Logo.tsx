import React from "react";

function Logo(): JSX.Element {
	return (
		<div className="logo">
			<span className="logo-text">
				<span>Alien</span>
				<span>Rumble</span>
				<span style={{ color: "var(--color-one)" }}>X</span>
			</span>
		</div>
	);
}

export default Logo;
