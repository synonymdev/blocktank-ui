import React, { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	navigate,
	refreshOrder,
	selectOrders,
	selectOrdersState,
	removeOrderId,
	TPublicPage
} from '../../../store/public-store';
import FormCard from '../../../components/form-card';
import Spinner from '../../../components/spinner';
import Divider from '../../../components/divider';
import Button from '../../../components/action-button';
import { ReactComponent as TransferActive } from '../../../icons/transfer-active.svg';
import { ReactComponent as TransferIconActivePurple } from '../../../icons/transfer-active-purple.svg';
import { ReactComponent as Lightning } from '../../../icons/lightning.svg';
import { ReactComponent as LightningActive } from '../../../icons/lightning-active.svg';
import { ReactComponent as LightningGreen } from '../../../icons/lightning-green.svg';
import { ReactComponent as LightningRed } from '../../../icons/lightning-red.svg';
import { ReactComponent as Trash } from '../../../icons/trash.svg';

import './index.scss';

const ListItem = ({
	id,
	Icon,
	title,
	subHeading,
	label,
	onClick,
	buttonText,
	hasScrollBar,
	showDeleteButton
}: {
	id: string;
	Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
	title: string;
	subHeading: string;
	label: string;
	onClick: () => void;
	buttonText: string;
	hasScrollBar: boolean;
	showDeleteButton: boolean;
}): JSX.Element => {
	const dispatch = useAppDispatch();
	const randomStringId = Math.random().toString(36).substring(7);
	return (
		<div
			key={`${id}-${randomStringId}`}
			className={`order-list-item ${hasScrollBar ? 'with-scrollbar' : ''}`}
		>
			<p className={'order-list-item-date'}>{title}</p>
			<div className={'order-list-content'}>
				<div className={'order-list-details'}>
					<span className={'order-status-heading'}>{subHeading}</span>
					<span className={'order-status-value'}>
						<Icon className={'order-status-icon'} />
						{label}
					</span>
				</div>
				{showDeleteButton && (
					<div
						className={'action-button-container action-button-delete-container'}
						onClick={(e) => {
							e.preventDefault();
							dispatch(removeOrderId(id));
						}}
					>
						<Trash className={'action-delete-button-icon'} />
					</div>
				)}
				<Button onClick={onClick}>{buttonText}</Button>
			</div>
			<Divider />
		</div>
	);
};

function OrdersPage(): JSX.Element {
	const orders = useAppSelector(selectOrders);
	const ordersState = useAppSelector(selectOrdersState);
	const dispatch = useAppDispatch();

	useEffect(() => {
		orders.forEach((o) => {
			dispatch(refreshOrder(o._id)).catch((e) => alert(e));
		});
	}, []);

	if (ordersState === 'loading') {
		return (
			<FormCard>
				<Spinner style={{ fontSize: 8 }} centered />
			</FormCard>
		);
	}

	// After 4 orders we need to add padding on the right for the scrollbar
	const hasScrollbar = orders.length > 4;

	return (
		<FormCard title={'My orders'} backPage={'configure'}>
			<div className={'orders-container'}>
				{orders.length === 0 ? (
					<ListItem
						key={'no-order'}
						id={'no-order'}
						Icon={LightningActive}
						title={'No orders yet'}
						subHeading={'New channel'}
						label={'Lightning channel'}
						buttonText={'Create channel'}
						showDeleteButton={false}
						onClick={() => dispatch(navigate({ page: 'configure' }))}
						hasScrollBar={hasScrollbar}
					/>
				) : null}
				{orders.map(({ _id, state, stateMessage, created_at }) => {
					const date = new Date(created_at);
					let buttonText = 'Order details';
					let Icon = Lightning;
					let page: TPublicPage = 'order';
					let showDeleteButton = false;

					switch (state) {
						case 0: {
							// Awaiting payment
							buttonText = 'Pay now';

							const themeParam = new URLSearchParams(window.location.search).get('theme') ?? '';
							if (themeParam === 'ln-dark' || themeParam === 'ln-light') {
								Icon = TransferIconActivePurple;
							} else {
								Icon = TransferActive;
							}
							page = 'payment';
							showDeleteButton = true;
							break;
						}
						case 100: {
							// Paid
							buttonText = 'Claim channel';
							page = 'claim';
							break;
						}
						case 200: // URI set
							break;
						case 300: // Channel opening
							Icon = LightningGreen;
							break;
						case 400: // Given up
							Icon = LightningRed;
							showDeleteButton = true;
							break;
						case 450: // Channel closed
							Icon = LightningRed;
							showDeleteButton = true;
							break;
						case 500: // Channel open
							Icon = LightningGreen;
							break;
					}

					return (
						<ListItem
							key={_id}
							id={_id}
							Icon={Icon}
							onClick={() => dispatch(navigate({ page, orderId: _id }))}
							title={date.toLocaleString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
							showDeleteButton={showDeleteButton}
							subHeading={'Order status'}
							label={stateMessage}
							buttonText={buttonText}
							hasScrollBar={hasScrollbar}
						/>
					);
				})}
			</div>
		</FormCard>
	);
}

export default OrdersPage;
