import { Me } from "../me";
import { ng } from "../ng-start";

export let infotip = ng.directive("infotip", () => {
  return {
    restrict: "E",
    template: `
            <i class="close"></i>
            <div ng-transclude></div>
        `,
    scope: {
      name: "@",
      onChange: "&",
      savePreferenceUnder: "@",
      showOnce: "=",
    },
    transclude: true,

    link: async (scope, element, attributes) => {
      let key = "infotip";
      if (
        angular.isString(scope.savePreferenceUnder) &&
        scope.savePreferenceUnder.trim().length > 0
      ) {
        key = scope.savePreferenceUnder.trim();
      }

      element.css({ display: "block" });

      scope.$$showPublicInfoTipRgpdCookie = false;

      var showInfoTip = window.localStorage.getItem("showInfoTip.cookies");
      if (showInfoTip != "false") {
        scope.$$showPublicInfoTipRgpdCookie = true;
      }

      var closeBanner = () => {
        scope.$$showPublicInfoTipRgpdCookie = false;
        window.localStorage.setItem("showInfoTip.cookies", "false");
      };

      element.children("i").on("click", () => {
        element.slideUp();
        closeBanner();
      });

      try {
        await Me.preference(key);

        // Helper get/set function
        var visibility = function (value?: Boolean) {
          if (arguments.length <= 0)
            return Me.preferences[key][scope.name] !== false ? true : false;
          else Me.preferences[key][scope.name] = value;
        };

        const notifyVisibility = function () {
          scope.onChange && scope.onChange({ $visible: visibility() });
        };

        notifyVisibility();
        if (!visibility()) {
          element.remove();
        } else {
          element.css({ display: "block" });
          if (scope.showOnce) {
            visibility(false); // Do not notify this visibility change.
            Me.savePreference(key);
          }
        }

        element.children("i").on("click", () => {
          element.slideUp();
          visibility(false);
          notifyVisibility();
          Me.savePreference(key);
        });
      } catch (error) {
        console.error(error);
      }
    },
  };
});
