/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_DEFAULT_ACCOUNT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
