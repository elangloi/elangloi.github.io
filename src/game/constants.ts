export const BASE_SPEED = 165 // world px/sec

/* ---------- depth (up = further back in the world) ---------- */
export const DEPTH_SPEED = 0.55 // units of depth (0..1) per second while holding up/down
export const DEPTH_SMOOTH_RATE = 7 // exponential smoothing rate (higher = snappier)
export const GROUND_RATIO = 0.88 // baseline at depth 0 — the front plane, where food sits
export const BOY_BACK_RATIO = 0.7 // baseline at depth 1 — pushed back toward the scenery
export const BOY_FRONT_SCALE = 1
export const BOY_BACK_SCALE = 0.62

/* ---------- walk cycle ---------- */
export const STRIDE = 46 // world px per full step cycle
export const FOOT_LIFT = 5 // px a foot rises at the top of its step
export const BODY_BOB = 2 // px of vertical sway — a gait, not a hop

/* ---------- scene layout (fractions of viewport height) ---------- */
export const HORIZON_RATIO = 0.62 // where the grass starts
export const NEAR_PROP_RATIO = 0.83 // scenery band behind the boy
export const MID_PROP_RATIO = 0.72 // baseline for the mid-depth scenery band
export const SKY_PROP_RATIO = 0.3 // baseline for clouds and the ufo
export const FG_PROP_RATIO = 1.06 // foreground band, anchored past the bottom edge
export const MOUNTAIN_OFFSET = 6 // px below the horizon, so mountains meet the grass

/* ---------- parallax ---------- */
/* Kit's stated ratio is 1 : 1.5 : 2.6 : 5.6 (far -> near), normalized so the
   gameplay plane runs at 1.0. The foreground band is faster still. */
export const CLOUD_SPEED = 0.18
export const MOUNTAIN_SPEED = 0.27
export const MID_SPEED = 0.46
export const NEAR_SPEED = 0.86
export const FG_SPEED = 1.4

export const CLOUD_SPACING = 520
export const MOUNTAIN_SPACING = 760
export const MID_SPACING = 430
export const NEAR_SPACING = 540
export const FG_SPACING = 700

export const MID_PROP_SCALE = 0.7
export const NEAR_PROP_SCALE = 0.82
export const FG_PROP_SCALE = 1.65

/* ---------- the boy ---------- */
export const INITIAL_BODY_LEN = 260
export const GROWTH_PER_MEAL = 26 // slightly more than one 22px capsule
/** noby() draws its head at x + (34 + len) * s, with the ball centered 55 above the anchor. */
export const HEAD_OFFSET_X = 34
export const HEAD_BALL_Y = -55
/** Mouth sits a little below the ball center, in the same local units. */
export const MOUTH_Y = -36
/** Extra world px of tail drawn beyond the left screen edge before it's culled. */
export const BODY_DRAW_MARGIN = 300

/* ---------- food + eating ---------- */
export const FOOD_KIND_COUNT = 6
export const FOOD_AHEAD_DISTANCE = 1600 // spawn this far ahead of the head
export const FOOD_MIN_GAP = 280
export const FOOD_MAX_GAP = 560
export const FOOD_DESPAWN_MARGIN = 2000 // behind worldX, generous enough for any viewport width
/** Hold-to-eat vacuum reach, measured from the mouth. */
export const EAT_RADIUS = 105
/** Seconds a morsel takes to fly from the ground into the mouth. */
export const ABSORB_DUR = 0.3
/** Exponential rate the mouth opens/closes at (higher = snappier). */
export const MOUTH_OPEN_RATE = 14
/** Seconds a swallowed lump takes to travel from the head down to the tail. */
export const SWALLOW_DUR = 1.2

export const CAMERA_SCREEN_X_RATIO = 0.62 // head sits right of center so the tail stays visible
