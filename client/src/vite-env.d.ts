interface ImportMetaEnv {
  readonly VITE_LOGIN_CIPHER_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
