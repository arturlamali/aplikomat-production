import Image from "next/image";

export const IconLogo = ({ className }: { className?: string }) => {
	return (
		<Image
			src="/logos/icon.png"
			alt="logo"
			width={32}
			height={32}
			className={className}
		/>
	);
};

export const LogoWithText = ({ className }: { className?: string }) => {
	return (
		<Image
			src="/logos/small-logo.png"
			alt="logo"
			width={459}
			height={100}
			className={className}
		/>
	);
};
