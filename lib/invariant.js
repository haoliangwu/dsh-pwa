//#region src/invariant.ts
const PACKAGE_NAME = "dsh-pwa";
/** Cordis companion plugin name. */
const name = "dsh-pwa-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: one host plugin registering routes/taps whose
* disposal is proven by `register`/`tapIndex` returning disposers.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns The installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
