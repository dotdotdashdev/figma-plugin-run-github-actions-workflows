import { emit, loadSettingsAsync, on, saveSettingsAsync, showUI } from "@create-figma-plugin/utilities";
import { initialState, Settings, UserSettings } from "../Settings";

import { InfoResponseHandler, InitHandler, LoadSettingsHandler, NotifyHandler, RequestInfoHandler, SaveSettingsHandler } from "../types";

export default function () {
    on<InitHandler>("INIT", function () {
        loadSettingsAsync<Settings>(initialState).then((settings) => {
          emit<LoadSettingsHandler>("LOAD_SETTINGS", {
            ...settings,
            loaded: true,
            fileKey: figma.root.getPluginData("fileKey"),
            branchUrl: figma.root.getPluginData("branchUrl"),
          });
          
          console.log("Settings LOADED");
        });
      });
      
      on<SaveSettingsHandler>("SAVE_SETTINGS", function ({ fileKey, branchUrl, workflows }) {
        console.log({ figma, test: figma.root.name});
        
        
        saveSettingsAsync<UserSettings>({ workflows }).then(() => {
            figma.root.setPluginData("fileKey", fileKey || "");
            figma.root.setPluginData("branchUrl", branchUrl || "");
            console.log("Settings SAVED");
        });
    });

    on<RequestInfoHandler>("REQUEST_INFO", function () {
        emit<InfoResponseHandler>(
            "INFO_RESPONSE",
            { id: figma.currentPage.id, name: figma.currentPage.name },
            figma.currentPage.selection.map(({ id, name }) => ({ id, name }))
        );
    });

    on<NotifyHandler>("NOTIFY", function (message, options) {
        figma.notify(message, options);
    });

    showUI({
        width: 400,
        height: 500,
    });
}
