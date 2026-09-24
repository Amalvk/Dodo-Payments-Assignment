/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Overrides the SDK's default (localhost) checkout origin for a deployed build —
   * see README "Deploying". */
  readonly VITE_CHECKOUT_URL?: string;
}
