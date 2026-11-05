interface ImportMetaEnv {
  readonly VITE_LOGIN_CIPHER_SECRET: string;
  readonly VITE_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
