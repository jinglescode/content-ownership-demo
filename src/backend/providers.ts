import { InfuraProvider, MaestroProvider } from "@meshsdk/core";

export const infura = new InfuraProvider(
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID!,
  process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET!,
  {}
);

export const maestro = new MaestroProvider({ apiKey: process.env.NEXT_PUBLIC_MAESTRO_APIKEY!, network: "Preprod" });
