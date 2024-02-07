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

      element.css({'display': 'block'});

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
    },
  };
});
