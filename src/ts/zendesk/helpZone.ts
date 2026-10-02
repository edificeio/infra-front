import { getSkinUiOverride } from "../skin";
import { createLegacyHelpZone } from "./legacyHelpZone";
import { createEdificeHelpZone } from "./edificeHelpZone";

// Feature flag (uiOverrides in /assets/theme-conf.js) selecting the help zone launcher:
// `uiOverrides['layout.helpzone'] = 'edifice-in-product'` renders the Edifice-branded
// launcher, any other value keeps the native Zendesk launcher.
export const UI_OVERRIDE_HELPZONE_KEY = "layout.helpzone";
export const HELPZONE_EDIFICE_IN_PRODUCT = "edifice-in-product";

// A help zone is the launcher button opening the Zendesk Guide Widget.
// Only its look differs between variants, the widget itself is shared.
export interface HelpZone {
  // Launcher-specific settings merged into the widget "webWidget" settings
  widgetSettings: any;
  // Render the launcher, once the Zendesk snippet is loaded
  mount(): void;
  // Hide / show the launcher (e.g. while printing)
  hide(): void;
  show(): void;
  // Zendesk only allows a single handler per event: zendeskGuide.ts owns the
  // widget 'open' / 'close' handlers and forwards them to the help zone.
  onWidgetOpen(): void;
  onWidgetClose(): void;
}

export async function getHelpZone(): Promise<HelpZone> {
  const variant = await getSkinUiOverride(UI_OVERRIDE_HELPZONE_KEY);
  return variant === HELPZONE_EDIFICE_IN_PRODUCT
    ? createEdificeHelpZone()
    : createLegacyHelpZone();
}
