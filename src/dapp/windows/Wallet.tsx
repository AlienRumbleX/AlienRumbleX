import React, { useContext, useState } from "react";
import { SignTransactionResponse } from "universal-authenticator-library";
import { AppCtx, BLOCKCHAIN } from "../constants";
import { WindowProps } from "../types";

function WalletWindow(props: WindowProps): JSX.Element {
	const { ual, gameBalance, accountBalance } = useContext(AppCtx);
	const [depositInput, setDepositInput] = useState<number>(0);
	const [withdrawInput, setWithdrawInput] = useState<number>(0);

	const deposit = async () => {
		const res: SignTransactionResponse | Error = await ual.activeUser
			.signTransaction(
				{
					actions: [
						{
							account: BLOCKCHAIN.TOKEN_CONTRACT,
							name: "transfer",
							authorization: [{ actor: ual.activeUser.accountName, permission: ual.activeUser.requestPermission }],
							data: {
								from: ual.activeUser.accountName,
								to: BLOCKCHAIN.DAPP_CONTRACT,
								quantity: `${depositInput.toLocaleString("en", {
									useGrouping: false,
									minimumFractionDigits: 4,
									maximumFractionDigits: 4,
								})} ${BLOCKCHAIN.TOKEN_SYMBOL}`,
								memo: "deposit",
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
			props.showPopup("success", "Tokens deposited successfully");
			props.refreshData();
		}
	};

	const withdraw = async () => {
		const res: SignTransactionResponse | Error = await ual.activeUser
			.signTransaction(
				{
					actions: [
						{
							account: BLOCKCHAIN.DAPP_CONTRACT,
							name: "withdraw",
							authorization: [{ actor: ual.activeUser.accountName, permission: ual.activeUser.requestPermission }],
							data: {
								user: ual.activeUser.accountName,
								quantity: `${withdrawInput.toLocaleString("en", {
									useGrouping: false,
									minimumFractionDigits: 4,
									maximumFractionDigits: 4,
								})} ${BLOCKCHAIN.TOKEN_SYMBOL}`,
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
			props.showPopup("success", "Tokens withdrawn successfully");
			props.refreshData();
		}
	};

	return (
		<>
			<div className="window" style={{ display: props.visible ? "" : "none" }}>
				<div className="wallet">
					<div className="deposit">
						<h3>Deposit</h3>
						<div className="controls">
							<span className="balance" onClick={() => setDepositInput(accountBalance)}>{`${accountBalance.toLocaleString("en", {
								maximumFractionDigits: 4,
							})} ${BLOCKCHAIN.TOKEN_SYMBOL}`}</span>
							<input
								className="input"
								type="number"
								step={1}
								min={0}
								max={accountBalance || 0}
								value={depositInput}
								onChange={e => setDepositInput(parseFloat(e.target.value))}
							/>
							<button disabled={accountBalance <= 0} className="button deposit-btn" onClick={() => deposit()}>
								Deposit
							</button>
						</div>
					</div>
					<div className="withdraw">
						<h3>Withdraw</h3>
						<div className="controls">
							<span className="balance" onClick={() => setWithdrawInput(gameBalance)}>{`${gameBalance.toLocaleString("en", {
								maximumFractionDigits: 4,
							})} ${BLOCKCHAIN.TOKEN_SYMBOL}`}</span>
							<input
								className="input"
								type="number"
								min={0}
								step={1}
								max={gameBalance || 0}
								value={withdrawInput}
								onChange={e => setWithdrawInput(parseFloat(e.target.value))}
							/>
							<button disabled={gameBalance <= 0} className="button withdraw-btn" onClick={() => withdraw()}>
								Withdraw
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default WalletWindow;
