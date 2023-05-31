import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ReactComponent as CopyIcon } from '../../icons/copy.svg';

import './index.scss';

export type TActionButtonSize = 'sm' | 'lg' | undefined;

export default ({
	children,
	copyText,
	onClick,
	href,
	Icon,
	disabled,
	size,
	...props
}: {
	children?: string;
	copyText?: string;
	onClick?: () => void;
	href?: string;
	Icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
	disabled?: boolean;
	size?: TActionButtonSize;
	className?: string;
}): JSX.Element => {
	const [isCopied, setIsCopied] = useState(false);

	useEffect(() => {
		if (isCopied) {
			setTimeout(() => {
				setIsCopied(false);
			}, 1000);
		}
	}, [isCopied]);

	let ButtonIcon = Icon;
	if (!ButtonIcon && copyText) {
		ButtonIcon = CopyIcon;
	}

	// TODO use size

	let containerClass = 'action-button-container ';
	let buttonTextClass = 'action-button-text ';
	if (size) {
		containerClass += `action-button-container-${size}`;
		buttonTextClass += `action-button-text-${size}`;
	}

	const button = (
		<div className={containerClass} onClick={!disabled ? onClick : undefined}>
			{ButtonIcon ? <ButtonIcon className={'action-button-icon'} /> : null}
			{children ? <span className={buttonTextClass}>{isCopied ? 'Copied!' : children}</span> : null}
		</div>
	);

	if (href) {
		return <a href={href}>{button}</a>;
	}

	if (!copyText) {
		return button;
	}

	return (
		<CopyToClipboard text={copyText} onCopy={() => setIsCopied(true)}>
			{button}
		</CopyToClipboard>
	);
};
