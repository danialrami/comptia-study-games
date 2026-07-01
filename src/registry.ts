import type { GameManifest } from "./types";
import { baseConversionGame } from "./games/base-conversion/manifest";
import { psuSizingGame } from "./games/psu-sizing/manifest";

// The suite registry. This array IS the catalog — the dashboard renders whatever
// is here. To add a game: build src/games/<id>/{engine,ui,manifest}.ts (+ tests)
// and add one line below. Nothing else in the shell changes.
export const GAMES: GameManifest[] = [baseConversionGame, psuSizingGame];
