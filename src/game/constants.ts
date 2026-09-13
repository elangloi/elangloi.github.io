export const BASE_SPEED = 165 // world px/sec

/* ---------- special snacks (indices into FOOD_FNS in render.ts) ---------- */
/** Plain snacks are the kinds below this; specials roll separately in spawnFood. */
export const PLAIN_FOOD_KIND_COUNT = 10
export const CAR_KIND = 10
export const FAIRY_KIND = 11
export const FRIEND_KIND = 12
export const GIRAFFE_KIND = 13
export const FRIEND_KINDS = [FAIRY_KIND, FRIEND_KIND, GIRAFFE_KIND]
export const CAR_SPAWN_CHANCE = 0.28
export const FRIEND_SPAWN_CHANCE = 0.18 // split evenly across FRIEND_KINDS

/* ---------- speed ---------- */
export const SPEED_PER_BOOST = 40 // world px/sec per point on the HUD's +N counter
export const BOOST_PER_CAR = 1
export const BOOST_PER_FRIEND = -2 // permanent; eating friends is bad — but never below 0
export const SPEED_SMOOTH_RATE = 3 // exponential rate speed changes ramp in at
export const SPEED_MSG_DUR = 2.6 // seconds the "speeding up!" cloud shows

/* ---------- snack popups ---------- */
export const POPUP_DUR = 1.1 // seconds an "ate a snack!" floats for
export const POPUP_RISE = 46 // px it rises over its life

/* ---------- the 100-snack party ---------- */
export const PARTY_EVERY = 10 // snacks between explosions
export const PARTY_BURST_DUR = 3.2 // seconds the body bounces around
export const PARTY_REGROUP_DUR = 0.9 // seconds to pull the segments back
export const PARTY_GRAVITY = 1100 // px/sec² — floaty enough to reach the sky
export const PARTY_BOUNCE = 0.86 // velocity kept on each bounce; keeps them lively
export const PARTY_MIN_LAUNCH = 650 // px/sec, initial upward kick range
export const PARTY_MAX_LAUNCH = 1250

/* ---------- day / night ---------- */
export const DAY_LENGTH_SEC = 150 // one full dawn-to-dawn loop
export const DAY_START_PHASE = 0.16 // begin mid-morning, sun already up

/* ---------- sick ---------- */
export const SICK_DUR = 3.5 // seconds of queasiness after a friend
export const SICK_SLOW = 0.45 // speed multiplier while sick

/* ---------- depth (up = further back in the world) ---------- */
export const DEPTH_SPEED = 0.55 // units of depth (0..1) per second while holding up/down
export const DEPTH_SMOOTH_RATE = 7 // exponential smoothing rate (higher = snappier)
export const GROUND_RATIO = 0.88 // baseline at depth 0 — the front plane, where food sits
export const BOY_BACK_RATIO = 0.7 // baseline at depth 1 — pushed back toward the scenery
export const BOY_FRONT_SCALE = 1
export const BOY_BACK_SCALE = 0.62

/* ---------- walk cycle ---------- */
export const STRIDE = 46 // world px per full step cycle
/** The gait can't cycle faster than this however fast the world scrolls, or he shakes. */
export const MAX_STEPS_PER_SEC = 5
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
/** Mouth sits a little below the head ball's center (-55), in local sprite units. */
export const MOUTH_Y = -36
/** Extra world px of tail drawn beyond the left screen edge before it's culled. */
export const BODY_DRAW_MARGIN = 100
/** World px of head history kept beyond the body's own length. */
export const TRAIL_MARGIN = 400

/* ---------- food + eating ---------- */
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
