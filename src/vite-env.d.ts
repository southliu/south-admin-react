/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_VERSION?: string;
  readonly VITE_SHOW_DEFAULT_ACCOUNT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
