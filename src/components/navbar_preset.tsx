import GooeyNav from "@/components/GooeyNav/GooeyNav"

const navbarItems = [
	{ label: "Início", href: "#inicio" },
	{ label: "Como funciona", href: "#como-funciona" },
	{ label: "Começar", href: "#comecar" },
]

export function NavbarPreset() {
	return (	
		<header className="fixed top-0 right-0 left-0 z-50 flex justify-center px-4 pt-5">
			<div className="w-fit max-w-[calc(100vw-2rem)] overflow-hidden rounded-full border border-white/10 bg-black/30 px-2 py-1 backdrop-blur-md">
				<GooeyNav
					items={navbarItems}
					particleCount={15}
					particleDistances={[90, 10]}
					particleR={100}
					initialActiveIndex={0}
					animationTime={600}
					timeVariance={300}
					colors={[1, 2, 3, 1, 2, 3, 1, 4]}
				/>
			</div>
		</header>
	)
}

export default NavbarPreset
