module.exports = {
	presets: [["@babel/env", {
		bugfixes: true,
		shippedProposals: true,
		targets: { node: "23.11.0" }
	}]]
};
