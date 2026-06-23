export const ROOT_ID = "reway-access-root";
export const PANEL_ID = "reway-fab-panel";
export const FAB_SIZE = 44;
export const EDGE_MARGIN = 16;
export const PANEL_WIDTH = 300;
export const SEARCH_DEBOUNCE_MS = 180;
export const SUCCESS_RESET_MS = 5000;
export const NO_GROUP_ID = "no-group";
export const ACCESS_COMMAND_KEY = "rewayAccessCommand";
export const GROUP_ICON_MANIFEST_PATH = "js/group-icon-manifest.js";
export const GROUP_ICON_MANIFEST_ASSIGNMENT = "globalThis.REWAY_GROUP_ICON_MANIFEST = ";
export const MIN_VIEWPORT_WIDTH = 720;
export const MIN_VIEWPORT_HEIGHT = 420;

export const DEFAULT_CORNER = "bottom-right";
export const VALID_CORNERS = ["bottom-right", "bottom-left", "top-right", "top-left"];

export const STRIP = { PAGE: "page", SESSION: "session", SUCCESS: "success" };
export const VIEW = { GROUPS: "groups", DRILL_IN: "drill-in", SEARCH: "search" };

export const state = {
  // lifecycle
  enabled: false,
  panelOpen: false,
  keyboardMode: false,
  fabCorner: DEFAULT_CORNER,

  // save strip
  stripMode: STRIP.PAGE,
  lastGroupId: null,
  lastGroupName: "",
  pickerMode: false,
  pickerReturnTo: STRIP.PAGE,
  pickerSelectedIds: new Set(),

  // success state
  successBookmark: null, // { id, url, groupId, groupName }

  // session strip
  sessionTabCount: 0,
  sessionName: "",

  // groups panel
  view: VIEW.GROUPS,
  groups: [],
  groupsStatus: "idle", // "idle" | "loading" | "ready" | "error"
  pinnedGroupIds: new Set(),
  recentGroupIds: [], // ordered list of up to 3 recently saved-to group IDs

  // drill-in
  activeGroupId: null,
  groupActionsOpen: false,
  bookmarksByGroup: new Map(),
  bookmarksStatusByGroup: new Map(), // groupId → "idle" | "loading" | "ready" | "error"

  // search
  searchQuery: "",
  searchStatus: "idle", // "idle" | "loading" | "ready" | "error"
  searchResults: { groups: [], bookmarks: [] },

  // page context — populated at panel open from the active tab
  pageTitle: "",
  pageUrl: "",
  pageFavicon: "",

  // user settings
  hiddenHosts: [],
};
