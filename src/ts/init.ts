function isIOSWebview(): boolean {
    var standalone = (window as any).navigator.standalone,
        userAgent = window.navigator.userAgent.toLowerCase(),
        safari = /safari/.test(userAgent),
        ios = /iphone|ipod|ipad/.test(userAgent);

    if (ios) {
        if (!standalone && safari) {
            return false;//browser
        } else if (standalone && !safari) {
            return false;//standalone
        } else if (!standalone && !safari) {
            return true;
        };
    } else {
        //not iOS
        return false;
    };
}

function isIOSWebviewUA() {
    return /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
}

function setCookie(cname: string, cvalue: string, exdays: number) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname: string): string {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function getSignedCookie(cname: string): string {
    return (getCookie(cname) || "").split(":")[0];
}
function checkWebview(){
    //check if webview
    const ignore = getSignedCookie("webviewignored");
    if(ignore=="true"){
        return;
    }
    const location = getSignedCookie("webviewlocation");
    if(location){
        window.location.href = location;
        return;
    }
    if (isIOSWebview() && isIOSWebviewUA()) {
        setCookie("webviewdetected", "true",100);
        const secure = getSignedCookie("webviewsecure");
        if(!secure){
            window.location.reload();
        }
    } else {
        //not in ios webview
    }
}
export function init() {
    checkWebview();
}

init();