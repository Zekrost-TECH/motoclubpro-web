import { defineConfig } from "vite";
import nixjs from "@deijose/vite-plugin-nix-js";

export default defineConfig({
    plugins: [nixjs()],
});
