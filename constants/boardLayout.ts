// Plant container size: must match HexBoard's hexWidth/hexHeight so overlay and board
// use the same base size and scale(1.5) is identical (no snap at end of impact).
const HEX_SIZE = 34.2;
const VISUAL_SCALE = 0.96;
const VERTICAL_SQUASH = 0.95;

export const PLANT_CONTAINER_WIDTH = 2 * HEX_SIZE * VISUAL_SCALE;
export const PLANT_CONTAINER_HEIGHT =
  Math.sqrt(3) * HEX_SIZE * VISUAL_SCALE * VERTICAL_SQUASH;

/** Grid scale used in HexBoard (overlay does not use this to avoid positioning issues). */
export const GRID_SCALE = 1.155;
