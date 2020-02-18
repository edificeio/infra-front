



const whiteListAttributes = ["accept","accept-charset","accesskey","action","align","alt","async","autocomplete","autofocus","autoplay","bgcolor","border","charset","checked","cite","class","color","cols","colspan","content","contenteditable","controls","coords","data","data-*","datetime","default","defer","dir","dirname","disabled","download","draggable","dropzone","enctype","for","form","formaction","headers","height","hidden","high","href","hreflang","http-equiv","id","ismap","kind","label","lang","list","loop","low","max","maxlength","media","method","min","multiple","muted","name","novalidate","open","optimum","pattern","placeholder","poster","preload","readonly","rel","required","reversed","rows","rowspan","sandbox","scope","selected","shape","size","sizes","span","spellcheck","src","srcdoc","srclang","srcset","start","step","style","tabindex","target","title","translate","type","usemap","value","width","wrap"];

export function getEditorWhiteListAttributes(){
    return whiteListAttributes;
}