import { HelpZone } from "./helpZone";

// Native Zendesk launcher, showing its label on mobile until the page scrolls.
export function createLegacyHelpZone(): HelpZone {
  return {
    widgetSettings: {
      launcher: {
        mobile: {
          labelVisible: true,
        },
      },
    },

    mount() {
      // Set the Zendesk Guide Widget settings on mobile to remove the label when the user scrolls
      window.addEventListener("scroll", () => {
        (window as any).zE("webWidget", "updateSettings", {
          webWidget: {
            launcher: {
              mobile: {
                labelVisible: window.scrollY <= 5,
              },
            },
          },
        });
      });
    },

    // The native launcher follows the widget visibility (zE 'hide' / 'show')
    hide() {},
    show() {},
  };
}
