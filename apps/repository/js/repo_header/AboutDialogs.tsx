import {Devices} from "../../../../web/js/util/Devices";
import {Dialogs} from "../../../../web/js/ui/dialogs/Dialogs";
import * as React from "react";
import {Version} from "polar-shared/src/util/Version";
import {Platforms} from "polar-shared/src/util/Platforms";
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";

export class AboutDialogs {

    public static create() {
        const version = Version.get();
        const device = Devices.get();
        const platform = Platforms.toSymbol(Platforms.get());

        const body = <div>

            <div><b>Version: </b> {version}</div>
            <div><b>Device: </b> {device}</div>
            <div><b>Platform: </b> {platform}</div>
            <div><b>Screen width: </b> {window.screen.width}</div>
            <div><b>Screen height: </b> {window.screen.height}</div>

        </div>;

        Dialogs.alert({
            title: 'About',
            body,
            type: 'info',
            onConfirm: NULL_FUNCTION
        });

    }

}
