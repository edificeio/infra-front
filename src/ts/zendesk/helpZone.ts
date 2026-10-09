import { getSkinUiOverride } from "../skin";
import { createLegacyHelpZone } from "./legacyHelpZone";
import { createEdificeHelpZone } from "./edificeHelpZone";



// A help zone is the launcher button opening the Zendesk Guide Widget.
// Only its look differs between variants, the widget itself is shared.
export interface HelpZone {
  // Launcher-specific settings merged into the widget "webWidget" settings
  widgetSettings: any;
  // Widget panel color forced by the variant, regardless of the backend one
  //TODO #IMPULS-6352 to delete with "edifice in product" generalization 
  forcedColor?: string;
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
  // TODO #IMPULS-6352 : inverser le feature flag pour que par defaut il ait ce look "edifice-in-product" mais que l'override { 'layout.helpzone': 'hide-edifice-logo' } puisse etre possible
  const variant = await getSkinUiOverride("layout.helpzone");
  return variant === "edifice-in-product"
    ? createEdificeHelpZone()
    : createLegacyHelpZone();
}
