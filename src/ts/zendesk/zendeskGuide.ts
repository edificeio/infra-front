import { http } from "../http";
import { model } from "../modelDefinitions";
import { Me } from "../me";
import { skin } from "../skin";
import { getHelpZone } from "./helpZone";

const profileTypes = () => {
  switch (model.me.type) {
    case "ENSEIGNANT":
      return "teacher";
    case "ELEVE":
      return "student";
    case "PERSRELELEVE":
      return "relative";
    case "PERSEDUCNAT":
      return "personnel";
    default:
      return model.me.type;
  }
};

// Add Zendesk Guide Widget
export function addZendeskGuideWidget() {
  http()
    .get("/zendeskGuide/config")
    .done(function (data) {
      // Add Zendesk Guide Widget if the data is not empty and key is present
      if (data && data.key) {
        // Create the script element
        const scriptZendesk = document.createElement("script");
        scriptZendesk.id = "ze-snippet";
        scriptZendesk.src = `https://static.zdassets.com/ekr/snippet.js?key=${data.key}`;

        document.body.appendChild(scriptZendesk).onload = async () => {
          const helpZone = await getHelpZone();

          // Set the Zendesk Guide Widget settings language, currentLanguage is the language of the user choice
          if ((window as any).currentLanguage === "es") {
            (window as any).zE(function () {
              (window as any).zE.setLocale("es-419");
            });
          } else {
            (window as any).zE(function () {
              (window as any).zE.setLocale("fr");
            });
          }

          // Set the Zendesk Guide Widget settings labels if the module is not empty
          let locationHref = window.location.href;
          if (Object.keys(data.module).length > 0) {
            setZendeskLabels(data.module, locationHref);
          }

          // Set the Zendesk Guide Widget settings color, the help zone launcher settings and suppress contact form if the user has the right to see the support
          (window as any).zE("webWidget", "updateSettings", {
            webWidget: {
              ...helpZone.widgetSettings,
              color: { theme: "#3030D1" },
              zIndex: 8000,
              contactForm: {
                suppress: !model.me.hasWorkflow(
                  "net.atos.entng.support.controllers.DisplayController|view"
                ),
              },
              helpCenter: {
                messageButton: {
                  "*": "Assistance ENT",
                  "es-419": "Asistencia ENT",
                },
                originalArticleButton: (data.articleRedirectButton !== null && data.articleRedirectButton !== undefined) ? data.articleRedirectButton : true,
              },
            },
          });

          // Render the help zone launcher (native Zendesk one or Edifice one, see helpZone.ts)
          helpZone.mount();

          // Hide the Zendesk Guide Widget and its launcher before printing
          window.addEventListener("beforeprint", () => {
            (window as any).zE("webWidget", "hide");
            helpZone.hide();
          });

          // Display Zendesk Guide Widget and its launcher back after printing has completed
          window.addEventListener("afterprint", () => {
            (window as any).zE("webWidget", "show");
            helpZone.show();
          });

          // Set the Zendesk Guide Widget to update the labels when the user opens the widget
          (window as any).zE("webWidget:on", "open", function () {
            // Detect if the user has changed the page to reset the labels
            if (
              Object.keys(data.module).length > 0 &&
              window.location.href !== locationHref
            ) {
              setZendeskLabels(data.module, window.location.href);
              locationHref = window.location.href;
            }

            // Check if user has the right to see the support to display the support button if the contact form is suppressed
            if (
              model.me.hasWorkflow(
                "net.atos.entng.support.controllers.DisplayController|view"
              )
            ) {
              (window as any).zE("webWidget", "updateSettings", {
                webWidget: {
                  contactForm: {
                    suppress: false,
                  },
                },
              });
            }
          });

          (window as any).zE(
            "webWidget:on",
            "userEvent",
            function (ref: {
              category: any;
              action: any;
              properties: any;
            }) {
              var category = ref.category;
              var action = ref.action;
              var properties = ref.properties;

              // Suppress the contact form and redirect to the support page if the user has the right to see the support and click on the support button
              if (
                action === "Contact Form Shown" &&
                category === "Zendesk Web Widget" &&
                properties &&
                properties.name === "contact-form" &&
                model.me.hasWorkflow(
                  "net.atos.entng.support.controllers.DisplayController|view"
                )
              ) {
                (window as any).zE("webWidget", "updateSettings", {
                  webWidget: {
                    contactForm: {
                      suppress: true,
                    },
                  },
                });
                (window as any).zE('webWidget', 'close');
                window.open("/support/tickets/new", "_blank");
              }
            }
          );
        };
      }
    });
}

// Set the Zendesk Guide Widget settings labels
function setZendeskLabels(dataModule, locationPathname) {
  // Split the location pathname to get the module label
  const modulePathnameSplit = locationPathname.split("/");
  let moduleLabel = "";

  let labels = "";

  // Get the data module from the data and check if the module has labels if not take the default value if exists
  if (
    dataModule.labels &&
    Object.keys(dataModule.labels).length > 0 &&
    modulePathnameSplit.length > 3
  ) {
    // Reformat the pathname with removing the id if exists
    for (let i = 3; i < modulePathnameSplit.length; i++) {
      if (
        modulePathnameSplit[i].length > 0 &&
        (modulePathnameSplit[i].match(/\d/) == null ||  ("viescolaire#" ===  modulePathnameSplit[3] && modulePathnameSplit[i].match(/\%20/) !== null))
      ) {
        if (moduleLabel.length === 0) {
          moduleLabel = modulePathnameSplit[i];
        } else {
          moduleLabel = moduleLabel + "/" + modulePathnameSplit[i];
        }
      }
    }

    // Check if the module has label in dataModule if not take the default value
    if (dataModule.labels.hasOwnProperty(moduleLabel)) {
      labels = dataModule.labels[moduleLabel];
    } else if (
      dataModule.default &&
      String(dataModule.default).length > 0
    ) {
      labels = dataModule.default;
    }
  } else if (dataModule.default && String(dataModule.default).length > 0) {
    labels = dataModule.default;
  }

  if(modulePathnameSplit && modulePathnameSplit.includes("formulaire#")) {
    (window as any).zE("webWidget", "updateSettings", {
      webWidget: {
        offset: {
          mobile: {
            horizontal: '70px',
            vertical: '0px'
          }
        }
      },
    });
  }

  // Check if label has tag ${adml} and replace it with the user role
  if(labels.includes("${adml}")) {
    if(Me.session.functions.ADMIN_LOCAL) {
      labels = labels.replace("${adml}", "adml");
    } else {
      labels = labels.replace("/${adml}", "");
    }
  }

  // Check if the label has a ${profile} tag and replace it with the user profile
  if (labels.includes("${profile}")) {
    labels = labels.replace("${profile}", profileTypes());
  }

  // Check if the user has a ${theme} tag and replace it with the theme
  if (labels.includes("${theme}")) {
    if (skin.is1D) {
      labels = labels.replace("${theme}", "1D");
    } else {
      labels = labels.replace("${theme}", "2D");
    }
  }

  // Check if the label is not empty and set the labels to the Zendesk Guide Widget
  if (labels.length > 0) {
    (window as any).zE("webWidget", "helpCenter:setSuggestions", {
      labels: [labels],
    });
  }
}
