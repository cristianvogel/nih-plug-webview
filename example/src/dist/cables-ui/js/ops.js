"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Ui=Ops.Ui || {};
Ops.Anim=Ops.Anim || {};
Ops.Html=Ops.Html || {};
Ops.Math=Ops.Math || {};
Ops.Vars=Ops.Vars || {};
Ops.Array=Ops.Array || {};
Ops.Number=Ops.Number || {};
Ops.String=Ops.String || {};
Ops.Boolean=Ops.Boolean || {};
Ops.Devices=Ops.Devices || {};
Ops.Trigger=Ops.Trigger || {};
Ops.Graphics=Ops.Graphics || {};
Ops.Html.CSS=Ops.Html.CSS || {};
Ops.Extension=Ops.Extension || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Gl.Textures=Ops.Gl.Textures || {};
Ops.Math.Compare=Ops.Math.Compare || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Gl.ImageCompose=Ops.Gl.ImageCompose || {};
Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};
Ops.Extension.Deprecated=Ops.Extension.Deprecated || {};
Ops.Gl.ImageCompose.Noise=Ops.Gl.ImageCompose.Noise || {};
Ops.Graphics.Intersection=Ops.Graphics.Intersection || {};



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    fpsLimit = op.inValue("FPS Limit", 0),
    trigger = op.outTrigger("trigger"),
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    reduceFocusFPS = op.inValueBool("Reduce FPS not focussed", false),
    reduceLoadingFPS = op.inValueBool("Reduce FPS loading"),
    clear = op.inValueBool("Clear", true),
    clearAlpha = op.inValueBool("ClearAlpha", true),
    fullscreen = op.inValueBool("Fullscreen Button", false),
    active = op.inValueBool("Active", true),
    hdpi = op.inValueBool("Hires Displays", false),
    inUnit = op.inSwitch("Pixel Unit", ["Display", "CSS"], "Display");

op.onAnimFrame = render;
hdpi.onChange = function ()
{
    if (hdpi.get()) op.patch.cgl.pixelDensity = window.devicePixelRatio;
    else op.patch.cgl.pixelDensity = 1;

    op.patch.cgl.updateSize();
    if (CABLES.UI) gui.setLayout();
};

active.onChange = function ()
{
    op.patch.removeOnAnimFrame(op);

    if (active.get())
    {
        op.setUiAttrib({ "extendTitle": "" });
        op.onAnimFrame = render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({ "extendTitle": "Inactive" });
    }
};

const cgl = op.patch.cgl;
let rframes = 0;
let rframeStart = 0;
let timeOutTest = null;
let addedListener = false;

if (!op.patch.cgl) op.uiAttr({ "error": "No webgl cgl context" });

const identTranslate = vec3.create();
vec3.set(identTranslate, 0, 0, 0);
const identTranslateView = vec3.create();
vec3.set(identTranslateView, 0, 0, -2);

fullscreen.onChange = updateFullscreenButton;
setTimeout(updateFullscreenButton, 100);
let fsElement = null;

let winhasFocus = true;
let winVisible = true;

window.addEventListener("blur", () => { winhasFocus = false; });
window.addEventListener("focus", () => { winhasFocus = true; });
document.addEventListener("visibilitychange", () => { winVisible = !document.hidden; });
testMultiMainloop();

cgl.mainloopOp = this;

inUnit.onChange = () =>
{
    width.set(0);
    height.set(0);
};

function getFpsLimit()
{
    if (reduceLoadingFPS.get() && op.patch.loading.getProgress() < 1.0) return 5;

    if (reduceFocusFPS.get())
    {
        if (!winVisible) return 10;
        if (!winhasFocus) return 30;
    }

    return fpsLimit.get();
}

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if (fsElement)fsElement.style.display = "block";
    }

    function onMouseLeave()
    {
        if (fsElement)fsElement.style.display = "none";
    }

    op.patch.cgl.canvas.addEventListener("mouseleave", onMouseLeave);
    op.patch.cgl.canvas.addEventListener("mouseenter", onMouseEnter);

    if (fullscreen.get())
    {
        if (!fsElement)
        {
            fsElement = document.createElement("div");

            const container = op.patch.cgl.canvas.parentElement;
            if (container)container.appendChild(fsElement);

            fsElement.addEventListener("mouseenter", onMouseEnter);
            fsElement.addEventListener("click", function (e)
            {
                if (CABLES.UI && !e.shiftKey) gui.cycleFullscreen();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding = "10px";
        fsElement.style.position = "absolute";
        fsElement.style.right = "5px";
        fsElement.style.top = "5px";
        fsElement.style.width = "20px";
        fsElement.style.height = "20px";
        fsElement.style.cursor = "pointer";
        fsElement.style["border-radius"] = "40px";
        fsElement.style.background = "#444";
        fsElement.style["z-index"] = "9999";
        fsElement.style.display = "none";
        fsElement.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Capa_1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 490 490\" style=\"width:20px;height:20px;\" xml:space=\"preserve\" width=\"512px\" height=\"512px\"><g><path d=\"M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z\" fill=\"#FFFFFF\"/><path d=\"M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z\" fill=\"#FFFFFF\"/><path d=\"M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z\" fill=\"#FFFFFF\"/><path d=\"M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z\" fill=\"#FFFFFF\"/></g></svg>";
    }
    else
    {
        if (fsElement)
        {
            fsElement.style.display = "none";
            fsElement.remove();
            fsElement = null;
        }
    }
}

op.onDelete = function ()
{
    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

function render(time)
{
    if (!active.get()) return;
    if (cgl.aborted || cgl.canvas.clientWidth === 0 || cgl.canvas.clientHeight === 0) return;

    op.patch.cg = cgl;

    if (hdpi.get())op.patch.cgl.pixelDensity = window.devicePixelRatio;

    const startTime = performance.now();

    op.patch.config.fpsLimit = getFpsLimit();

    if (cgl.canvasWidth == -1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if (cgl.canvasWidth != width.get() || cgl.canvasHeight != height.get())
    {
        let div = 1;
        if (inUnit.get() == "CSS")div = op.patch.cgl.pixelDensity;

        width.set(cgl.canvasWidth / div);
        height.set(cgl.canvasHeight / div);
    }

    if (CABLES.now() - rframeStart > 1000)
    {
        CGL.fpsReport = CGL.fpsReport || [];
        if (op.patch.loading.getProgress() >= 1.0 && rframeStart !== 0)CGL.fpsReport.push(rframes);
        rframes = 0;
        rframeStart = CABLES.now();
    }
    CGL.MESH.lastShader = null;
    CGL.MESH.lastMesh = null;

    cgl.renderStart(cgl, identTranslate, identTranslateView);

    if (clear.get())
    {
        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if (CGL.Texture.previewTexture)
    {
        if (!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer = new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    op.patch.cg = null;

    if (clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if (!cgl.frameStore.phong)cgl.frameStore.phong = {};
    rframes++;

    op.patch.cgl.profileData.profileMainloopMs = performance.now() - startTime;
}

function testMultiMainloop()
{
    clearTimeout(timeOutTest);
    timeOutTest = setTimeout(
        () =>
        {
            if (op.patch.getOpsByObjName(op.name).length > 1)
            {
                op.setUiError("multimainloop", "there should only be one mainloop op!");
                if (!addedListener)addedListener = op.patch.addEventListener("onOpDelete", testMultiMainloop);
            }
            else op.setUiError("multimainloop", null, 1);
        }, 500);
}


};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Trigger.Sequence
// 
// **************************************************************

Ops.Trigger.Sequence = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    exe = op.inTrigger("exe"),
    cleanup = op.inTriggerButton("Clean up connections");

op.setUiAttrib({ "resizable": true, "resizableY": false, "stretchPorts": true });
const
    exes = [],
    triggers = [],
    num = 16;

let
    updateTimeout = null,
    connectedOuts = [];

exe.onTriggered = triggerAll;
cleanup.onTriggered = clean;
cleanup.setUiAttribs({ "hideParam": true, "hidePort": true });

for (let i = 0; i < num; i++)
{
    const p = op.outTrigger("trigger " + i);
    triggers.push(p);
    p.onLinkChanged = updateButton;

    if (i < num - 1)
    {
        let newExe = op.inTrigger("exe " + i);
        newExe.onTriggered = triggerAll;
        exes.push(newExe);
    }
}

updateConnected();

function updateConnected()
{
    connectedOuts.length = 0;
    for (let i = 0; i < triggers.length; i++)
        if (triggers[i].links.length > 0) connectedOuts.push(triggers[i]);
}

function updateButton()
{
    updateConnected();
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() =>
    {
        let show = false;
        for (let i = 0; i < triggers.length; i++)
            if (triggers[i].links.length > 1) show = true;

        cleanup.setUiAttribs({ "hideParam": !show });

        if (op.isCurrentUiOp()) op.refreshParams();
    }, 60);
}

function triggerAll()
{
    // for (let i = 0; i < triggers.length; i++) triggers[i].trigger();
    for (let i = 0; i < connectedOuts.length; i++) connectedOuts[i].trigger();
}

function clean()
{
    let count = 0;
    for (let i = 0; i < triggers.length; i++)
    {
        let removeLinks = [];

        if (triggers[i].links.length > 1)
            for (let j = 1; j < triggers[i].links.length; j++)
            {
                while (triggers[count].links.length > 0) count++;

                removeLinks.push(triggers[i].links[j]);
                const otherPort = triggers[i].links[j].getOtherPort(triggers[i]);
                op.patch.link(op, "trigger " + count, otherPort.op, otherPort.name);
                count++;
            }

        for (let j = 0; j < removeLinks.length; j++) removeLinks[j].remove();
    }
    updateButton();
    updateConnected();
}


};

Ops.Trigger.Sequence.prototype = new CABLES.Op();
CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Trigger.Sequence,objName:"Ops.Trigger.Sequence"};




// **************************************************************
// 
// Ops.Devices.Mouse.Mouse_v3
// 
// **************************************************************

Ops.Devices.Mouse.Mouse_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inCoords = op.inSwitch("Coordinates", ["-1 to 1", "Pixel Display", "Pixel", "0 to 1"], "-1 to 1"),
    area = op.inValueSelect("Area", ["Canvas", "Document", "Parent Element", "Canvas Area"], "Canvas"),
    flipY = op.inValueBool("flip y", true),
    rightClickPrevDef = op.inBool("right click prevent default", true),
    touchscreen = op.inValueBool("Touch support", true),
    inPassive = op.inValueBool("Passive Events", false),
    active = op.inValueBool("Active", true),
    outMouseX = op.outNumber("x", 0),
    outMouseY = op.outNumber("y", 0),
    mouseClick = op.outTrigger("click"),
    mouseClickRight = op.outTrigger("click right"),
    mouseDown = op.outBoolNum("Button is down"),
    mouseOver = op.outBoolNum("Mouse is hovering"),
    outMovementX = op.outNumber("Movement X", 0),
    outMovementY = op.outNumber("Movement Y", 0);

const cgl = op.patch.cgl;
let normalize = 1;
let listenerElement = null;
let sizeElement = null;

inPassive.onChange =
area.onChange = addListeners;

inCoords.onChange = updateCoordNormalizing;
op.onDelete = removeListeners;

addListeners();

op.on("loadedValueSet", onStart);

function onStart()
{
    if (normalize == 0)
    {
        if (sizeElement.clientWidth === 0) setTimeout(onStart, 50);

        outMouseX.set(sizeElement.clientWidth / 2);
        outMouseY.set(sizeElement.clientHeight / 2);
    }
    else if (normalize == 1)
    {
        outMouseX.set(0);
        outMouseY.set(0);
    }
    else if (normalize == 2)
    {
        outMouseX.set(0.5);
        outMouseY.set(0.5);
    }
    else if (normalize == 3)
    {
        if (sizeElement.clientWidth === 0)
        {
            setTimeout(onStart, 50);
        }

        outMouseX.set(sizeElement.clientWidth / 2 / cgl.pixelDensity);
        outMouseY.set(sizeElement.clientHeight / 2 / cgl.pixelDensity);
    }
    else console.error("unknown normalize mouse", normalize);
}

function setValue(x, y)
{
    x = x || 0;
    y = y || 0;

    if (normalize == 0) // pixel
    {
        outMouseX.set(x);
        outMouseY.set(y);
    }
    else
    if (normalize == 3) // pixel css
    {
        outMouseX.set(x * cgl.pixelDensity);
        outMouseY.set(y * cgl.pixelDensity);
    }
    else
    {
        let w = sizeElement.clientWidth / cgl.pixelDensity;
        let h = sizeElement.clientHeight / cgl.pixelDensity;

        w = w || 1;
        h = h || 1;

        if (normalize == 1) // -1 to 1
        {
            let xx = (x / w * 2.0 - 1.0);
            let yy = (y / h * 2.0 - 1.0);
            xx = CABLES.clamp(xx, -1, 1);
            yy = CABLES.clamp(yy, -1, 1);

            outMouseX.set(xx);
            outMouseY.set(yy);
        }
        else if (normalize == 2) // 0 to 1
        {
            let xx = x / w;
            let yy = y / h;

            xx = CABLES.clamp(xx, 0, 1);
            yy = CABLES.clamp(yy, 0, 1);

            outMouseX.set(xx);
            outMouseY.set(yy);
        }
    }
}

function checkHovering(e)
{
    const r = sizeElement.getBoundingClientRect();

    return (
        e.clientX > r.left &&
        e.clientX < r.left + r.width &&
        e.clientY > r.top &&
        e.clientY < r.top + r.height
    );
}

touchscreen.onChange = function ()
{
    removeListeners();
    addListeners();
};

active.onChange = function ()
{
    if (listenerElement)removeListeners();
    if (active.get())addListeners();
};

function updateCoordNormalizing()
{
    if (inCoords.get() == "Pixel") normalize = 0;
    else if (inCoords.get() == "-1 to 1") normalize = 1;
    else if (inCoords.get() == "0 to 1") normalize = 2;
    else if (inCoords.get() == "Pixel Display") normalize = 3;
}

function onMouseEnter(e)
{
    mouseDown.set(false);
    mouseOver.set(checkHovering(e));
}

function onMouseDown(e)
{
    if (!checkHovering(e)) return;
    mouseDown.set(true);
}

function onMouseUp(e)
{
    mouseDown.set(false);
}

function onClickRight(e)
{
    if (!checkHovering(e)) return;
    mouseClickRight.trigger();
    if (rightClickPrevDef.get()) e.preventDefault();
}

function onmouseclick(e)
{
    if (!checkHovering(e)) return;
    mouseClick.trigger();
}

function onMouseLeave(e)
{
    mouseDown.set(false);
    mouseOver.set(checkHovering(e));
}

function setCoords(e)
{
    let x = e.clientX;
    let y = e.clientY;

    if (area.get() != "Document")
    {
        x = e.offsetX;
        y = e.offsetY;
    }
    if (area.get() === "Canvas Area")
    {
        const r = sizeElement.getBoundingClientRect();
        x = e.clientX - r.left;
        y = e.clientY - r.top;
    }

    if (flipY.get()) y = sizeElement.clientHeight - y;

    setValue(x / cgl.pixelDensity, y / cgl.pixelDensity);
}

function onmousemove(e)
{
    mouseOver.set(checkHovering(e));
    setCoords(e);

    outMovementX.set(e.movementX / cgl.pixelDensity);
    outMovementY.set(e.movementY / cgl.pixelDensity);
}

function ontouchmove(e)
{
    if (event.touches && event.touches.length > 0) setCoords(e.touches[0]);
}

function ontouchstart(event)
{
    mouseDown.set(true);

    if (event.touches && event.touches.length > 0) onMouseDown(event.touches[0]);
}

function ontouchend(event)
{
    mouseDown.set(false);
    onMouseUp();
}

function removeListeners()
{
    if (!listenerElement) return;
    listenerElement.removeEventListener("touchend", ontouchend);
    listenerElement.removeEventListener("touchstart", ontouchstart);
    listenerElement.removeEventListener("touchmove", ontouchmove);

    listenerElement.removeEventListener("click", onmouseclick);
    listenerElement.removeEventListener("mousemove", onmousemove);
    listenerElement.removeEventListener("mouseleave", onMouseLeave);
    listenerElement.removeEventListener("mousedown", onMouseDown);
    listenerElement.removeEventListener("mouseup", onMouseUp);
    listenerElement.removeEventListener("mouseenter", onMouseEnter);
    listenerElement.removeEventListener("contextmenu", onClickRight);
    listenerElement = null;
}

function addListeners()
{
    if (listenerElement || !active.get())removeListeners();
    if (!active.get()) return;

    listenerElement = sizeElement = cgl.canvas;
    if (area.get() == "Canvas Area")
    {
        sizeElement = cgl.canvas.parentElement;
        listenerElement = document.body;
    }
    if (area.get() == "Document") sizeElement = listenerElement = document.body;
    if (area.get() == "Parent Element") listenerElement = sizeElement = cgl.canvas.parentElement;

    let passive = false;
    if (inPassive.get())passive = { "passive": true };

    if (touchscreen.get())
    {
        listenerElement.addEventListener("touchend", ontouchend, passive);
        listenerElement.addEventListener("touchstart", ontouchstart, passive);
        listenerElement.addEventListener("touchmove", ontouchmove, passive);
    }

    listenerElement.addEventListener("mousemove", onmousemove, passive);
    listenerElement.addEventListener("mouseleave", onMouseLeave, passive);
    listenerElement.addEventListener("mousedown", onMouseDown, passive);
    listenerElement.addEventListener("mouseup", onMouseUp, passive);
    listenerElement.addEventListener("mouseenter", onMouseEnter, passive);
    listenerElement.addEventListener("contextmenu", onClickRight, passive);
    listenerElement.addEventListener("click", onmouseclick, passive);
}

//


};

Ops.Devices.Mouse.Mouse_v3.prototype = new CABLES.Op();
CABLES.OPS["6d1edbc0-088a-43d7-9156-918fb3d7f24b"]={f:Ops.Devices.Mouse.Mouse_v3,objName:"Ops.Devices.Mouse.Mouse_v3"};




// **************************************************************
// 
// Ops.Vars.VarSetNumber_v2
// 
// **************************************************************

Ops.Vars.VarSetNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const val = op.inValueFloat("Value", 0);
op.varName = op.inDropDown("Variable", [], "", true);

new CABLES.VarSetOpWrapper(op, "number", val, op.varName);


};

Ops.Vars.VarSetNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["b5249226-6095-4828-8a1c-080654e192fa"]={f:Ops.Vars.VarSetNumber_v2,objName:"Ops.Vars.VarSetNumber_v2"};




// **************************************************************
// 
// Ops.Math.DeltaSum
// 
// **************************************************************

Ops.Math.DeltaSum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inVal = op.inValue("Delta Value"),
    defVal = op.inValue("Default Value", 0),
    inMul = op.inValue("Multiply", 1),
    inReset = op.inTriggerButton("Reset"),
    inLimit = op.inValueBool("Limit", false),
    inMin = op.inValue("Min", 0),
    inMax = op.inValue("Max", 100),
    inRubber = op.inValue("Rubberband", 0),
    outVal = op.outNumber("Absolute Value");

inVal.changeAlways = true;

op.setPortGroup("Limit", [inLimit, inMin, inMax, inRubber]);

let value = 0;
let lastEvent = CABLES.now();
let rubTimeout = null;

inLimit.onChange = updateLimit;
defVal.onChange =
    inReset.onTriggered = resetValue;

inMax.onChange =
    inMin.onChange = updateValue;

updateLimit();

function resetValue()
{
    let v = defVal.get();

    if (inLimit.get())
    {
        v = Math.max(inMin.get(), v);
        v = Math.min(inMax.get(), v);
    }

    value = v;
    outVal.set(value);
}

function updateLimit()
{
    inMin.setUiAttribs({ "greyout": !inLimit.get() });
    inMax.setUiAttribs({ "greyout": !inLimit.get() });
    inRubber.setUiAttribs({ "greyout": !inLimit.get() });

    updateValue();
}

function releaseRubberband()
{
    const min = inMin.get();
    const max = inMax.get();

    if (value < min) value = min;
    if (value > max) value = max;

    outVal.set(value);
}

function updateValue()
{
    if (inLimit.get())
    {
        const min = inMin.get();
        const max = inMax.get();
        const rubber = inRubber.get();
        const minr = inMin.get() - rubber;
        const maxr = inMax.get() + rubber;

        if (value < minr) value = minr;
        if (value > maxr) value = maxr;

        if (rubber !== 0.0)
        {
            clearTimeout(rubTimeout);
            rubTimeout = setTimeout(releaseRubberband.bind(this), 300);
        }
    }

    outVal.set(value);
}

inVal.onChange = function ()
{
    let v = inVal.get();

    const rubber = inRubber.get();

    if (rubber !== 0.0)
    {
        const min = inMin.get();
        const max = inMax.get();
        const minr = inMin.get() - rubber;
        const maxr = inMax.get() + rubber;

        if (value < min)
        {
            const aa = Math.abs(value - minr) / rubber;
            v *= (aa * aa);
        }
        if (value > max)
        {
            const aa = Math.abs(maxr - value) / rubber;
            v *= (aa * aa);
        }
    }

    lastEvent = CABLES.now();
    value += v * inMul.get();
    updateValue();
};


};

Ops.Math.DeltaSum.prototype = new CABLES.Op();
CABLES.OPS["d9d4b3db-c24b-48da-b798-9e6230d861f7"]={f:Ops.Math.DeltaSum,objName:"Ops.Math.DeltaSum"};




// **************************************************************
// 
// Ops.Ui.PatchInput
// 
// **************************************************************

Ops.Ui.PatchInput = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const dyn = op.addOutPort(new CABLES.Port(op, "create port", CABLES.OP_PORT_TYPE_DYNAMIC));

function getPatchOp()
{
    for (let i in op.patch.ops)
    {
        if (op.patch.ops[i].patchId)
        {
            if (op.patch.ops[i].patchId.get() == op.uiAttribs.subPatch)
            {
                return op.patch.ops[i];
            }
        }
    }
}

dyn.onLinkChanged = () =>
{
    const mySubPatchOp = getPatchOp();

    if (!dyn.links.length || !mySubPatchOp || !mySubPatchOp.addNewInPort) return;


    const otherPort = dyn.links[0].getOtherPort(dyn);
    dyn.removeLinks();

    const newPortName = mySubPatchOp.addNewInPort(otherPort);

    const l = gui.scene().link(
        otherPort.parent,
        otherPort.getName(),
        op,
        newPortName);

    mySubPatchOp.saveData();
};


};

Ops.Ui.PatchInput.prototype = new CABLES.Op();
CABLES.OPS["e3f68bc3-892a-4c78-9974-aca25c27025d"]={f:Ops.Ui.PatchInput,objName:"Ops.Ui.PatchInput"};




// **************************************************************
// 
// Ops.Ui.PatchOutput
// 
// **************************************************************

Ops.Ui.PatchOutput = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const dyn = op.addInPort(new CABLES.Port(op, "create port", CABLES.OP_PORT_TYPE_DYNAMIC));

function getPatchOp()
{
    for (let i in op.patch.ops)
    {
        if (op.patch.ops[i].patchId)
        {
            if (op.patch.ops[i].patchId.get() == op.uiAttribs.subPatch)
            {
                return op.patch.ops[i];
            }
        }
    }
}

dyn.onLinkChanged = () =>
{
    const mySubPatchOp = getPatchOp();

    if (!dyn.links.length) return;

    const otherPort = dyn.links[0].getOtherPort(dyn);
    dyn.removeLinks();

    const newPortName = mySubPatchOp.addNewOutPort(otherPort);

    const l = gui.scene().link(
        otherPort.parent,
        otherPort.getName(),
        op,
        newPortName);

    mySubPatchOp.saveData();
};


};

Ops.Ui.PatchOutput.prototype = new CABLES.Op();
CABLES.OPS["851b44cb-5667-4140-9800-5aeb7031f1d7"]={f:Ops.Ui.PatchOutput,objName:"Ops.Ui.PatchOutput"};




// **************************************************************
// 
// Ops.Ui.SubPatch
// 
// **************************************************************

Ops.Ui.SubPatch = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
op.dyn = op.addInPort(new CABLES.Port(op, "create port", CABLES.OP_PORT_TYPE_DYNAMIC));
op.dynOut = op.addOutPort(new CABLES.Port(op, "create port out", CABLES.OP_PORT_TYPE_DYNAMIC));

const dataStr = op.addInPort(new CABLES.Port(op, "dataStr", CABLES.OP_PORT_TYPE_VALUE, { "display": "readonly" }));
op.patchId = op.addInPort(new CABLES.Port(op, "patchId", CABLES.OP_PORT_TYPE_VALUE, { "display": "readonly" }));


dataStr.setUiAttribs({ "hideParam": true });
op.patchId.setUiAttribs({ "hidePort": true });

let data = { "ports": [], "portsOut": [] };
let oldPatchId = CABLES.generateUUID();
op.patchId.set(oldPatchId);
getSubPatchInputOp();
getSubPatchOutputOp();

let dataLoaded = false;

op.saveData = saveData;

op.init = () =>
{
    op.setStorage({ "subPatchVer": 1 });
};

op.patchId.onChange = function ()
{
    if (!op.patch.isEditorMode()) return;
    const oldPatchOps = op.patch.getSubPatchOps(oldPatchId);
    if (oldPatchOps.length === 2)
    {
        if (op.patch.isEditorMode() && CABLES.UI.DEFAULTOPS.isInBlueprint(op)) CABLES.UI.undo.pause();
        for (let i = 0; i < oldPatchOps.length; i++)
        {
            op.patch.deleteOp(oldPatchOps[i].id);
        }
        if (op.patch.isEditorMode() && CABLES.UI.DEFAULTOPS.isInBlueprint(op)) CABLES.UI.undo.resume();
    }
};

op.onLoaded = function ()
{
};

op.onLoadedValueSet = function ()
{
    data = JSON.parse(dataStr.get());
    if (!data)
    {
        data = { "ports": [], "portsOut": [] };
    }
    setupPorts();
};

function loadData()
{
}

dataStr.onChange = function ()
{
    if (dataLoaded) return;

    if (!dataStr.get()) return;
    try
    {
        loadData();
    }
    catch (e)
    {
        op.logError("cannot load subpatch data...");
        op.logError(e);
    }
};

function saveData()
{
    try
    {
        dataStr.set(JSON.stringify(data));
    }
    catch (e)
    {
        op.log(e);
    }
}

op.addPortListener = addPortListener;
function addPortListener(newPort, newPortInPatch)
{
    if (!newPort.hasSubpatchLstener)
    {
        newPort.hasSubpatchLstener = true;
        newPort.addEventListener("onUiAttrChange", function (attribs)
        {
            if (attribs.title)
            {
                let i = 0;
                for (i = 0; i < data.portsOut.length; i++)
                    if (data.portsOut[i].name == newPort.name)
                        data.portsOut[i].title = attribs.title;

                for (i = 0; i < data.ports.length; i++)
                    if (data.ports[i].name == newPort.name)
                        data.ports[i].title = attribs.title;

                saveData();
            }
        });
    }

    if (newPort.direction == CABLES.PORT_DIR_IN)
    {
        if (newPort.type == CABLES.OP_PORT_TYPE_FUNCTION)
        {
            newPort.onTriggered = function ()
            {
                if (newPortInPatch.isLinked())
                    newPortInPatch.trigger();
            };
        }
        else
        {
            newPort.onChange = function ()
            {
                newPortInPatch.set(newPort.get());
                if (!newPort.isLinked())
                {
                    for (let i = 0; i < data.ports.length; i++)
                    {
                        if (data.ports[i].name === newPort.name)
                        {
                            data.ports[i].value = newPort.get();
                        }
                    }
                    saveData();
                }
            };
        }
    }
}

op.setupPorts = setupPorts;
function setupPorts()
{
    if (!op.patchId.get()) return;
    const ports = data.ports || [];
    const portsOut = data.portsOut || [];
    let i = 0;

    for (i = 0; i < ports.length; i++)
    {
        if (!op.getPortByName(ports[i].name))
        {
            const newPort = op.addInPort(new CABLES.Port(op, ports[i].name, ports[i].type));

            const patchInputOp = getSubPatchInputOp();
            const newPortInPatch = patchInputOp.addOutPort(new CABLES.Port(patchInputOp, ports[i].name, ports[i].type));

            newPort.ignoreValueSerialize = true;
            newPort.setUiAttribs({ "editableTitle": true });
            if (ports[i].title)
            {
                newPort.setUiAttribs({ "title": ports[i].title });
                newPortInPatch.setUiAttribs({ "title": ports[i].title });
            }
            if (ports[i].objType)
            {
                newPort.setUiAttribs({ "objType": ports[i].objType });
                newPortInPatch.setUiAttribs({ "objType": ports[i].objType });
            }
            if (ports[i].value)
            {
                newPort.set(ports[i].value);
                newPortInPatch.set(ports[i].value);
            }
            addPortListener(newPort, newPortInPatch);
        }
    }

    for (i = 0; i < portsOut.length; i++)
    {
        if (!op.getPortByName(portsOut[i].name))
        {
            const newPortOut = op.addOutPort(new CABLES.Port(op, portsOut[i].name, portsOut[i].type));
            const patchOutputOp = getSubPatchOutputOp();
            const newPortOutPatch = patchOutputOp.addInPort(new CABLES.Port(patchOutputOp, portsOut[i].name, portsOut[i].type));

            newPortOut.ignoreValueSerialize = true;
            newPortOut.setUiAttribs({ "editableTitle": true });

            if (portsOut[i].title)
            {
                newPortOut.setUiAttribs({ "title": portsOut[i].title });
                newPortOutPatch.setUiAttribs({ "title": portsOut[i].title });
            }
            if (portsOut[i].objType)
            {
                newPortOut.setUiAttribs({ "objType": portsOut[i].objType });
                newPortOutPatch.setUiAttribs({ "objType": portsOut[i].objType });
            }

            // addPortListener(newPortOut,newPortOutPatch);
            addPortListener(newPortOutPatch, newPortOut);
        }
    }

    dataLoaded = true;
}

op.addNewInPort = function (otherPort, type, objType)
{
    const newName = "in" + data.ports.length + " " + otherPort.op.name + " " + otherPort.name;

    const o = { "name": newName, "type": otherPort.type };
    if (otherPort.uiAttribs.objType)o.objType = otherPort.uiAttribs.objType;

    data.ports.push(o);
    setupPorts();
    return newName;
};

op.dyn.onLinkChanged = function ()
{
    if (op.dyn.isLinked())
    {
        const otherPort = op.dyn.links[0].getOtherPort(op.dyn);
        op.dyn.removeLinks();
        otherPort.removeLinkTo(op.dyn);

        op.log("dyn link changed!!!");

        // const newName = "in" + data.ports.length + " " + otherPort.op.name + " " + otherPort.name;

        // const o = { "name": newName, "type": otherPort.type };
        // if (otherPort.uiAttribs.objType)o.objType = otherPort.uiAttribs.objType;
        // data.ports.push(o);

        // setupPorts();

        const newName = op.addNewInPort(otherPort);

        const l = gui.scene().link(
            otherPort.op,
            otherPort.getName(),
            op,
            newName
        );

        dataLoaded = true;
        saveData();
    }
    else
    {
        setTimeout(function ()
        {
            op.dyn.removeLinks();
        }, 100);
    }
};

op.addNewOutPort = function (otherPort, type, objType)
{
    const newName = "out" + data.portsOut.length + " " + otherPort.op.name + " " + otherPort.name;

    const o = { "name": newName, "type": otherPort.type };
    if (otherPort.uiAttribs.objType)o.objType = otherPort.uiAttribs.objType;

    data.portsOut.push(o);
    setupPorts();
    return newName;
};

op.dynOut.onLinkChanged = function ()
{
    if (op.dynOut.isLinked())
    {
        const otherPort = op.dynOut.links[0].getOtherPort(op.dynOut);
        op.dynOut.removeLinks();
        if (otherPort)
        {
            otherPort.removeLinkTo(op.dynOut);

            const newName = op.addNewOutPort(otherPort);

            gui.scene().link(
                otherPort.op,
                otherPort.getName(),
                op,
                newName
            );
        }

        dataLoaded = true;
        saveData();
    }
    else
    {
        setTimeout(function ()
        {
            op.dynOut.removeLinks();
        }, 100);

        op.log("dynOut unlinked...");
    }
};

function getSubPatchOutputOp()
{
    let patchOutputOP = op.patch.getSubPatchOp(op.patchId.get(), "Ops.Ui.PatchOutput");

    if (!patchOutputOP)
    {
        op.patch.addOp("Ops.Ui.PatchOutput", { "subPatch": op.patchId.get(), "translate": { "x": 0, "y": 0 } });
        patchOutputOP = op.patch.getSubPatchOp(op.patchId.get(), "Ops.Ui.PatchOutput");
        if (!patchOutputOP) op.warn("no patchoutput!");
    }
    return patchOutputOP;
}

function getSubPatchInputOp()
{
    let patchInputOP = op.patch.getSubPatchOp(op.patchId.get(), "Ops.Ui.PatchInput");

    if (!patchInputOP)
    {
        op.patch.addOp("Ops.Ui.PatchInput", { "subPatch": op.patchId.get(), "translate": { "x": 0, "y": 0 } });
        patchInputOP = op.patch.getSubPatchOp(op.patchId.get(), "Ops.Ui.PatchInput");
        if (!patchInputOP) op.warn("no patchinput2!");
    }

    return patchInputOP;
}

op.addSubLink = function (p, p2)
{
    const num = data.ports.length;
    const sublPortname = "in" + (num - 1) + " " + p2.op.name + " " + p2.name;

    if (p.direction == CABLES.PORT_DIR_IN)
    {
        gui.scene().link(
            p.op,
            p.getName(),
            getSubPatchInputOp(),
            sublPortname
        );
    }
    else
    {
        const numOut = data.portsOut.length;
        gui.scene().link(
            p.op,
            p.getName(),
            getSubPatchOutputOp(),
            "out" + (numOut - 1) + " " + p2.op.name + " " + p2.name
        );
    }

    const bounds = gui.patchView.getSubPatchBounds(op.patchId.get());

    getSubPatchInputOp().uiAttr(
        {
            "translate":
            {
                "x": bounds.minx,
                "y": bounds.miny - 100
            }
        });

    getSubPatchOutputOp().uiAttr(
        {
            "translate":
            {
                "x": bounds.minx,
                "y": bounds.maxy + 100
            }
        });
    saveData();
    return sublPortname;
};

op.onDelete = function ()
{
    for (let i = op.patch.ops.length - 1; i >= 0; i--)
        if (op.patch.ops[i] && op.patch.ops[i].uiAttribs && op.patch.ops[i].uiAttribs.subPatch == op.patchId.get())
            op.patch.deleteOp(op.patch.ops[i].id);
};

op.rebuildListeners = () =>
{
    op.log("rebuild listeners...");

    const outop = getSubPatchOutputOp();
    for (let i = 0; i < outop.portsIn.length; i++)
    {
        if (outop.portsIn[i].isLinked())
        {
            addPortListener(outop.portsIn[i], this.portsOut[i]);
        }
    }
};


};

Ops.Ui.SubPatch.prototype = new CABLES.Op();
CABLES.OPS["84d9a6f0-ed7a-466d-b386-225ed9e89c60"]={f:Ops.Ui.SubPatch,objName:"Ops.Ui.SubPatch"};




// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    posX = op.inValue("posX", 0),
    posY = op.inValue("posY", 0),
    posZ = op.inValue("posZ", 0),
    scale = op.inValue("scale", 1),
    rotX = op.inValue("rotX", 0),
    rotY = op.inValue("rotY", 0),
    rotZ = op.inValue("rotZ", 0),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Rotation", [rotX, rotY, rotZ]);
op.setPortGroup("Position", [posX, posY, posZ]);
op.setPortGroup("Scale", [scale]);
op.setUiAxisPorts(posX, posY, posZ);

op.toWorkPortsNeedToBeLinked(render, trigger);

const vPos = vec3.create();
const vScale = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

let
    doScale = false,
    doTranslate = false,
    translationChanged = true,
    scaleChanged = true,
    rotChanged = true;

rotX.onChange = rotY.onChange = rotZ.onChange = setRotChanged;
posX.onChange = posY.onChange = posZ.onChange = setTranslateChanged;
scale.onChange = setScaleChanged;

render.onTriggered = function ()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    let updateMatrix = false;
    if (translationChanged)
    {
        updateTranslation();
        updateMatrix = true;
    }
    if (scaleChanged)
    {
        updateScale();
        updateMatrix = true;
    }
    if (rotChanged) updateMatrix = true;

    if (updateMatrix) doUpdateMatrix();

    const cg = op.patch.cg || op.patch.cgl;
    cg.pushModelMatrix();
    mat4.multiply(cg.mMatrix, cg.mMatrix, transMatrix);

    trigger.trigger();
    cg.popModelMatrix();

    if (CABLES.UI)
    {
        if (!posX.isLinked() && !posY.isLinked() && !posZ.isLinked())
        {
            gui.setTransform(op.id, posX.get(), posY.get(), posZ.get());

            if (op.isCurrentUiOp())
                gui.setTransformGizmo(
                    {
                        "posX": posX,
                        "posY": posY,
                        "posZ": posZ,
                    });
        }
    }
};

// op.transform3d = function ()
// {
//     return { "pos": [posX, posY, posZ] };
// };

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if (doTranslate)mat4.translate(transMatrix, transMatrix, vPos);

    if (rotX.get() !== 0)mat4.rotateX(transMatrix, transMatrix, rotX.get() * CGL.DEG2RAD);
    if (rotY.get() !== 0)mat4.rotateY(transMatrix, transMatrix, rotY.get() * CGL.DEG2RAD);
    if (rotZ.get() !== 0)mat4.rotateZ(transMatrix, transMatrix, rotZ.get() * CGL.DEG2RAD);

    if (doScale)mat4.scale(transMatrix, transMatrix, vScale);
    rotChanged = false;
}

function updateTranslation()
{
    doTranslate = false;
    if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0) doTranslate = true;
    vec3.set(vPos, posX.get(), posY.get(), posZ.get());
    translationChanged = false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale = true;
    vec3.set(vScale, scale.get(), scale.get(), scale.get());
    scaleChanged = false;
}

function setTranslateChanged()
{
    translationChanged = true;
}

function setScaleChanged()
{
    scaleChanged = true;
}

function setRotChanged()
{
    rotChanged = true;
}

doUpdateMatrix();


};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();
CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Gl.Matrix.Transform,objName:"Ops.Gl.Matrix.Transform"};




// **************************************************************
// 
// Ops.Gl.ClearColor
// 
// **************************************************************

Ops.Gl.ClearColor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    r = op.inFloatSlider("r", 0.1),
    g = op.inFloatSlider("g", 0.1),
    b = op.inFloatSlider("b", 0.1),
    a = op.inFloatSlider("a", 1);

r.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;

render.onTriggered = function ()
{
    cgl.gl.clearColor(r.get(), g.get(), b.get(), a.get());
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    trigger.trigger();
};


};

Ops.Gl.ClearColor.prototype = new CABLES.Op();
CABLES.OPS["19b441eb-9f63-4f35-ba08-b87841517c4d"]={f:Ops.Gl.ClearColor,objName:"Ops.Gl.ClearColor"};




// **************************************************************
// 
// Ops.Gl.Shader.AttributeAsColorMaterial
// 
// **************************************************************

Ops.Gl.Shader.AttributeAsColorMaterial = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"normalsmaterial_frag":"IN vec3 normal;\nIN vec3 outTangent;\nIN vec3 outBiTangent;\nIN vec4 outPosition;\nIN mat4 mMatrix;\nIN vec2 texCoord;\nIN vec2 texCoord1;\nIN vec3 vert;\nIN mat4 mvMatrix;\n\n\n{{MODULES_HEAD}}\n\nvoid main()\n{\n    #ifdef MULMODEL\n        vec4 attr;\n        attr.w=1.0;\n    #endif\n    #ifndef MULMODEL\n        vec3 attr;\n    #endif\n\n    #ifdef SHOW_NORMALS\n        attr.xyz=normal;\n    #endif\n    #ifdef SHOW_BITANGENTS\n        attr.xyz=outBiTangent;\n    #endif\n    #ifdef SHOW_TANGENTS\n        attr.xyz=outTangent;\n    #endif\n    #ifdef SHOW_TEXCOORDS\n        attr.xy=texCoord;\n    #endif\n    #ifdef SHOW_TEXCOORDS1\n        attr.xy=texCoord1;\n    #endif\n    #ifdef SHOW_POS\n        attr.xyz=outPosition.xyz;\n    #endif\n\n    #ifdef MULMODEL\n        attr*=mMatrix;\n        attr.xyz=normalize(vec3(attr.x,attr.y,attr.z));\n    #endif\n\n    vec4 col=vec4(attr.x,attr.y,attr.z,1.0);\n\n    #ifdef ABS\n        col=abs(col);\n    #endif\n\n    {{MODULE_COLOR}}\n\n    outColor=col;\n}","normalsmaterial_vert":"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec2 attrTexCoord1;\nIN float attrVertIndex;\nIN vec3 attrVertNormal,attrTangent,attrBiTangent;\nOUT vec2 texCoord;\nOUT vec2 texCoord1;\nOUT vec3 normal;\nOUT vec3 tangent;\nOUT vec3 bitangent;\nOUT vec3 outTangent,outBiTangent;\nOUT vec4 outPosition;\nOUT mat4 mMatrix;\nOUT vec3 vert;\nOUT mat4 mvMatrix;\nUNI mat4 projMatrix;\n\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n\n{{MODULES_HEAD}}\n\nvoid main()\n{\n    texCoord=attrTexCoord;\n    texCoord1=attrTexCoord1;\n    vec3 norm=attrVertNormal;\n    tangent=attrTangent;\n    bitangent=attrBiTangent;\n\n    vec4 pos=vec4(vPosition,1.0);\n    mMatrix=modelMatrix;\n\n    {{MODULE_VERTEX_POSITION}}\n\n    mat4 modelViewMatrix=viewMatrix*mMatrix;\n\n    vert=pos.xyz;\n    normal=norm;\n    outTangent=tangent;\n    outBiTangent=bitangent;\n    outPosition= mMatrix * pos;\n\n    {{MODULE_VERTEX_MODELVIEW}}\n\n    gl_Position = projMatrix*viewMatrix*outPosition;\n}\n",};
const
    render = op.inTrigger("render"),
    inAttr = op.inSwitch("Attribute", ["Position", "TexCoords", "TexCoords 1", "Normals", "Tangents", "BiTangents"], "Normals"),
    inAbs = op.inBool("Absolute", false),
    inMulModel = op.inBool("World Space", false),
    trigger = op.outTrigger("trigger"),
    outShader = op.outObject("Shader");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name, op);

shader.setSource(attachments.normalsmaterial_vert, attachments.normalsmaterial_frag);
outShader.set(shader);
render.onTriggered = doRender;
updateAttr();
inMulModel.onChange = inAbs.onChange = inAttr.onChange = updateAttr;

function updateAttr()
{
    shader.toggleDefine("SHOW_POS", inAttr.get() == "Position");
    shader.toggleDefine("SHOW_NORMALS", inAttr.get() == "Normals");
    shader.toggleDefine("SHOW_TANGENTS", inAttr.get() == "Tangents");
    shader.toggleDefine("SHOW_BITANGENTS", inAttr.get() == "BiTangents");
    shader.toggleDefine("SHOW_TEXCOORDS", inAttr.get() == "TexCoords");
    shader.toggleDefine("SHOW_TEXCOORDS1", inAttr.get() == "TexCoords 1");

    shader.toggleDefine("ABS", inAbs.get());
    shader.toggleDefine("MULMODEL", inMulModel.get());
}

function doRender()
{
    cgl.pushShader(shader);
    trigger.trigger();
    cgl.popShader();
}


};

Ops.Gl.Shader.AttributeAsColorMaterial.prototype = new CABLES.Op();
CABLES.OPS["2963fd23-a860-461a-a3cf-394b8261159f"]={f:Ops.Gl.Shader.AttributeAsColorMaterial,objName:"Ops.Gl.Shader.AttributeAsColorMaterial"};




// **************************************************************
// 
// Ops.Trigger.TriggerSend
// 
// **************************************************************

Ops.Trigger.TriggerSend = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const trigger = op.inTriggerButton("Trigger");
op.varName = op.inValueSelect("Named Trigger", [], "", true);

op.varName.onChange = updateName;

trigger.onTriggered = doTrigger;

op.patch.addEventListener("namedTriggersChanged", updateVarNamesDropdown);

updateVarNamesDropdown();

function updateVarNamesDropdown()
{
    if (CABLES.UI)
    {
        let varnames = [];
        const vars = op.patch.namedTriggers;
        varnames.push("+ create new one");
        for (const i in vars) varnames.push(i);
        varnames = varnames.sort();
        op.varName.uiAttribs.values = varnames;
    }
}

function updateName()
{
    if (CABLES.UI)
    {
        if (op.varName.get() == "+ create new one")
        {
            new CABLES.UI.ModalDialog({
                "prompt": true,
                "title": "New Trigger",
                "text": "Enter a name for the new trigger",
                "promptValue": "",
                "promptOk": (str) =>
                {
                    op.varName.set(str);
                    op.patch.namedTriggers[str] = op.patch.namedTriggers[str] || [];
                    updateVarNamesDropdown();
                }
            });
            return;
        }

        op.refreshParams();
    }

    if (!op.patch.namedTriggers[op.varName.get()])
    {
        op.patch.namedTriggers[op.varName.get()] = op.patch.namedTriggers[op.varName.get()] || [];
        op.patch.emitEvent("namedTriggersChanged");
    }

    op.setTitle(">" + op.varName.get());

    op.refreshParams();
    op.patch.emitEvent("opTriggerNameChanged", op, op.varName.get());
}

function doTrigger()
{
    const arr = op.patch.namedTriggers[op.varName.get()];
    // fire an event even if noone is receiving this trigger
    // this way TriggerReceiveFilter can still handle it
    op.patch.emitEvent("namedTriggerSent", op.varName.get());

    if (!arr)
    {
        op.setUiError("unknowntrigger", "unknown trigger");
        return;
    }
    else op.setUiError("unknowntrigger", null);

    for (let i = 0; i < arr.length; i++)
    {
        arr[i]();
    }
}


};

Ops.Trigger.TriggerSend.prototype = new CABLES.Op();
CABLES.OPS["ce1eaf2b-943b-4dc0-ab5e-ee11b63c9ed0"]={f:Ops.Trigger.TriggerSend,objName:"Ops.Trigger.TriggerSend"};




// **************************************************************
// 
// Ops.Ui.Area
// 
// **************************************************************

Ops.Ui.Area = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inTitle = op.inString("Title", ""),
    inDelete = op.inTriggerButton("Delete");

inTitle.setUiAttribs({ "hidePort": true });

op.setUiAttrib({ "hasArea": true });

op.init =
    inTitle.onChange =
    op.onLoaded = update;

update();

function update()
{
    if (CABLES.UI)
    {
        gui.savedState.setUnSaved("areaOp", op.getSubPatch());
        op.uiAttr(
            {
                "comment_title": inTitle.get() || " "
            });

        op.name = inTitle.get();
    }
}

inDelete.onTriggered = () =>
{
    op.patch.deleteOp(op.id);
};


};

Ops.Ui.Area.prototype = new CABLES.Op();
CABLES.OPS["38f79614-b0de-4960-8da5-2827e7f43415"]={f:Ops.Ui.Area,objName:"Ops.Ui.Area"};




// **************************************************************
// 
// Ops.Vars.VarGetNumber_v2
// 
// **************************************************************

Ops.Vars.VarGetNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const val = op.outNumber("Value");
op.varName = op.inValueSelect("Variable", [], "", true);

new CABLES.VarGetOpWrapper(op, "number", op.varName, val);


};

Ops.Vars.VarGetNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["421f5b52-c0fa-47c4-8b7a-012b9e1c864a"]={f:Ops.Vars.VarGetNumber_v2,objName:"Ops.Vars.VarGetNumber_v2"};




// **************************************************************
// 
// Ops.Graphics.Intersection.IntersectWorld
// 
// **************************************************************

Ops.Graphics.Intersection.IntersectWorld = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    trigger = op.inTrigger("Trigger"),
    inTextCol = op.inBool("Check Body Collisions", false),
    next = op.outTrigger("Next"),
    outNum = op.outNumber("Total Bodies"),
    outCollisions = op.outArray("Collisions", []);

trigger.onTriggered = doRender;

const SHAPE_SPHERE = 1;
const SHAPE_AABB = 2;
const SHAPE_POINT = 3;

const cgl = op.patch.cgl;

function doRender()
{
    cgl.frameStore.collisionWorld = { "bodies": [], "testCollision": testCollision };
    next.trigger();

    outNum.set(cgl.frameStore.collisionWorld.bodies.length);

    if (inTextCol.get()) checkCollisions();

    // if (render.get())renderBodies();
}

function testCollision(bodyA, bodyB)
{
    if (bodyA.type === SHAPE_SPHERE && bodyB.type === SHAPE_SPHERE)
    {
        const dist = vec3.distance(bodyA.pos, bodyB.pos);

        if (dist < bodyA.radius + bodyB.radius)
        {
            return {
                "body0": bodyA,
                "name0": bodyA.name,
                "body1": bodyB,
                "name1": bodyB.name
            };
        }
    }
    else
    if (bodyA.type === SHAPE_POINT && bodyB.type === SHAPE_POINT)
    {
        if (bodyA.pos[0] === bodyB.pos[0] && bodyA.pos[1] === bodyB.pos[1] && bodyA.pos[2] === bodyB.pos[2])
        {
            return {
                "body0": bodyA,
                "name0": bodyA.name,
                "body1": bodyB,
                "name1": bodyB.name
            };
        }
    }
    else
    if (
        (bodyB.type === SHAPE_SPHERE && bodyA.type === SHAPE_POINT) ||
                    (bodyA.type === SHAPE_SPHERE && bodyB.type === SHAPE_POINT)
    )
    {
        let bodyPoint = bodyA;
        let bodySphere = bodyB;

        if (bodyA.type === SHAPE_SPHERE)
        {
            bodyPoint = bodyB;
            bodySphere = bodyA;
        }

        const xd = Math.abs(bodyPoint.pos[0] - bodySphere.pos[0]);
        const yd = Math.abs(bodyPoint.pos[1] - bodySphere.pos[1]);
        const zd = Math.abs(bodyPoint.pos[2] - bodySphere.pos[2]);
        const dist = Math.sqrt(xd * xd + yd * yd + zd * zd);

        if (dist < bodySphere.radius)
        {
            return {
                "body0": bodyA,
                "name0": bodyA.name,
                "body1": bodyB,
                "name1": bodyB.name };
        }
    }
    else
    if (
        (bodyB.type === SHAPE_AABB && bodyA.type === SHAPE_POINT) ||
                    (bodyA.type === SHAPE_AABB && bodyB.type === SHAPE_POINT)
    )
    {
        let bodyPoint = bodyA;
        let bodyBox = bodyB;

        if (bodyA.type === SHAPE_AABB)
        {
            bodyPoint = bodyB;
            bodyBox = bodyA;
        }

        if (
            (bodyPoint.pos[0] > bodyBox.minX && bodyPoint.pos[0] < bodyBox.maxX) &&
            (bodyPoint.pos[1] > bodyBox.minY && bodyPoint.pos[1] < bodyBox.maxY) &&
            (bodyPoint.pos[2] > bodyBox.minZ && bodyPoint.pos[2] < bodyBox.maxZ)
        )
        {
            return {
                "body0": bodyA,
                "name0": bodyA.name,
                "body1": bodyB,
                "name1": bodyB.name };
        }
    }
    else
    if ((bodyA.type === SHAPE_SPHERE && bodyB.type === SHAPE_AABB) || (bodyA.type === SHAPE_AABB && bodyB.type === SHAPE_SPHERE))
    {
        let bBox = bodyA;
        let bSphere = bodyB;
        if (bodyB.type === SHAPE_AABB)
        {
            bBox = bodyB;
            bSphere = bodyA;
        }

        let r2 = bSphere.radius * bSphere.radius;
        let dmin = 0;

        let dist_squared = bSphere.radius * bSphere.radius;
        /* assume bBox.minand C2 are element-wise sorted, if not, do that now */
        if (bSphere.pos[0] < bBox.minX) dist_squared -= (bSphere.pos[0] - bBox.minX) ** 2;
        else if (bSphere.pos[0] > bBox.maxX) dist_squared -= (bSphere.pos[0] - bBox.maxX) ** 2;
        if (bSphere.pos[1] < bBox.minY) dist_squared -= (bSphere.pos[1] - bBox.minY) ** 2;
        else if (bSphere.pos[1] > bBox.maxY) dist_squared -= (bSphere.pos[1] - bBox.maxY) ** 2;
        if (bSphere.pos[2] < bBox.minZ) dist_squared -= (bSphere.pos[2] - bBox.minZ) ** 2;
        else if (bSphere.pos[2] > bBox.maxZ) dist_squared -= (bSphere.pos[2] - bBox.maxZ) ** 2;

        if (dist_squared > 0)
        {
            return {
                "body0": bodyA,
                "name0": bodyA.name,
                "body1": bodyB,
                "name1": bodyB.name
            };
        }
    }
    else
    {
        console.warn("unknown collision pair...", bodyA.type, bodyB.type);
    }
}

function checkCollisions()
{
    const collisions = [];
    const bodies = cgl.frameStore.collisionWorld.bodies;

    for (let j = 0; j < bodies.length; j++)
    {
        for (let i = j + 1; i < bodies.length; i++)
        {
            if (i != j)
            {
                const c = testCollision(bodies[i], bodies[j]);
                if (c)collisions.push(c);
            }
        }
    }
    outCollisions.setRef(collisions, []);
}


};

Ops.Graphics.Intersection.IntersectWorld.prototype = new CABLES.Op();
CABLES.OPS["6ebdec23-6e10-48c9-87cf-43d488e4290f"]={f:Ops.Graphics.Intersection.IntersectWorld,objName:"Ops.Graphics.Intersection.IntersectWorld"};




// **************************************************************
// 
// Ops.Graphics.Intersection.IntersectTestRaycast
// 
// **************************************************************

Ops.Graphics.Intersection.IntersectTestRaycast = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    trigger = op.inTrigger("Trigger"),
    inCoords = op.inSwitch("Coordinate Format", ["-1 to 1", "XYZ-XYZ"], "-1 to 1"),
    inX = op.inValueFloat("X"),
    inY = op.inValueFloat("Y"),

    inZ = op.inValueFloat("Z"),

    inToX = op.inValueFloat("To X"),
    inToY = op.inValueFloat("To Y"),
    inToZ = op.inValueFloat("To Z"),

    active = op.inBool("Active", true),
    inCursor = op.inBool("Change Cursor", true),
    next = op.outTrigger("Next"),
    outHasHit = op.outBoolNum("Has Hit", false),
    outName = op.outString("Hit Body Name", ""),
    outX = op.outNumber("Hit X"),
    outY = op.outNumber("Hit Y"),
    outZ = op.outNumber("Hit Z");

const cgl = op.patch.cgl;
const oc = vec3.create();
const mat = mat4.create();
const dir = vec3.create();
let didsetCursor = false;
let isScreenCoords = true;

op.toWorkPortsNeedToBeLinked(trigger);

trigger.onTriggered = doRender;

inCoords.onChange = updateUi;
updateUi();

function updateUi()
{
    inZ.setUiAttribs({ "greyout": inCoords.get() != "XYZ-XYZ" });

    inToX.setUiAttribs({ "greyout": inCoords.get() != "XYZ-XYZ" });
    inToY.setUiAttribs({ "greyout": inCoords.get() != "XYZ-XYZ" });
    inToZ.setUiAttribs({ "greyout": inCoords.get() != "XYZ-XYZ" });
}

function doRender()
{
    next.trigger();

    if (cgl.frameStore.collisionWorld)
    {
        let origin = vec3.create();

        if (inCoords.get() == "-1 to 1")
        {
            origin = vec3.fromValues(inX.get(), inY.get(), -1);
            mat4.mul(mat, cgl.pMatrix, cgl.vMatrix);
            mat4.invert(mat, mat);
            vec3.transformMat4(origin, origin, mat);
        }

        if (inCoords.get() == "XYZ-XYZ")
        {
            origin = vec3.fromValues(inX.get(), inY.get(), inZ.get());
        }

        // -----------

        let to = vec3.create();

        if (inCoords.get() == "-1 to 1")
        {
            to = vec3.fromValues(inX.get(), inY.get(), 1);
            mat4.mul(mat, cgl.pMatrix, cgl.vMatrix);
            mat4.invert(mat, mat);
            vec3.transformMat4(to, to, mat);
        }

        if (inCoords.get() == "XYZ-XYZ")
        {
            to = vec3.fromValues(inToX.get(), inToY.get(), inToZ.get());
        }

        vec3.sub(dir, to, origin);
        vec3.normalize(dir, dir);
        const a = vec3.dot(dir, dir);

        let foundDist = 9999999;

        let found = false;
        const bodies = cgl.frameStore.collisionWorld.bodies;
        for (let i = 0; i < bodies.length; i++)
        {
            // if (found) break;

            const body = bodies[i];
            if (body.type == 1) // sphere
            {
                vec3.sub(oc, origin, body.pos);
                const b = 2 * vec3.dot(oc, dir);
                const c = vec3.dot(oc, oc) - (body.radius * body.radius);
                const discriminant = b * b - 4 * a * c;

                if (discriminant > 0)
                {
                    const dist = (-b - Math.sqrt(discriminant)) / (2 + a);
                    if (dist < foundDist)
                    {
                        found = true;
                        outName.set(body.name);
                        outHasHit.set(true);

                        foundDist = dist;

                        vec3.mul(oc, dir, [dist, dist, dist]);
                        vec3.add(oc, oc, origin);

                        outX.set(oc[0]);
                        outY.set(oc[1]);
                        outZ.set(oc[2]);
                    }
                }
            }
            else if (body.type == 2) // aabb
            {
                const t1 = (body.minX - origin[0]) / dir[0];
                const t2 = (body.maxX - origin[0]) / dir[0];

                const t3 = (body.minY - origin[1]) / dir[1];
                const t4 = (body.maxY - origin[1]) / dir[1];

                const t5 = (body.minZ - origin[2]) / dir[2];
                const t6 = (body.maxZ - origin[2]) / dir[2];

                const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
                const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

                // // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
                if (tmax < 0) continue;

                // if tmin > tmax, ray doesn't intersect AABB
                if (tmin > tmax) continue;

                found = true;
                outName.set(body.name);
                outHasHit.set(true);

                vec3.mul(oc, dir, [tmin, tmin, tmin]);
                vec3.add(oc, oc, origin);

                outX.set(oc[0]);
                outY.set(oc[1]);
                outZ.set(oc[2]);
            }
        }

        if (!found)
        {
            outName.set("");
            outHasHit.set(false);
            outX.set(0);
            outY.set(0);
            outZ.set(0);
        }
    }
}


};

Ops.Graphics.Intersection.IntersectTestRaycast.prototype = new CABLES.Op();
CABLES.OPS["dd5d9b39-75c2-40b1-98a4-7a0fdafdb5cb"]={f:Ops.Graphics.Intersection.IntersectTestRaycast,objName:"Ops.Graphics.Intersection.IntersectTestRaycast"};




// **************************************************************
// 
// Ops.Graphics.Intersection.IntersectBody
// 
// **************************************************************

Ops.Graphics.Intersection.IntersectBody = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    shapes = ["Sphere", "BoxAA", "Point"],
    trigger = op.inTrigger("Trigger"),
    inArea = op.inSwitch("Shape", shapes, "Sphere"),
    inName = op.inString("Name", ""),
    inRadius = op.inFloat("Radius", 0.5),
    inSizeX = op.inFloat("Size X", 1),
    inSizeY = op.inFloat("Size Y", 1),
    inSizeZ = op.inFloat("Size Z", 1),
    inPositions = op.inArray("Positions", null, 3),
    inPosIndex = op.inBool("Append Index to name", true),
    next = op.outTrigger("Next");

op.setPortGroup("Array", [inPositions, inPosIndex]);

const cgl = op.patch.cgl;
const pos = vec3.create();
const empty = vec3.create();

updateUi();

let objs = [];
let obj =
{
    "name": "???",
    "type": 1,
};

trigger.onTriggered = render;

function getCopyObj()
{
    return { "name": obj.name, "type": obj.type };
}

inArea.onChange = () =>
{
    obj.type = shapes.indexOf(inArea.get()) + 1;
    updateUi();
};

function updateUi()
{
    inRadius.setUiAttribs({ "greyout": inArea.get() != "Sphere" });
    inSizeX.setUiAttribs({ "greyout": inArea.get() != "BoxAA" });
    inSizeY.setUiAttribs({ "greyout": inArea.get() != "BoxAA" });
    inSizeZ.setUiAttribs({ "greyout": inArea.get() != "BoxAA" });
}

function setBox(o)
{
    o.minX = o.pos[0] - o.size[0] / 2;
    o.maxX = o.pos[0] + o.size[0] / 2;

    o.minY = o.pos[1] - o.size[1] / 2;
    o.maxY = o.pos[1] + o.size[1] / 2;

    o.minZ = o.pos[2] - o.size[2] / 2;
    o.maxZ = o.pos[2] + o.size[2] / 2;
}

const SHAPE_SPHERE = 1;
const SHAPE_AABB = 2;
const SHAPE_POINT = 3;

function renderOverlay(body)
{
    if (!CABLES.UI) return;
    if (!cgl.shouldDrawHelpers(op)) return;
    // const collisions = [];
    // const bodies = cgl.frameStore.collisionWorld.bodies;

    // for (let i = 0; i < bodies.length; i++)
    // {
    // const body = bodies[i];

    if (body.type === SHAPE_SPHERE) // sphere
    {
        // console.log("sphere")
        cgl.pushModelMatrix();
        // mat4.translate(cgl.mMatrix, cgl.mMatrix, body.pos);
        CABLES.UI.OverlayMeshes.drawSphere(op, body.radius, true);
        cgl.popModelMatrix();
    }
    else if (body.type === SHAPE_AABB) // AABB
    {
        cgl.pushModelMatrix();
        // mat4.translate(cgl.mMatrix, cgl.mMatrix, body.pos);
        CABLES.UI.OverlayMeshes.drawCube(op, body.size[0] / 2, body.size[1] / 2, body.size[2] / 2);
        cgl.popModelMatrix();
    }
    else if (body.type === SHAPE_POINT) // point
    {
        cgl.pushModelMatrix();
        // mat4.translate(cgl.mMatrix, cgl.mMatrix, body.pos);
        CABLES.UI.OverlayMeshes.drawAxisMarker(op, 0.05);
        cgl.popModelMatrix();
    }
    else console.warn("[intersectWorld] unknown col shape");

    // }
}

function render()
{
    if (!cgl.frameStore || !cgl.frameStore.collisionWorld) return;
    const cg = op.patch.cgl;

    // vec3.transformMat4(pos, empty, cg.mMatrix);
    // mat4.getScaling(scale, cg.mMatrix);

    const posArr = inPositions.get();
    const radius = inRadius.get();

    if (posArr && posArr.length > 0 && posArr.length % 3 == 0)
    {
        objs.length = posArr.length / 3;
        for (let i = 0; i < posArr.length; i += 3)
        {
            const o = objs[i / 3] || {};
            if (inPosIndex.get()) o.name = inName.get() + "." + i / 3;
            else o.name = inName.get();

            o.pos = [posArr[i + 0], posArr[i + 1], posArr[i + 2]];
            vec3.transformMat4(o.pos, o.pos, cg.mMatrix);

            // vec3.mul(o.pos, o.pos, scale);
            o.type = obj.type;
            o.size = [inSizeX.get(), inSizeY.get(), inSizeZ.get()];

            if (o.type == 2)setBox(o);
            if (o.type == 1)o.radius = radius;

            cgl.frameStore.collisionWorld.bodies.push(o);
            renderOverlay(o);
        }
    }
    else
    {
        const objCopy = getCopyObj();
        cgl.frameStore.collisionWorld.bodies.push(objCopy);
        objCopy.name = inName.get();
        objCopy.pos = [0, 0, 0];

        vec3.transformMat4(objCopy.pos, objCopy.pos, cg.mMatrix);

        objCopy.size = [inSizeX.get(), inSizeY.get(), inSizeZ.get()];

        if (objCopy.type == 2)setBox(objCopy);
        if (objCopy.type == 1)objCopy.radius = radius;
        renderOverlay(objCopy);
    }

    next.trigger();
}


};

Ops.Graphics.Intersection.IntersectBody.prototype = new CABLES.Op();
CABLES.OPS["b2e39096-8a02-4a50-b2f5-3e68f2c16ad7"]={f:Ops.Graphics.Intersection.IntersectBody,objName:"Ops.Graphics.Intersection.IntersectBody"};




// **************************************************************
// 
// Ops.Trigger.TriggerReceive
// 
// **************************************************************

Ops.Trigger.TriggerReceive = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const next = op.outTrigger("Triggered");
op.varName = op.inValueSelect("Named Trigger", [], "", true);

updateVarNamesDropdown();
op.patch.addEventListener("namedTriggersChanged", updateVarNamesDropdown);

let oldName = null;

function doTrigger()
{
    next.trigger();
}

function updateVarNamesDropdown()
{
    if (CABLES.UI)
    {
        let varnames = [];
        let vars = op.patch.namedTriggers;

        for (let i in vars) varnames.push(i);
        varnames = varnames.sort();
        op.varName.uiAttribs.values = varnames;
    }
}

op.varName.onChange = function ()
{
    if (oldName)
    {
        let oldCbs = op.patch.namedTriggers[oldName];
        let a = oldCbs.indexOf(doTrigger);
        if (a != -1) oldCbs.splice(a, 1);
    }

    op.setTitle(">" + op.varName.get());
    op.patch.namedTriggers[op.varName.get()] = op.patch.namedTriggers[op.varName.get()] || [];
    let cbs = op.patch.namedTriggers[op.varName.get()];

    cbs.push(doTrigger);
    oldName = op.varName.get();
    updateError();
    op.patch.emitEvent("opTriggerNameChanged", op, op.varName.get());
};

op.on("uiParamPanel", updateError);

function updateError()
{
    if (!op.varName.get())
    {
        op.setUiError("unknowntrigger", "unknown trigger");
    }
    else op.setUiError("unknowntrigger", null);
}


};

Ops.Trigger.TriggerReceive.prototype = new CABLES.Op();
CABLES.OPS["0816c999-f2db-466b-9777-2814573574c5"]={f:Ops.Trigger.TriggerReceive,objName:"Ops.Trigger.TriggerReceive"};




// **************************************************************
// 
// Ops.Gl.Matrix.Translate
// 
// **************************************************************

Ops.Gl.Matrix.Translate = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    x = op.inValue("x"),
    y = op.inValue("y"),
    z = op.inValue("z");

const vec = vec3.create();

render.onTriggered = function ()
{
    const cgl = op.patch.cg;

    vec3.set(vec, x.get(), y.get(), z.get());
    cgl.pushModelMatrix();
    mat4.translate(cgl.mMatrix, cgl.mMatrix, vec);
    trigger.trigger();
    cgl.popModelMatrix();
};


};

Ops.Gl.Matrix.Translate.prototype = new CABLES.Op();
CABLES.OPS["1f89ba0e-e7eb-46d7-8c66-7814b7c528b9"]={f:Ops.Gl.Matrix.Translate,objName:"Ops.Gl.Matrix.Translate"};




// **************************************************************
// 
// Ops.Trigger.Repeat2d
// 
// **************************************************************

Ops.Trigger.Repeat2d = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    exe = op.inTrigger("exe"),
    numx = op.inValueInt("num x", 5),
    numy = op.inValueInt("num y", 5),
    mul = op.inValueFloat("mul", 1),
    center = op.inValueBool("center"),
    trigger = op.outTrigger("trigger"),
    outX = op.outNumber("x"),
    outY = op.outNumber("y"),
    idx = op.outNumber("index"),
    total = op.outNumber("total iterations");

exe.onTriggered = function ()
{
    let subX = 0;
    let subY = 0;
    const m = mul.get();
    const nx = numx.get();
    const ny = numy.get();

    if (center.get())
    {
        subX = ((nx - 1) * m) / 2.0;
        subY = ((ny - 1) * m) / 2.0;
    }

    for (let y = 0; y < ny; y++)
    {
        outY.set((y * m) - subY);
        for (let x = 0; x < nx; x++)
        {
            outX.set((x * m) - subX);
            idx.set(x + y * nx);
            trigger.trigger();
        }
    }
    total.set(numx.get() * numy.get());
};


};

Ops.Trigger.Repeat2d.prototype = new CABLES.Op();
CABLES.OPS["79934693-5887-4173-8b48-3e3a18fcf225"]={f:Ops.Trigger.Repeat2d,objName:"Ops.Trigger.Repeat2d"};




// **************************************************************
// 
// Ops.Vars.VarSetString_v2
// 
// **************************************************************

Ops.Vars.VarSetString_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const val=op.inString("Value","New String");
op.varName=op.inDropDown("Variable",[],"",true);

new CABLES.VarSetOpWrapper(op,"string",val,op.varName);




};

Ops.Vars.VarSetString_v2.prototype = new CABLES.Op();
CABLES.OPS["0b4d9229-8024-4a30-9cc0-f6653942c2e4"]={f:Ops.Vars.VarSetString_v2,objName:"Ops.Vars.VarSetString_v2"};




// **************************************************************
// 
// Ops.Math.Compare.Equals
// 
// **************************************************************

Ops.Math.Compare.Equals = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValue("number1", 1),
    number2 = op.inValue("number2", 1),
    result = op.outBoolNum("result");

number1.onChange =
    number2.onChange = exec;
exec();

function exec()
{
    result.set(number1.get() == number2.get());
}


};

Ops.Math.Compare.Equals.prototype = new CABLES.Op();
CABLES.OPS["4dd3cc55-eebc-4187-9d4e-2e053a956fab"]={f:Ops.Math.Compare.Equals,objName:"Ops.Math.Compare.Equals"};




// **************************************************************
// 
// Ops.Math.Subtract
// 
// **************************************************************

Ops.Math.Subtract = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValue("number1", 1),
    number2 = op.inValue("number2", 1),
    result = op.outNumber("result");

op.setUiAttribs({ "mathTitle": true });

number1.onChange =
    number2.onChange = exec;
exec();

function exec()
{
    let v = number1.get() - number2.get();
    if (!isNaN(v)) result.set(v);
}


};

Ops.Math.Subtract.prototype = new CABLES.Op();
CABLES.OPS["a4ffe852-d200-4b96-9347-68feb01122ca"]={f:Ops.Math.Subtract,objName:"Ops.Math.Subtract"};




// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 1),
    result = op.outNumber("result");

op.setUiAttribs({ "mathTitle": true });

number1.onChange = number2.onChange = update;
update();

function update()
{
    const n1 = number1.get();
    const n2 = number2.get();

    result.set(n1 * n2);
}


};

Ops.Math.Multiply.prototype = new CABLES.Op();
CABLES.OPS["1bbdae06-fbb2-489b-9bcc-36c9d65bd441"]={f:Ops.Math.Multiply,objName:"Ops.Math.Multiply"};




// **************************************************************
// 
// Ops.Array.ArrayGetNumber
// 
// **************************************************************

Ops.Array.ArrayGetNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    array = op.inArray("array"),
    index = op.inValueInt("index"),
    valueInvalid = op.inFloat("Value Invalid Index", 0),
    value = op.outNumber("value"),
    outValidIndex = op.outBoolNum("Valid Index", true);

array.ignoreValueSerialize = true;

index.onChange = array.onChange = update;

function update()
{
    if (array.get())
    {
        const input = array.get()[index.get()];
        if (isNaN(input))
        {
            value.set(valueInvalid.get());
            outValidIndex.set(false);
        }
        else
        {
            outValidIndex.set(true);
            value.set(parseFloat(input));
        }
    }
}


};

Ops.Array.ArrayGetNumber.prototype = new CABLES.Op();
CABLES.OPS["d1189078-70cf-437d-9a37-b2ebe89acdaf"]={f:Ops.Array.ArrayGetNumber,objName:"Ops.Array.ArrayGetNumber"};




// **************************************************************
// 
// Ops.Vars.VarSetArray_v2
// 
// **************************************************************

Ops.Vars.VarSetArray_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const val = op.inArray("Value", null);
op.varName = op.inDropDown("Variable", [], "", true);

new CABLES.VarSetOpWrapper(op, "array", val, op.varName);


};

Ops.Vars.VarSetArray_v2.prototype = new CABLES.Op();
CABLES.OPS["8088290f-45d4-4312-b4ca-184d34ca4667"]={f:Ops.Vars.VarSetArray_v2,objName:"Ops.Vars.VarSetArray_v2"};




// **************************************************************
// 
// Ops.Vars.VarGetArray_v2
// 
// **************************************************************

Ops.Vars.VarGetArray_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const val = op.outArray("Value");
op.varName = op.inValueSelect("Variable", [], "", true);

new CABLES.VarGetOpWrapper(op, "array", op.varName, val);


};

Ops.Vars.VarGetArray_v2.prototype = new CABLES.Op();
CABLES.OPS["afa79294-aa9c-43bc-a49a-cade000a1de5"]={f:Ops.Vars.VarGetArray_v2,objName:"Ops.Vars.VarGetArray_v2"};




// **************************************************************
// 
// Ops.Array.Array_v3
// 
// **************************************************************

Ops.Array.Array_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inLength = op.inValueInt("Array length", 10),
    modeSelect = op.inSwitch("Mode select", ["Number", "1,2,3,4", "0-1"], "Number"),
    inDefaultValue = op.inValueFloat("Default Value"),
    inReverse = op.inBool("Reverse", false),
    outArr = op.outArray("Array"),
    outArrayLength = op.outNumber("Array length out");

let arr = [];
let selectIndex = 0;
const MODE_NUMBER = 0;
const MODE_1_TO_4 = 1;
const MODE_0_TO_1 = 2;

modeSelect.onChange = onFilterChange;

inReverse.onChange =
    inDefaultValue.onChange =
    inLength.onChange = reset;

onFilterChange();
reset();

function onFilterChange()
{
    let selectedMode = modeSelect.get();
    if (selectedMode === "Number") selectIndex = MODE_NUMBER;
    else if (selectedMode === "1,2,3,4") selectIndex = MODE_1_TO_4;
    else if (selectedMode === "0-1") selectIndex = MODE_0_TO_1;

    inDefaultValue.setUiAttribs({ "greyout": selectIndex !== MODE_NUMBER });

    op.setUiAttrib({ "extendTitle": modeSelect.get() });

    reset();
}

function reset()
{
    arr.length = 0;

    let arrLength = inLength.get();
    let valueForArray = inDefaultValue.get();
    let i;

    // mode 0 - fill all array values with one number
    if (selectIndex === MODE_NUMBER)
    {
        for (i = 0; i < arrLength; i++)
        {
            arr[i] = valueForArray;
        }
    }
    // mode 1 Continuous number array - increments up to array length
    else if (selectIndex === MODE_1_TO_4)
    {
        for (i = 0; i < arrLength; i++)
        {
            arr[i] = i;
        }
    }
    // mode 2 Normalized array
    else if (selectIndex === MODE_0_TO_1)
    {
        if (arrLength > 1) { 
            for (i = 0; i < arrLength; i++)
                {
                    arr[i] = i / (arrLength - 1);
                }
        } else 
        {
            //When array length is only 1 
            arr = [0];
        }
    }

    if (inReverse.get())arr = arr.reverse();

    outArr.setRef(arr);
    outArrayLength.set(arr.length);
}


};

Ops.Array.Array_v3.prototype = new CABLES.Op();
CABLES.OPS["e4d31a46-bf64-42a8-be34-4cbb2bbc2600"]={f:Ops.Array.Array_v3,objName:"Ops.Array.Array_v3"};




// **************************************************************
// 
// Ops.Gl.Matrix.Camera
// 
// **************************************************************

Ops.Gl.Matrix.Camera = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const render = op.inTrigger("render");
const trigger = op.outTrigger("trigger");

/* Inputs */
// projection | prespective & ortogonal
const projectionMode = op.inValueSelect("projection mode", ["prespective", "ortogonal"], "prespective");
const zNear = op.inValue("frustum near", 0.01);
const zFar = op.inValue("frustum far", 5000.0);

const fov = op.inValue("fov", 45);
const autoAspect = op.inValueBool("Auto Aspect Ratio", true);
const aspect = op.inValue("Aspect Ratio", 1);

// look at camera
const eyeX = op.inValue("eye X", 0);
const eyeY = op.inValue("eye Y", 0);
const eyeZ = op.inValue("eye Z", 5);

const centerX = op.inValue("center X", 0);
const centerY = op.inValue("center Y", 0);
const centerZ = op.inValue("center Z", 0);

// camera transform and movements
const posX = op.inValue("truck", 0);
const posY = op.inValue("boom", 0);
const posZ = op.inValue("dolly", 0);

const rotX = op.inValue("tilt", 0);
const rotY = op.inValue("pan", 0);
const rotZ = op.inValue("roll", 0);

/* Outputs */
const outAsp = op.outNumber("Aspect");
const outArr = op.outArray("Look At Array");

/* logic */
const cgl = op.patch.cgl;

let asp = 0;

const vUp = vec3.create();
const vEye = vec3.create();
const vCenter = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

const arr = [];

// Transform and move
const vPos = vec3.create();
const transMatrixMove = mat4.create();
mat4.identity(transMatrixMove);

let updateCameraMovementMatrix = true;

render.onTriggered = function ()
{
    if (cgl.frameStore.shadowPass) return trigger.trigger();

    // Aspect ration
    if (!autoAspect.get()) asp = aspect.get();
    else asp = cgl.getViewPort()[2] / cgl.getViewPort()[3];
    outAsp.set(asp);

    // translation (truck, boom, dolly)
    cgl.pushViewMatrix();

    if (updateCameraMovementMatrix)
    {
        mat4.identity(transMatrixMove);

        vec3.set(vPos, posX.get(), posY.get(), posZ.get());
        if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0)
            mat4.translate(transMatrixMove, transMatrixMove, vPos);

        if (rotX.get() !== 0)
            mat4.rotateX(transMatrixMove, transMatrixMove, rotX.get() * CGL.DEG2RAD);
        if (rotY.get() !== 0)
            mat4.rotateY(transMatrixMove, transMatrixMove, rotY.get() * CGL.DEG2RAD);
        if (rotZ.get() !== 0)
            mat4.rotateZ(transMatrixMove, transMatrixMove, rotZ.get() * CGL.DEG2RAD);

        updateCameraMovementMatrix = false;
    }

    mat4.multiply(cgl.vMatrix, cgl.vMatrix, transMatrixMove);

    // projection (prespective / ortogonal)
    cgl.pushPMatrix();

    // look at
    cgl.pushViewMatrix();

    if (projectionMode.get() == "prespective")
    {
        mat4.perspective(
            cgl.pMatrix,
            fov.get() * 0.0174533,
            asp,
            zNear.get(),
            zFar.get()
        );
    }
    else if (projectionMode.get() == "ortogonal")
    {
        mat4.ortho(
            cgl.pMatrix,
            -1 * (fov.get() / 14),
            1 * (fov.get() / 14),
            -1 * (fov.get() / 14) / asp,
            1 * (fov.get() / 14) / asp,
            zNear.get(),
            zFar.get()
        );
    }

    arr[0] = eyeX.get();
    arr[1] = eyeY.get();
    arr[2] = eyeZ.get();

    arr[3] = centerX.get();
    arr[4] = centerY.get();
    arr[5] = centerZ.get();

    arr[6] = 0;
    arr[7] = 1;
    arr[8] = 0;

    outArr.setRef(arr);

    vec3.set(vUp, 0, 1, 0);
    vec3.set(vEye, eyeX.get(), eyeY.get(), eyeZ.get());
    vec3.set(vCenter, centerX.get(), centerY.get(), centerZ.get());

    mat4.lookAt(transMatrix, vEye, vCenter, vUp);

    mat4.multiply(cgl.vMatrix, cgl.vMatrix, transMatrix);

    trigger.trigger();

    cgl.popViewMatrix();
    cgl.popPMatrix();

    cgl.popViewMatrix();

    // GUI for dolly, boom and truck
    if (op.isCurrentUiOp())
        gui.setTransformGizmo({
            "posX": posX,
            "posY": posY,
            "posZ": posZ
        });
};

const updateUI = function ()
{
    if (!autoAspect.get())
    {
        aspect.setUiAttribs({ "greyout": false });
    }
    else
    {
        aspect.setUiAttribs({ "greyout": true });
    }
};

const cameraMovementChanged = function ()
{
    updateCameraMovementMatrix = true;
};

// listeners
posX.onChange = cameraMovementChanged;
posY.onChange = cameraMovementChanged;
posZ.onChange = cameraMovementChanged;

rotX.onChange = cameraMovementChanged;
rotY.onChange = cameraMovementChanged;
rotZ.onChange = cameraMovementChanged;

autoAspect.onChange = updateUI;
updateUI();


};

Ops.Gl.Matrix.Camera.prototype = new CABLES.Op();
CABLES.OPS["b24dbfdc-485c-49d2-92a1-7258efd9239a"]={f:Ops.Gl.Matrix.Camera,objName:"Ops.Gl.Matrix.Camera"};




// **************************************************************
// 
// Ops.Gl.Matrix.OrbitControls
// 
// **************************************************************

Ops.Gl.Matrix.OrbitControls = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    minDist = op.inValueFloat("min distance"),
    maxDist = op.inValueFloat("max distance"),

    minRotY = op.inValue("min rot y", 0),
    maxRotY = op.inValue("max rot y", 0),

    initialRadius = op.inValue("initial radius", 0),
    initialAxis = op.inValueSlider("initial axis y"),
    initialX = op.inValueSlider("initial axis x"),

    mul = op.inValueFloat("mul"),
    smoothness = op.inValueSlider("Smoothness", 1.0),
    speedX = op.inValue("Speed X", 1),
    speedY = op.inValue("Speed Y", 1),

    active = op.inValueBool("Active", true),

    allowPanning = op.inValueBool("Allow Panning", true),
    allowZooming = op.inValueBool("Allow Zooming", true),
    allowRotation = op.inValueBool("Allow Rotation", true),
    restricted = op.inValueBool("restricted", true),

    trigger = op.outTrigger("trigger"),
    outRadius = op.outNumber("radius"),
    outXDeg = op.outNumber("Rot X"),
    outYDeg = op.outNumber("Rot Y"),

    inReset = op.inTriggerButton("Reset");

op.setPortGroup("Initial Values", [initialAxis, initialX, initialRadius]);
op.setPortGroup("Interaction", [mul, smoothness, speedX, speedY]);
op.setPortGroup("Boundaries", [minRotY, maxRotY, minDist, maxDist]);

mul.set(1);
minDist.set(0.01);
maxDist.set(99999);

inReset.onTriggered = reset;

let eye = vec3.create();
const vUp = vec3.create();
const vCenter = vec3.create();
const viewMatrix = mat4.create();
const tempViewMatrix = mat4.create();
const vOffset = vec3.create();
const finalEyeAbs = vec3.create();

initialAxis.set(0.5);

let mouseDown = false;
let radius = 5;
outRadius.set(radius);

let lastMouseX = 0, lastMouseY = 0;
let percX = 0, percY = 0;

vec3.set(vCenter, 0, 0, 0);
vec3.set(vUp, 0, 1, 0);

const tempEye = vec3.create();
const finalEye = vec3.create();
const tempCenter = vec3.create();
const finalCenter = vec3.create();

let px = 0;
let py = 0;

let divisor = 1;
let element = null;
updateSmoothness();

op.onDelete = unbind;

const halfCircle = Math.PI;
const fullCircle = Math.PI * 2;

function reset()
{
    let off = 0;

    if (px % fullCircle < -halfCircle)
    {
        off = -fullCircle;
        px %= -fullCircle;
    }
    else
    if (px % fullCircle > halfCircle)
    {
        off = fullCircle;
        px %= fullCircle;
    }
    else px %= fullCircle;

    py %= (Math.PI);

    vec3.set(vOffset, 0, 0, 0);
    vec3.set(vCenter, 0, 0, 0);
    vec3.set(vUp, 0, 1, 0);

    percX = (initialX.get() * Math.PI * 2 + off);
    percY = (initialAxis.get() - 0.5);

    radius = initialRadius.get();
    eye = circlePos(percY);
}

function updateSmoothness()
{
    divisor = smoothness.get() * 10 + 1.0;
}

smoothness.onChange = updateSmoothness;

let initializing = true;

function ip(val, goal)
{
    if (initializing) return goal;
    return val + (goal - val) / divisor;
}

let lastPy = 0;
const lastPx = 0;

render.onTriggered = function ()
{
    const cgl = op.patch.cg;
    if (!cgl) return;

    if (!element)
    {
        setElement(cgl.canvas);
        bind();
    }

    cgl.pushViewMatrix();

    px = ip(px, percX);
    py = ip(py, percY);

    let degY = (py + 0.5) * 180;

    if (minRotY.get() !== 0 && degY < minRotY.get())
    {
        degY = minRotY.get();
        py = lastPy;
    }
    else if (maxRotY.get() !== 0 && degY > maxRotY.get())
    {
        degY = maxRotY.get();
        py = lastPy;
    }
    else
    {
        lastPy = py;
    }

    const degX = (px) * CGL.RAD2DEG;

    outYDeg.set(degY);
    outXDeg.set(degX);

    circlePosi(eye, py);

    vec3.add(tempEye, eye, vOffset);
    vec3.add(tempCenter, vCenter, vOffset);

    finalEye[0] = ip(finalEye[0], tempEye[0]);
    finalEye[1] = ip(finalEye[1], tempEye[1]);
    finalEye[2] = ip(finalEye[2], tempEye[2]);

    finalCenter[0] = ip(finalCenter[0], tempCenter[0]);
    finalCenter[1] = ip(finalCenter[1], tempCenter[1]);
    finalCenter[2] = ip(finalCenter[2], tempCenter[2]);

    const empty = vec3.create();

    mat4.lookAt(viewMatrix, finalEye, finalCenter, vUp);
    mat4.rotate(viewMatrix, viewMatrix, px, vUp);

    // finaly multiply current scene viewmatrix
    mat4.multiply(cgl.vMatrix, cgl.vMatrix, viewMatrix);

    trigger.trigger();
    cgl.popViewMatrix();
    initializing = false;
};

function circlePosi(vec, perc)
{
    const mmul = mul.get();
    if (radius < minDist.get() * mmul) radius = minDist.get() * mmul;
    if (radius > maxDist.get() * mmul) radius = maxDist.get() * mmul;

    outRadius.set(radius * mmul);

    let i = 0, degInRad = 0;

    degInRad = 360 * perc / 2 * CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad) * radius * mmul,
        Math.sin(degInRad) * radius * mmul,
        0);
    return vec;
}

function circlePos(perc)
{
    const mmul = mul.get();
    if (radius < minDist.get() * mmul)radius = minDist.get() * mmul;
    if (radius > maxDist.get() * mmul)radius = maxDist.get() * mmul;

    outRadius.set(radius * mmul);

    let i = 0, degInRad = 0;
    const vec = vec3.create();
    degInRad = 360 * perc / 2 * CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad) * radius * mmul,
        Math.sin(degInRad) * radius * mmul,
        0);
    return vec;
}

function onmousemove(event)
{
    if (!mouseDown) return;

    const x = event.clientX;
    const y = event.clientY;

    let movementX = (x - lastMouseX);
    let movementY = (y - lastMouseY);

    movementX *= speedX.get();
    movementY *= speedY.get();

    if (event.buttons == 2 && allowPanning.get())
    {
        vOffset[2] += movementX * 0.01 * mul.get();
        vOffset[1] += movementY * 0.01 * mul.get();
    }
    else
    if (event.buttons == 4 && allowZooming.get())
    {
        radius += movementY * 0.05;
        eye = circlePos(percY);
    }
    else
    {
        if (allowRotation.get())
        {
            percX += movementX * 0.003;
            percY += movementY * 0.002;

            if (restricted.get())
            {
                if (percY > 0.5)percY = 0.5;
                if (percY < -0.5)percY = -0.5;
            }
        }
    }

    lastMouseX = x;
    lastMouseY = y;
}

function onMouseDown(event)
{
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    mouseDown = true;

    try { element.setPointerCapture(event.pointerId); }
    catch (e) {}
}

function onMouseUp(e)
{
    mouseDown = false;
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';

    try { element.releasePointerCapture(e.pointerId); }
    catch (e) {}
}

function lockChange()
{
    const el = op.patch.cg.canvas;

    if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
    {
        document.addEventListener("mousemove", onmousemove, false);
    }
}

function onMouseEnter(e)
{
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';
}

initialRadius.onChange = function ()
{
    radius = initialRadius.get();
    reset();
};

initialX.onChange = function ()
{
    px = percX = (initialX.get() * Math.PI * 2);
};

initialAxis.onChange = function ()
{
    py = percY = (initialAxis.get() - 0.5);
    eye = circlePos(percY);
};

const onMouseWheel = function (event)
{
    if (allowZooming.get())
    {
        const delta = CGL.getWheelSpeed(event) * 0.06;
        radius += (parseFloat(delta)) * 1.2;

        eye = circlePos(percY);
    }
};

const ontouchstart = function (event)
{
    if (event.touches && event.touches.length > 0) onMouseDown(event.touches[0]);
};

const ontouchend = function (event)
{
    onMouseUp();
};

const ontouchmove = function (event)
{
    if (event.touches && event.touches.length > 0) onmousemove(event.touches[0]);
};

active.onChange = function ()
{
    if (active.get())bind();
    else unbind();
};

function setElement(ele)
{
    unbind();
    element = ele;
    bind();
}

function bind()
{
    if (!element) return;

    element.addEventListener("pointermove", onmousemove);
    element.addEventListener("pointerdown", onMouseDown);
    element.addEventListener("pointerup", onMouseUp);
    element.addEventListener("pointerleave", onMouseUp);
    element.addEventListener("pointerenter", onMouseEnter);
    element.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    element.addEventListener("wheel", onMouseWheel, { "passive": true });
}

function unbind()
{
    if (!element) return;

    element.removeEventListener("pointermove", onmousemove);
    element.removeEventListener("pointerdown", onMouseDown);
    element.removeEventListener("pointerup", onMouseUp);
    element.removeEventListener("pointerleave", onMouseUp);
    element.removeEventListener("pointerenter", onMouseUp);
    element.removeEventListener("wheel", onMouseWheel);
}

eye = circlePos(0);

initialX.set(0.25);
initialRadius.set(0.05);


};

Ops.Gl.Matrix.OrbitControls.prototype = new CABLES.Op();
CABLES.OPS["eaf4f7ce-08a3-4d1b-b9f4-ebc0b7b1cde1"]={f:Ops.Gl.Matrix.OrbitControls,objName:"Ops.Gl.Matrix.OrbitControls"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial_v3
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"basicmaterial_frag":"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n\n#ifdef VERTEX_COLORS\nIN vec4 vertCol;\n#endif\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\n\n\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=color;\n\n\n    #ifdef HAS_TEXTURES\n        vec2 uv=texCoord;\n\n        #ifdef CROP_TEXCOORDS\n            if(uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) discard;\n        #endif\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(tex,uv);\n\n            #ifdef COLORIZE_TEXTURE\n                col.r*=color.r;\n                col.g*=color.g;\n                col.b*=color.b;\n            #endif\n        #endif\n        col.a*=color.a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                uv=texCoordOrig;\n            #endif\n            #ifdef ALPHA_MASK_IR\n                col.a*=1.0-texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_IALPHA\n                col.a*=1.0-texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,uv).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,uv).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,uv).b;\n            #endif\n            // #endif\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        col*=vertCol;\n    #endif\n\n    outColor = col;\n}\n","basicmaterial_vert":"\n{{MODULES_HEAD}}\n\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI float diffuseRepeatX;\n    UNI float diffuseRepeatY;\n    UNI float texOffsetX;\n    UNI float texOffsetY;\n#endif\n\n#ifdef VERTEX_COLORS\n    in vec4 attrVertColor;\n    out vec4 vertCol;\n\n#endif\n\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 modelViewMatrix;\n\n    norm=attrVertNormal;\n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n        texCoord.y=(1.0-texCoord.y)*diffuseRepeatY+texOffsetY;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        vertCol=attrVertColor;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.0);\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       modelViewMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * modelViewMatrix * vec4((\n           position.x * vec3(\n               modelViewMatrix[0][0],\n               modelViewMatrix[1][0],\n               modelViewMatrix[2][0] ) +\n           position.y * vec3(\n               modelViewMatrix[0][1],\n               modelViewMatrix[1][1],\n               modelViewMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        modelViewMatrix=viewMatrix * mMatrix;\n\n        {{MODULE_VERTEX_MODELVIEW}}\n\n    #endif\n\n    // mat4 modelViewMatrix=viewMatrix*mMatrix;\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * modelViewMatrix * pos;\n    #endif\n}\n",};
const render = op.inTrigger("render");
const trigger = op.outTrigger("trigger");
const shaderOut = op.outObject("shader", null, "shader");

shaderOut.ignoreValueSerialize = true;

op.toWorkPortsNeedToBeLinked(render);
op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_FUNCTION);

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "basicmaterialnew", this);
shader.addAttribute({ "type": "vec3", "name": "vPosition" });
shader.addAttribute({ "type": "vec2", "name": "attrTexCoord" });
shader.addAttribute({ "type": "vec3", "name": "attrVertNormal", "nameFrag": "norm" });
shader.addAttribute({ "type": "float", "name": "attrVertIndex" });

shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG", "MODULE_VERTEX_MODELVIEW"]);

shader.setSource(attachments.basicmaterial_vert, attachments.basicmaterial_frag);

shaderOut.setRef(shader);

render.onTriggered = doRender;

// rgba colors
const r = op.inValueSlider("r", Math.random());
const g = op.inValueSlider("g", Math.random());
const b = op.inValueSlider("b", Math.random());
const a = op.inValueSlider("a", 1);
r.setUiAttribs({ "colorPick": true });

// const uniColor=new CGL.Uniform(shader,'4f','color',r,g,b,a);
const colUni = shader.addUniformFrag("4f", "color", r, g, b, a);

shader.uniformColorDiffuse = colUni;

// diffuse outTexture

const diffuseTexture = op.inTexture("texture");
let diffuseTextureUniform = null;
diffuseTexture.onChange = updateDiffuseTexture;

const colorizeTexture = op.inValueBool("colorizeTexture", false);
const vertexColors = op.inValueBool("Vertex Colors", false);

// opacity texture
const textureOpacity = op.inTexture("textureOpacity");
let textureOpacityUniform = null;

const alphaMaskSource = op.inSwitch("Alpha Mask Source", ["Luminance", "R", "G", "B", "A", "1-A", "1-R"], "Luminance");
alphaMaskSource.setUiAttribs({ "greyout": true });
textureOpacity.onChange = updateOpacity;

const texCoordAlpha = op.inValueBool("Opacity TexCoords Transform", false);
const discardTransPxl = op.inValueBool("Discard Transparent Pixels");

// texture coords
const
    diffuseRepeatX = op.inValue("diffuseRepeatX", 1),
    diffuseRepeatY = op.inValue("diffuseRepeatY", 1),
    diffuseOffsetX = op.inValue("Tex Offset X", 0),
    diffuseOffsetY = op.inValue("Tex Offset Y", 0),
    cropRepeat = op.inBool("Crop TexCoords", false);

shader.addUniformFrag("f", "diffuseRepeatX", diffuseRepeatX);
shader.addUniformFrag("f", "diffuseRepeatY", diffuseRepeatY);
shader.addUniformFrag("f", "texOffsetX", diffuseOffsetX);
shader.addUniformFrag("f", "texOffsetY", diffuseOffsetY);

const doBillboard = op.inValueBool("billboard", false);

alphaMaskSource.onChange =
    doBillboard.onChange =
    discardTransPxl.onChange =
    texCoordAlpha.onChange =
    cropRepeat.onChange =
    vertexColors.onChange =
    colorizeTexture.onChange = updateDefines;

op.setPortGroup("Color", [r, g, b, a]);
op.setPortGroup("Color Texture", [diffuseTexture, vertexColors, colorizeTexture]);
op.setPortGroup("Opacity", [textureOpacity, alphaMaskSource, discardTransPxl, texCoordAlpha]);
op.setPortGroup("Texture Transform", [diffuseRepeatX, diffuseRepeatY, diffuseOffsetX, diffuseOffsetY, cropRepeat]);

updateOpacity();
updateDiffuseTexture();

op.preRender = function ()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if (!shader) return;

    cgl.pushShader(shader);
    shader.popTextures();

    if (diffuseTextureUniform && diffuseTexture.get()) shader.pushTexture(diffuseTextureUniform, diffuseTexture.get());
    if (textureOpacityUniform && textureOpacity.get()) shader.pushTexture(textureOpacityUniform, textureOpacity.get());

    trigger.trigger();

    cgl.popShader();
}

function updateOpacity()
{
    if (textureOpacity.get())
    {
        if (textureOpacityUniform !== null) return;
        shader.removeUniform("texOpacity");
        shader.define("HAS_TEXTURE_OPACITY");
        if (!textureOpacityUniform)textureOpacityUniform = new CGL.Uniform(shader, "t", "texOpacity");
    }
    else
    {
        shader.removeUniform("texOpacity");
        shader.removeDefine("HAS_TEXTURE_OPACITY");
        textureOpacityUniform = null;
    }

    updateDefines();
}

function updateDiffuseTexture()
{
    if (diffuseTexture.get())
    {
        if (!shader.hasDefine("HAS_TEXTURE_DIFFUSE"))shader.define("HAS_TEXTURE_DIFFUSE");
        if (!diffuseTextureUniform)diffuseTextureUniform = new CGL.Uniform(shader, "t", "texDiffuse");
    }
    else
    {
        shader.removeUniform("texDiffuse");
        shader.removeDefine("HAS_TEXTURE_DIFFUSE");
        diffuseTextureUniform = null;
    }
    updateUi();
}

function updateUi()
{
    const hasTexture = diffuseTexture.isLinked() || textureOpacity.isLinked();
    diffuseRepeatX.setUiAttribs({ "greyout": !hasTexture });
    diffuseRepeatY.setUiAttribs({ "greyout": !hasTexture });
    diffuseOffsetX.setUiAttribs({ "greyout": !hasTexture });
    diffuseOffsetY.setUiAttribs({ "greyout": !hasTexture });
    colorizeTexture.setUiAttribs({ "greyout": !hasTexture });

    alphaMaskSource.setUiAttribs({ "greyout": !textureOpacity.get() });
    texCoordAlpha.setUiAttribs({ "greyout": !textureOpacity.get() });

    let notUsingColor = true;
    notUsingColor = diffuseTexture.get() && !colorizeTexture.get();
    r.setUiAttribs({ "greyout": notUsingColor });
    g.setUiAttribs({ "greyout": notUsingColor });
    b.setUiAttribs({ "greyout": notUsingColor });
}

function updateDefines()
{
    shader.toggleDefine("VERTEX_COLORS", vertexColors.get());
    shader.toggleDefine("CROP_TEXCOORDS", cropRepeat.get());
    shader.toggleDefine("COLORIZE_TEXTURE", colorizeTexture.get());
    shader.toggleDefine("TRANSFORMALPHATEXCOORDS", texCoordAlpha.get());
    shader.toggleDefine("DISCARDTRANS", discardTransPxl.get());
    shader.toggleDefine("BILLBOARD", doBillboard.get());

    shader.toggleDefine("ALPHA_MASK_ALPHA", alphaMaskSource.get() == "A");
    shader.toggleDefine("ALPHA_MASK_IALPHA", alphaMaskSource.get() == "1-A");
    shader.toggleDefine("ALPHA_MASK_IR", alphaMaskSource.get() == "1-R");
    shader.toggleDefine("ALPHA_MASK_LUMI", alphaMaskSource.get() == "Luminance");
    shader.toggleDefine("ALPHA_MASK_R", alphaMaskSource.get() == "R");
    shader.toggleDefine("ALPHA_MASK_G", alphaMaskSource.get() == "G");
    shader.toggleDefine("ALPHA_MASK_B", alphaMaskSource.get() == "B");
    updateUi();
}


};

Ops.Gl.Shader.BasicMaterial_v3.prototype = new CABLES.Op();
CABLES.OPS["ec55d252-3843-41b1-b731-0482dbd9e72b"]={f:Ops.Gl.Shader.BasicMaterial_v3,objName:"Ops.Gl.Shader.BasicMaterial_v3"};




// **************************************************************
// 
// Ops.Math.Ease
// 
// **************************************************************

Ops.Math.Ease = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inVal = op.inValue("Value"),
    inMin = op.inValue("Min", 0),
    inMax = op.inValue("Max", 1),
    result = op.outNumber("Result"),
    anim = new CABLES.Anim();

anim.createPort(op, "Easing", updateAnimEasing);
anim.setValue(0, 0);
anim.setValue(1, 1);

op.onLoaded = inMin.onChange = inMax.onChange = updateMinMax;

function updateMinMax()
{
    anim.keys[0].time = anim.keys[0].value = Math.min(inMin.get(), inMax.get());
    anim.keys[1].time = anim.keys[1].value = Math.max(inMin.get(), inMax.get());
}

function updateAnimEasing()
{
    anim.keys[0].setEasing(anim.defaultEasing);
}

inVal.onChange = function ()
{
    const r = anim.getValue(inVal.get());
    result.set(r);
};


};

Ops.Math.Ease.prototype = new CABLES.Op();
CABLES.OPS["8f6e4a08-33e6-408f-ac4a-198bd03b417b"]={f:Ops.Math.Ease,objName:"Ops.Math.Ease"};




// **************************************************************
// 
// Ops.Gl.Meshes.Cylinder_v2
// 
// **************************************************************

Ops.Gl.Meshes.Cylinder_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inRender = op.inTrigger("render"),
    inDraw = op.inValueBool("Draw", true),
    inSegments = op.inValueInt("segments", 40),
    inStacks = op.inValueInt("stacks", 1),
    inLength = op.inValueFloat("length", 1),
    inOuterRadius = op.inValueFloat("outer radius", 0.5),
    inInnerRadius = op.inValueFloat("inner radius", 0),
    inUVMode = op.inValueSelect("UV mode", ["simple", "atlas"], "simple"),
    flipSideMapping = op.inValueBool("Flip Mapping", false),
    inCaps = op.inValueBool("Caps", true),
    inFlat = op.inValueBool("Flat Normals", false),
    outTrigger = op.outTrigger("next"),
    outGeometry = op.outObject("geometry"),
    geom = new CGL.Geometry("cylinder");

inDraw.setUiAttribs({ "title": "Render mesh" });

const
    TAU = Math.PI * 2,
    cgl = op.patch.cgl;

let needsRebuild = true;
let mesh = null;

inUVMode.setUiAttribs({ "hidePort": true });

op.preRender = buildMesh;

function buildMesh()
{
    const flipTex = flipSideMapping.get();

    const
        segments = Math.max(inSegments.get(), 3) | 0,
        innerRadius = Math.max(inInnerRadius.get(), 0),
        outerRadius = Math.max(inOuterRadius.get(), innerRadius),
        stacks = Math.max(inStacks.get(), inStacks.defaultValue) | 0,
        length = inLength.get(),
        stackLength = length / stacks,
        segmentRadians = TAU / segments,
        uvMode = inUVMode.get();
    let
        positions = [],
        normals = [],
        tangents = [],
        biTangents = [],
        texcoords = [],
        indices = [],
        x, y, z, i, j,
        a, d, o;
    if (uvMode == "atlas") o = 0.5;
    else o = 1;

    // for each stack
    for (
        i = 0, z = -length / 2;
        i <= stacks;
        i++, z += stackLength
    )
    {
        // for each segment
        for (
            j = a = 0;
            j <= segments;
            j++, a += segmentRadians
        )
        {
            positions.push(
                (x = Math.sin(a)) * outerRadius,
                (y = Math.cos(a)) * outerRadius,
                z
            );
            d = Math.sqrt(x * x + y * y);
            x /= d;
            y /= d;
            normals.push(x, y, 0);
            tangents.push(-y, x, 0);
            biTangents.push(0, 0, 1);

            if (flipTex)
                texcoords.push(
                    j / segments,
                    1.0 - ((z / length + 0.5) * o)
                );

            else
                texcoords.push(
                    (z / length + 0.5) * o,
                    j / segments
                );
        }
    }

    // create indices
    for (j = 0; j < stacks; j++)
    {
        for (
            i = 0, d = j * (segments + 1);
            i < segments;
            i++, d++
        )
        {
            a = d + 1;
            indices.push(
                d + (segments + 1), a, d, d + (segments + 1), a + (segments + 1), a
            );
        }
    }

    // create inner shell
    if (innerRadius)
    {
        d = positions.length;
        for (i = j = 0; i < d; i += 3, j += 2)
        {
            positions.push(
                (positions[i] / outerRadius) * innerRadius,
                (positions[i + 1] / outerRadius) * innerRadius,
                positions[i + 2]
            );
            normals.push(
                -normals[i],
                -normals[i + 1],
                0
            );
            tangents.push(
                -tangents[i],
                -tangents[i + 1],
                0
            );
            biTangents.push(
                0,
                -biTangents[i + 1],
                -biTangents[i + 2]
            );
            texcoords.push(
                texcoords[j],
                1 - texcoords[j + 1]
            );
        }
        a = d / 3;
        d = indices.length;
        for (i = 0; i < d; i += 6)
        {
            indices.push(
                a + indices[i],
                a + indices[i + 2],
                a + indices[i + 1],
                a + indices[i + 3],
                a + indices[i + 5],
                a + indices[i + 4]
            );
        }

        if (inCaps.get())
        {
            // create caps
            a = positions.length;
            o = a / 2;
            d = segments * 3;

            // cap positions
            Array.prototype.push.apply(positions, positions.slice(0, d));
            Array.prototype.push.apply(positions, positions.slice(o, o + d));
            Array.prototype.push.apply(positions, positions.slice(o - d, o));
            Array.prototype.push.apply(positions, positions.slice(a - d, a));

            // cap normals
            d = segments * 2;
            for (i = 0; i < d; i++) normals.push(0, 0, -1), tangents.push(-1, 0, 0), biTangents.push(0, -1, 0);
            for (i = 0; i < d; i++) normals.push(0, 0, 1), tangents.push(1, 0, 0), biTangents.push(0, 1, 0);

            // cap uvs
            if (uvMode == "atlas")
            {
                d = (innerRadius / outerRadius) * 0.5;
                for (i = o = 0; i < segments; i++, o += segmentRadians)
                    texcoords.push(
                        Math.sin(o) * 0.25 + 0.75,
                        Math.cos(o) * 0.25 + 0.25
                    );
                for (i = o = 0; i < segments; i++, o += segmentRadians)
                    texcoords.push(
                        (Math.sin(o) * d + 0.5) * 0.5 + 0.5,
                        (Math.cos(o) * d + 0.5) * 0.5
                    );
                for (i = o = 0; i < segments; i++, o += segmentRadians)
                    texcoords.push(
                        Math.sin(o) * 0.25 + 0.75,
                        Math.cos(o) * 0.25 + 0.75
                    );
                for (i = o = 0; i < segments; i++, o += segmentRadians)
                    texcoords.push(
                        (Math.sin(o) * d + 0.5) * 0.5 + 0.5,
                        (Math.cos(o) * d + 0.5) * 0.5 + 0.5
                    );
            }
            else
            {
                for (i = 0; i < d; i++) texcoords.push(0, 0);
                for (i = 0; i < d; i++) texcoords.push(1, 1);
            }

            // cap indices
            for (
                i = 0, o = a / 3 + x;
                i < segments - 1;
                i++, o++
            )
            {
                indices.push(
                    o + 1, o + segments, o, o + segments + 1, o + segments, o + 1
                );
            }
            indices.push(
                o + segments, a / 3 + x, a / 3 + segments + x, o + segments, o, a / 3 + x
            );
            x += segments * 2;
            for (
                i = 0, o = a / 3 + x;
                i < segments - 1;
                i++, o++
            )
            {
                indices.push(
                    o, o + segments, o + 1, o + 1, o + segments, o + segments + 1
                );
            }
            indices.push(
                a / 3 + segments + x, a / 3 + x, o + segments, a / 3 + x, o, o + segments
            );
        }
    }
    else
    {
        a = positions.length;
        d = a / 3;

        positions.push(0, 0, -length / 2);
        Array.prototype.push.apply(positions, positions.slice(0, segments * 3));
        for (i = 0; i <= segments; i++) normals.push(0, 0, -1), tangents.push(-1, 0, 0), biTangents.push(0, -1, 0);

        if (inCaps.get())
        {
            positions.push(0, 0, length / 2);
            Array.prototype.push.apply(positions, positions.slice(a - segments * 3, a));
            for (i = 0; i <= segments; i++) normals.push(0, 0, 1), tangents.push(1, 0, 0), biTangents.push(0, 1, 0);
            if (uvMode == "atlas")
            {
                texcoords.push(0.75, 0.25);
                for (i = a = 0; i < segments; i++, a += segmentRadians)
                    texcoords.push(Math.sin(a) * 0.25 + 0.75, Math.cos(a) * 0.25 + 0.25);
                texcoords.push(0.75, 0.75);
                for (i = a = 0; i < segments; i++, a += segmentRadians)
                    texcoords.push(Math.sin(a) * 0.25 + 0.75, Math.cos(a) * 0.25 + 0.75);
            }
            else
            {
                for (i = 0; i <= segments; i++) texcoords.push(0, 0);
                for (i = 0; i <= segments; i++) texcoords.push(1, 1);
            }
            indices.push(d + 1, d, d + segments);
            for (i = 1; i < segments; i++)
                indices.push(d, d + i, d + i + 1);
            d += segments + 1;
            indices.push(d, d + 1, d + segments);
            for (i = 1; i < segments; i++)
                indices.push(d, d + i + 1, d + i);
            d += segments + 1;
        }
    }

    // set geometry
    geom.clear();
    geom.vertices = positions;
    geom.texCoords = texcoords;
    geom.vertexNormals = normals;
    geom.tangents = tangents;
    geom.biTangents = biTangents;
    geom.verticesIndices = indices;

    if (inFlat.get()) geom.unIndex();

    outGeometry.setRef(geom);

    if (op.patch.cg)
        if (!mesh) mesh = op.patch.cg.createMesh(geom, { "opId": op.id });
        else mesh.setGeom(geom);

    needsRebuild = false;
}

// set event handlers
inRender.onTriggered = function ()
{
    if (needsRebuild) buildMesh();
    if (inDraw.get() && mesh) mesh.render(cgl.getShader());
    outTrigger.trigger();
};

inSegments.onChange =
inOuterRadius.onChange =
inInnerRadius.onChange =
inCaps.onChange =
inLength.onChange =
flipSideMapping.onChange =
inStacks.onChange =
inFlat.onChange =
inUVMode.onChange = function ()
{
    // only calculate once, even after multiple settings could were changed
    needsRebuild = true;
};

// set lifecycle handlers
op.onDelete = function () { if (mesh)mesh.dispose(); };


};

Ops.Gl.Meshes.Cylinder_v2.prototype = new CABLES.Op();
CABLES.OPS["2899ad67-1e64-4692-af2a-c3b9078f1b5f"]={f:Ops.Gl.Meshes.Cylinder_v2,objName:"Ops.Gl.Meshes.Cylinder_v2"};




// **************************************************************
// 
// Ops.Gl.Shader.MatCapMaterial_v3
// 
// **************************************************************

Ops.Gl.Shader.MatCapMaterial_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"matcap_frag":"{{MODULES_HEAD}}\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n#endif\n\nIN vec3 transformedNormal;\nIN vec3 viewSpacePosition;\n\nUNI vec4 inColor;\n\nUNI sampler2D texMatcap;\n\n#ifdef HAS_DIFFUSE_TEXTURE\n   UNI sampler2D texDiffuse;\n#endif\n\n#ifdef USE_SPECULAR_TEXTURE\n   UNI sampler2D texSpec;\n   UNI sampler2D texSpecMatCap;\n#endif\n\n#ifdef HAS_AO_TEXTURE\n    UNI sampler2D texAo;\n    UNI float aoIntensity;\n#endif\n\n#ifdef HAS_NORMAL_TEXTURE\n    IN vec3 vBiTangent;\n    IN vec3 vTangent;\n    IN mat3 normalMatrix;\n\n    UNI sampler2D texNormal;\n    UNI float normalMapIntensity;\n#endif\n\n#ifdef HAS_TEXTURE_OPACITY\n    UNI sampler2D texOpacity;\n#endif\n\n#ifdef CALC_SSNORMALS\n    IN vec3 eye_relative_pos;\n\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    vec3 CalculateScreenSpaceNormals() {\n    \tvec3 dFdxPos = dFdx(eye_relative_pos);\n    \tvec3 dFdyPos = dFdy(eye_relative_pos);\n    \tvec3 screenSpaceNormal = normalize( cross(dFdxPos, dFdyPos));\n        return normalize(screenSpaceNormal);\n    }\n#endif\n\n// * taken & modified from https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderLib/meshmatcap_frag.glsl.js\nvec2 getMatCapUV(vec3 viewSpacePosition, vec3 normal) {\n    vec3 viewDir = normalize(-viewSpacePosition);\n\tvec3 x = normalize(vec3(viewDir.z, 0.0, - viewDir.x));\n\tvec3 y = normalize(cross(viewDir, x));\n\tvec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks\n\treturn uv;\n}\n\nvoid main()\n{\n    vec3 viewSpaceNormal = normalize(transformedNormal);\n\n\n\n    #ifdef HAS_TEXTURES\n        vec2 texCoords = texCoord;\n        {{MODULE_BEGIN_FRAG}}\n    #endif\n\n\n\n    #ifdef DOUBLE_SIDED\n        if(!gl_FrontFacing) viewSpaceNormal *= -1.0;\n    #endif\n\n    #ifdef CALC_SSNORMALS\n        viewSpaceNormal = CalculateScreenSpaceNormals();\n    #endif\n\n\n\n   #ifdef HAS_NORMAL_TEXTURE\n        vec3 normalFromMap = texture( texNormal, texCoord ).xyz * 2.0 - 1.0;\n        normalFromMap = normalize(normalFromMap);\n\n        vec3 tangent;\n        vec3 binormal;\n\n        #ifdef CALC_TANGENT\n            vec3 c1 = cross(normalFromMap, vec3(0.0, 0.0, 1.0));\n            vec3 c2 = cross(normalFromMap, vec3(0.0, 1.0, 0.0));\n\n            tangent = c1;\n            tangent = normalize(tangent);\n            binormal = cross(viewSpaceNormal, tangent);\n            binormal = normalize(binormal);\n        #endif\n\n        #ifndef CALC_TANGENT\n            tangent = normalize(normalMatrix * vTangent);\n            vec3 bitangent = normalize(normalMatrix * vBiTangent);\n            binormal = normalize(cross(viewSpaceNormal, bitangent));\n        #endif\n\n        normalFromMap = normalize(\n            tangent * normalFromMap.x\n            + binormal * normalFromMap.y\n            + viewSpaceNormal * normalFromMap.z\n        );\n\n        vec3 mixedNormal = normalize(viewSpaceNormal + normalFromMap * normalMapIntensity);\n\n        viewSpaceNormal = mixedNormal;\n    #endif\n\n    vec4 col = texture(texMatcap, getMatCapUV(viewSpacePosition, viewSpaceNormal));\n\n    #ifdef HAS_DIFFUSE_TEXTURE\n        col = col*texture(texDiffuse, texCoords);\n    #endif\n\n    col.rgb *= inColor.rgb;\n\n\n    #ifdef HAS_AO_TEXTURE\n        col = col\n            * mix(\n                vec4(1.0,1.0,1.0,1.0),\n                texture(texAo, texCoords),\n                aoIntensity\n            );\n    #endif\n\n    #ifdef USE_SPECULAR_TEXTURE\n        vec4 spec = texture(texSpecMatCap, getMatCapUV(viewSpacePosition, viewSpaceNormal));\n        spec *= texture(texSpec, texCoords);\n        col += spec;\n    #endif\n\n    col.a *= inColor.a;\n\n    #ifdef HAS_TEXTURE_OPACITY\n        #ifdef TRANSFORMALPHATEXCOORDS\n            texCoords=vec2(texCoord.s,1.0-texCoord.t);\n            texCoords.y = 1. - texCoords.y;\n        #endif\n        #ifdef ALPHA_MASK_ALPHA\n            col.a*=texture(texOpacity,texCoords).a;\n        #endif\n        #ifdef ALPHA_MASK_LUMI\n            col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,texCoords).rgb);\n        #endif\n        #ifdef ALPHA_MASK_R\n            col.a*=texture(texOpacity,texCoords).r;\n        #endif\n        #ifdef ALPHA_MASK_G\n            col.a*=texture(texOpacity,texCoords).g;\n        #endif\n        #ifdef ALPHA_MASK_B\n            col.a*=texture(texOpacity,texCoords).b;\n        #endif\n\n        #ifdef DISCARDTRANS\n            if(col.a < 0.2) discard;\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    outColor = col;\n}","matcap_vert":"IN vec3 vPosition;\n\n#ifdef HAS_TEXTURES\n    IN vec2 attrTexCoord;\n#endif\n\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n#ifdef HAS_NORMAL_TEXTURE\n    IN vec3 attrTangent;\n    IN vec3 attrBiTangent;\n    OUT vec3 vBiTangent;\n    OUT vec3 vTangent;\n#endif\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\nUNI vec3 camPos;\n\n#ifdef HAS_TEXTURES\n    UNI vec2 texOffset;\n    UNI vec2 texRepeat;\n    OUT vec2 texCoord;\n#endif\n\nOUT mat3 normalMatrix;\nOUT vec3 viewSpacePosition;\nOUT vec3 transformedNormal;\n\n{{MODULES_HEAD}}\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    OUT vec3 eye_relative_pos;\n#endif\n\nmat3 transposeMat3(mat3 m) {\n    return mat3(m[0][0], m[1][0], m[2][0],\n        m[0][1], m[1][1], m[2][1],\n        m[0][2], m[1][2], m[2][2]);\n}\n\n mat3 inverseMat3(mat3 m) {\n    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];\n    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];\n    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];\n\n    float b01 = a22 * a11 - a12 * a21;\n    float b11 = -a22 * a10 + a12 * a20;\n    float b21 = a21 * a10 - a11 * a20;\n\n    float det = a00 * b01 + a01 * b11 + a02 * b21;\n\n    return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),\n        b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),\n        b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;\n}\n\nvoid main()\n{\n    #ifdef HAS_TEXTURES\n        texCoord = texRepeat * vec2(attrTexCoord.x, attrTexCoord.y) + texOffset;\n        texCoord.y = 1. - texCoord.y;\n    #endif\n\n    mat4 mMatrix = modelMatrix;\n    mat4 mvMatrix;\n\n    #ifdef HAS_NORMAL_TEXTURE\n        vec3 tangent = attrTangent;\n        vec3 bitangent = attrBiTangent;\n        vTangent = attrTangent;\n        vBiTangent = attrBiTangent;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.);\n    vec3 norm = attrVertNormal;\n\n    {{MODULE_VERTEX_POSITION}}\n\n    mvMatrix = viewMatrix * mMatrix;\n    vec3 normal = norm;\n\n    normalMatrix = transposeMat3(inverseMat3(mat3(mvMatrix)));\n\n    vec3 fragPos = vec3((mvMatrix) * pos);\n    viewSpacePosition = normalize(fragPos);\n\n    #ifdef CALC_SSNORMALS\n        eye_relative_pos = -(vec3(viewMatrix * vec4(camPos, 1.)) - fragPos);\n    #endif\n\n    transformedNormal = normalize(mat3(normalMatrix) * normal);\n\n    mat4 modelViewMatrix=mvMatrix;\n    {{MODULE_VERTEX_MODELVIEW}}\n\n    gl_Position = projMatrix * modelViewMatrix * pos;\n\n}\n",};
const cgl = op.patch.cgl;

const
    render = op.inTrigger("Render"),
    textureMatcap = op.inTexture("MatCap"),
    textureDiffuse = op.inTexture("Diffuse"),
    textureNormal = op.inTexture("Normal"),
    textureSpec = op.inTexture("Specular Mask"),
    textureSpecMatCap = op.inTexture("Specular MatCap"),
    textureAo = op.inTexture("AO Texture"),
    textureOpacity = op.inTexture("Opacity Texture"),
    r = op.inValueSlider("r", 1),
    g = op.inValueSlider("g", 1),
    b = op.inValueSlider("b", 1),
    pOpacity = op.inValueSlider("Opacity", 1),
    aoIntensity = op.inValueSlider("AO Intensity", 1.0),
    normalMapIntensity = op.inFloatSlider("Normal Map Intensity", 1),
    repeatX = op.inValue("Repeat X", 1),
    repeatY = op.inValue("Repeat Y", 1),
    offsetX = op.inValue("Offset X", 0),
    offsetY = op.inValue("Offset Y", 0),
    inDoubleSided = op.inValueBool("Double Sided"),
    ssNormals = op.inValueBool("Screen Space Normals"),
    calcTangents = op.inValueBool("Calc normal tangents", true),
    texCoordAlpha = op.inValueBool("Opacity TexCoords Transform", false),
    discardTransPxl = op.inValueBool("Discard Transparent Pixels"),

    next = op.outTrigger("Next"),
    shaderOut = op.outObject("Shader");

r.setUiAttribs({ "colorPick": true });

const alphaMaskSource = op.inSwitch("Alpha Mask Source", ["Luminance", "R", "G", "B", "A"], "Luminance");
alphaMaskSource.setUiAttribs({ "greyout": true });

op.setPortGroup("Normals", [calcTangents, ssNormals, inDoubleSided]);
op.setPortGroup("Texture Opacity", [alphaMaskSource, texCoordAlpha, discardTransPxl]);
op.setPortGroup("Texture Transforms", [aoIntensity, normalMapIntensity, repeatX, repeatY, offsetX, offsetY]);
op.setPortGroup("Texture Maps", [textureDiffuse, textureNormal, textureSpec, textureSpecMatCap, textureAo, textureOpacity]);
op.setPortGroup("Color", [r, g, b, pOpacity]);

const shader = new CGL.Shader(cgl, "MatCapMaterialNew3");
const uniOpacity = new CGL.Uniform(shader, "f", "opacity", pOpacity);

shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG", "MODULE_VERTEX_MODELVIEW"]);
shader.setSource(attachments.matcap_vert, attachments.matcap_frag);
shaderOut.set(shader);

const textureMatcapUniform = new CGL.Uniform(shader, "t", "texMatcap");
let textureDiffuseUniform = null;
let textureNormalUniform = null;
let normalMapIntensityUniform = null;
let textureSpecUniform = null;
let textureSpecMatCapUniform = null;
let textureAoUniform = null;
const offsetUniform = new CGL.Uniform(shader, "2f", "texOffset", offsetX, offsetY);
const repeatUniform = new CGL.Uniform(shader, "2f", "texRepeat", repeatX, repeatY);

const aoIntensityUniform = new CGL.Uniform(shader, "f", "aoIntensity", aoIntensity);
const colorUniform = new CGL.Uniform(shader, "4f", "inColor", r, g, b, pOpacity);

inDoubleSided.onChange =
calcTangents.onChange = updateDefines;
updateDefines();

function updateDefines()
{
    shader.toggleDefine("DOUBLE_SIDED", inDoubleSided.get());

    if (calcTangents.get()) shader.define("CALC_TANGENT");
    else shader.removeDefine("CALC_TANGENT");
}

ssNormals.onChange = function ()
{
    if (ssNormals.get())
    {
        if (cgl.glVersion < 2)
        {
            cgl.gl.getExtension("OES_standard_derivatives");
            shader.enableExtension("GL_OES_standard_derivatives");
        }

        shader.define("CALC_SSNORMALS");
    }
    else shader.removeDefine("CALC_SSNORMALS");
};

textureMatcap.onChange = updateMatcap;

function updateMatcap()
{
    if (!cgl.defaultMatcapTex3)
    {
        const pixels = new Uint8Array(256 * 4);
        for (let x = 0; x < 16; x++)
        {
            for (let y = 0; y < 16; y++)
            {
                let c = y * 16;
                c *= Math.min(1, (x + y / 3) / 8);
                pixels[(x + y * 16) * 4 + 0] = pixels[(x + y * 16) * 4 + 1] = pixels[(x + y * 16) * 4 + 2] = c;
                pixels[(x + y * 16) * 4 + 3] = 255;
            }
        }

        cgl.defaultMatcapTex3 = new CGL.Texture(cgl);
        cgl.defaultMatcapTex3.initFromData(pixels, 16, 16, CGL.Texture.FILTER_LINEAR, CGL.Texture.WRAP_REPEAT);
    }
}

textureDiffuse.onChange = function ()
{
    if (textureDiffuse.get())
    {
        if (textureDiffuseUniform !== null) return;
        shader.define("HAS_DIFFUSE_TEXTURE");
        shader.removeUniform("texDiffuse");
        textureDiffuseUniform = new CGL.Uniform(shader, "t", "texDiffuse");
    }
    else
    {
        shader.removeDefine("HAS_DIFFUSE_TEXTURE");
        shader.removeUniform("texDiffuse");
        textureDiffuseUniform = null;
    }
};

textureNormal.onChange = function ()
{
    if (textureNormal.get())
    {
        if (textureNormalUniform !== null) return;
        shader.define("HAS_NORMAL_TEXTURE");
        shader.removeUniform("texNormal");
        textureNormalUniform = new CGL.Uniform(shader, "t", "texNormal");
        if (!normalMapIntensityUniform) normalMapIntensityUniform = new CGL.Uniform(shader, "f", "normalMapIntensity", normalMapIntensity);
    }
    else
    {
        shader.removeDefine("HAS_NORMAL_TEXTURE");
        shader.removeUniform("texNormal");
        textureNormalUniform = null;
    }
};

textureAo.onChange = function ()
{
    if (textureAo.get())
    {
        if (textureAoUniform !== null) return;
        shader.define("HAS_AO_TEXTURE");
        shader.removeUniform("texAo");
        textureAoUniform = new CGL.Uniform(shader, "t", "texAo");
    }
    else
    {
        shader.removeDefine("HAS_AO_TEXTURE");
        shader.removeUniform("texAo");
        textureAoUniform = null;
    }
};

textureSpec.onChange = textureSpecMatCap.onChange = function ()
{
    if (textureSpec.get() && textureSpecMatCap.get())
    {
        if (textureSpecUniform !== null) return;
        shader.define("USE_SPECULAR_TEXTURE");
        shader.removeUniform("texSpec");
        shader.removeUniform("texSpecMatCap");
        textureSpecUniform = new CGL.Uniform(shader, "t", "texSpec");
        textureSpecMatCapUniform = new CGL.Uniform(shader, "t", "texSpecMatCap");
    }
    else
    {
        shader.removeDefine("USE_SPECULAR_TEXTURE");
        shader.removeUniform("texSpec");
        shader.removeUniform("texSpecMatCap");
        textureSpecUniform = null;
        textureSpecMatCapUniform = null;
    }
};

// TEX OPACITY

function updateAlphaMaskMethod()
{
    if (alphaMaskSource.get() == "Alpha Channel") shader.define("ALPHA_MASK_ALPHA");
    else shader.removeDefine("ALPHA_MASK_ALPHA");

    if (alphaMaskSource.get() == "Luminance") shader.define("ALPHA_MASK_LUMI");
    else shader.removeDefine("ALPHA_MASK_LUMI");

    if (alphaMaskSource.get() == "R") shader.define("ALPHA_MASK_R");
    else shader.removeDefine("ALPHA_MASK_R");

    if (alphaMaskSource.get() == "G") shader.define("ALPHA_MASK_G");
    else shader.removeDefine("ALPHA_MASK_G");

    if (alphaMaskSource.get() == "B") shader.define("ALPHA_MASK_B");
    else shader.removeDefine("ALPHA_MASK_B");
}

alphaMaskSource.onChange = updateAlphaMaskMethod;
textureOpacity.onChange = updateOpacity;

let textureOpacityUniform = null;

function updateOpacity()
{
    if (textureOpacity.get())
    {
        if (textureOpacityUniform !== null) return;
        shader.removeUniform("texOpacity");
        shader.define("HAS_TEXTURE_OPACITY");
        if (!textureOpacityUniform) textureOpacityUniform = new CGL.Uniform(shader, "t", "texOpacity");

        alphaMaskSource.setUiAttribs({ "greyout": false });
        discardTransPxl.setUiAttribs({ "greyout": false });
        texCoordAlpha.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeUniform("texOpacity");
        shader.removeDefine("HAS_TEXTURE_OPACITY");
        textureOpacityUniform = null;

        alphaMaskSource.setUiAttribs({ "greyout": true });
        discardTransPxl.setUiAttribs({ "greyout": true });
        texCoordAlpha.setUiAttribs({ "greyout": true });
    }
    updateAlphaMaskMethod();
}

discardTransPxl.onChange = function ()
{
    if (discardTransPxl.get()) shader.define("DISCARDTRANS");
    else shader.removeDefine("DISCARDTRANS");
};

texCoordAlpha.onChange = function ()
{
    if (texCoordAlpha.get()) shader.define("TRANSFORMALPHATEXCOORDS");
    else shader.removeDefine("TRANSFORMALPHATEXCOORDS");
};

function checkUiErrors()
{
    if (textureSpec.get() && !textureSpecMatCap.get())
    {
        op.setUiError("specNoMatCapSpec", "You connected a specular texture but have not connected a specular matcap texture. You need to connect both texture inputs for the specular input to work.", 1);
        op.setUiError("noSpecMatCapSpec", null);
    }
    else if (!textureSpec.get() && textureSpecMatCap.get())
    {
        op.setUiError("noSpecMatCapSpec", "You connected a specular matcap texture but have not connected a specular texture. You need to connect both texture inputs for the specular input to work.", 1);
        op.setUiError("specNoMatCapSpec", null);
    }
    else if (textureSpec.get() && textureSpecMatCap.get())
    {
        op.setUiError("specNoMatCapSpec", null);
        op.setUiError("noSpecMatCapSpec", null);
    }
    else
    {
        op.setUiError("specNoMatCapSpec", null);
        op.setUiError("noSpecMatCapSpec", null);
    }
}

render.onTriggered = function ()
{
    checkUiErrors();

    if (!cgl.defaultMatcapTex3) updateMatcap();
    shader.popTextures();

    const tex = textureMatcap.get() || cgl.defaultMatcapTex3;
    shader.pushTexture(textureMatcapUniform, tex.tex);

    if (textureDiffuse.get() && textureDiffuseUniform) shader.pushTexture(textureDiffuseUniform, textureDiffuse.get().tex);
    if (textureNormal.get() && textureNormalUniform) shader.pushTexture(textureNormalUniform, textureNormal.get().tex);
    if (textureSpec.get() && textureSpecUniform) shader.pushTexture(textureSpecUniform, textureSpec.get().tex);
    if (textureSpecMatCap.get() && textureSpecMatCapUniform) shader.pushTexture(textureSpecMatCapUniform, textureSpecMatCap.get().tex);
    if (textureAo.get() && textureAoUniform) shader.pushTexture(textureAoUniform, textureAo.get().tex);
    if (textureOpacity.get() && textureOpacityUniform) shader.pushTexture(textureOpacityUniform, textureOpacity.get().tex);

    cgl.pushShader(shader);
    next.trigger();
    cgl.popShader();
};


};

Ops.Gl.Shader.MatCapMaterial_v3.prototype = new CABLES.Op();
CABLES.OPS["c1dd6e76-61b4-471a-b8d1-f550a5a9a4f4"]={f:Ops.Gl.Shader.MatCapMaterial_v3,objName:"Ops.Gl.Shader.MatCapMaterial_v3"};




// **************************************************************
// 
// Ops.Gl.Texture_v2
// 
// **************************************************************

Ops.Gl.Texture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    filename = op.inUrl("File", [".jpg", ".png", ".webp", ".jpeg", ".avif"]),
    tfilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"]),
    wrap = op.inValueSelect("Wrap", ["repeat", "mirrored repeat", "clamp to edge"], "clamp to edge"),
    aniso = op.inSwitch("Anisotropic", ["0", "1", "2", "4", "8", "16"], "0"),
    dataFrmt = op.inSwitch("Data Format", ["R", "RG", "RGB", "RGBA", "SRGBA"], "RGBA"),
    flip = op.inValueBool("Flip", false),
    unpackAlpha = op.inValueBool("Pre Multiplied Alpha", false),
    active = op.inValueBool("Active", true),
    inFreeMemory = op.inBool("Save Memory", true),
    textureOut = op.outTexture("Texture"),
    addCacheBust = op.inBool("Add Cachebuster", false),
    inReload = op.inTriggerButton("Reload"),
    width = op.outNumber("Width"),
    height = op.outNumber("Height"),
    ratio = op.outNumber("Aspect Ratio"),
    loaded = op.outBoolNum("Loaded", 0),
    loading = op.outBoolNum("Loading", 0);

const cgl = op.patch.cgl;

op.toWorkPortsNeedToBeLinked(textureOut);
op.setPortGroup("Size", [width, height]);

let loadedFilename = null;
let loadingId = null;
let tex = null;
let cgl_filter = CGL.Texture.FILTER_MIPMAP;
let cgl_wrap = CGL.Texture.WRAP_REPEAT;
let cgl_aniso = 0;
let timedLoader = 0;

unpackAlpha.setUiAttribs({ "hidePort": true });
unpackAlpha.onChange =
    filename.onChange =
    dataFrmt.onChange =
    addCacheBust.onChange =
    flip.onChange = reloadSoon;
aniso.onChange = tfilter.onChange = onFilterChange;
wrap.onChange = onWrapChange;

tfilter.set("mipmap");
wrap.set("repeat");

textureOut.setRef(CGL.Texture.getEmptyTexture(cgl));

inReload.onTriggered = reloadSoon;

active.onChange = function ()
{
    if (active.get())
    {
        if (loadedFilename != filename.get() || !tex) reloadSoon();
        else textureOut.setRef(tex);
    }
    else
    {
        textureOut.setRef(CGL.Texture.getEmptyTexture(cgl));
        width.set(CGL.Texture.getEmptyTexture(cgl).width);
        height.set(CGL.Texture.getEmptyTexture(cgl).height);
        if (tex)tex.delete();
        op.setUiAttrib({ "extendTitle": "" });
        tex = null;
    }
};

const setTempTexture = function ()
{
    const t = CGL.Texture.getTempTexture(cgl);
    textureOut.setRef(t);
};

function reloadSoon(nocache)
{
    clearTimeout(timedLoader);
    timedLoader = setTimeout(function ()
    {
        realReload(nocache);
    }, 1);
}

function getPixelFormat()
{
    if (dataFrmt.get() == "R") return CGL.Texture.PFORMATSTR_R8UB;
    if (dataFrmt.get() == "RG") return CGL.Texture.PFORMATSTR_RG8UB;
    if (dataFrmt.get() == "RGB") return CGL.Texture.PFORMATSTR_RGB8UB;
    if (dataFrmt.get() == "SRGBA") return CGL.Texture.PFORMATSTR_SRGBA8;

    return CGL.Texture.PFORMATSTR_RGBA8UB;
}

function realReload(nocache)
{
    op.checkMainloopExists();
    if (!active.get()) return;
    if (loadingId)loadingId = cgl.patch.loading.finished(loadingId);

    loadingId = cgl.patch.loading.start(op.objName, filename.get(), op);

    let url = op.patch.getFilePath(String(filename.get()));

    if (addCacheBust.get() || nocache === true) url = CABLES.cacheBust(url);

    if (String(filename.get()).indexOf("data:") == 0) url = filename.get();

    let needsRefresh = false;
    loadedFilename = filename.get();

    if ((filename.get() && filename.get().length > 1))
    {
        loaded.set(false);
        loading.set(true);

        const fileToLoad = filename.get();

        op.setUiAttrib({ "extendTitle": CABLES.basename(url) });
        if (needsRefresh) op.refreshParams();

        cgl.patch.loading.addAssetLoadingTask(() =>
        {
            op.setUiError("urlerror", null);
            CGL.Texture.load(cgl, url, function (err, newTex)
            {
                cgl.checkFrameStarted("texture inittexture");

                if (filename.get() != fileToLoad)
                {
                    loadingId = cgl.patch.loading.finished(loadingId);
                    return;
                }

                if (tex)tex.delete();

                if (err)
                {
                    const t = CGL.Texture.getErrorTexture(cgl);
                    textureOut.setRef(t);

                    op.setUiError("urlerror", "could not load texture: \"" + filename.get() + "\"", 2);
                    loadingId = cgl.patch.loading.finished(loadingId);
                    return;
                }

                // textureOut.setRef(newTex);

                width.set(newTex.width);
                height.set(newTex.height);
                ratio.set(newTex.width / newTex.height);

                // if (!newTex.isPowerOfTwo()) op.setUiError("npot", "Texture dimensions not power of two! - Texture filtering will not work in WebGL 1.", 0);
                // else op.setUiError("npot", null);

                tex = newTex;
                // textureOut.setRef(null);
                textureOut.setRef(tex);

                loading.set(false);
                loaded.set(true);

                if (inFreeMemory.get()) tex.image = null;

                if (loadingId)
                {
                    loadingId = cgl.patch.loading.finished(loadingId);
                }
                op.checkMainloopExists();
            }, {
                "anisotropic": cgl_aniso,
                "wrap": cgl_wrap,
                "flip": flip.get(),
                "unpackAlpha": unpackAlpha.get(),
                "pixelFormat": getPixelFormat(),
                "filter": cgl_filter
            });

            op.checkMainloopExists();
        });
    }
    else
    {
        setTempTexture();
        loadingId = cgl.patch.loading.finished(loadingId);
    }
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") cgl_filter = CGL.Texture.FILTER_NEAREST;
    else if (tfilter.get() == "linear") cgl_filter = CGL.Texture.FILTER_LINEAR;
    else if (tfilter.get() == "mipmap") cgl_filter = CGL.Texture.FILTER_MIPMAP;
    else if (tfilter.get() == "Anisotropic") cgl_filter = CGL.Texture.FILTER_ANISOTROPIC;
    aniso.setUiAttribs({ "greyout": cgl_filter != CGL.Texture.FILTER_MIPMAP });

    cgl_aniso = parseFloat(aniso.get());

    reloadSoon();
}

function onWrapChange()
{
    if (wrap.get() == "repeat") cgl_wrap = CGL.Texture.WRAP_REPEAT;
    if (wrap.get() == "mirrored repeat") cgl_wrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (wrap.get() == "clamp to edge") cgl_wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged = function (fn)
{
    if (filename.get() && filename.get().indexOf(fn) > -1)
    {
        textureOut.setRef(CGL.Texture.getEmptyTexture(op.patch.cgl));
        textureOut.setRef(CGL.Texture.getTempTexture(cgl));
        realReload(true);
    }
};


};

Ops.Gl.Texture_v2.prototype = new CABLES.Op();
CABLES.OPS["790f3702-9833-464e-8e37-6f0f813f7e16"]={f:Ops.Gl.Texture_v2,objName:"Ops.Gl.Texture_v2"};




// **************************************************************
// 
// Ops.Gl.RenderToTexture_v3
// 
// **************************************************************

Ops.Gl.RenderToTexture_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    inSize = op.inSwitch("Size", ["Canvas", "Manual"], "Canvas"),
    width = op.inValueInt("texture width", 512),
    height = op.inValueInt("texture height", 512),
    aspect = op.inBool("Auto Aspect", true),
    tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inSwitch("Wrap", ["Clamp", "Repeat", "Mirror"], "Repeat"),
    msaa = op.inSwitch("MSAA", ["none", "2x", "4x", "8x"], "none"),
    trigger = op.outTrigger("trigger"),
    tex = op.outTexture("texture"),
    texDepth = op.outTexture("textureDepth"),
    inPixelFormat = op.inDropDown("Pixel Format", CGL.Texture.PIXELFORMATS, CGL.Texture.PFORMATSTR_RGBA8UB),
    depth = op.inValueBool("Depth", true),
    clear = op.inValueBool("Clear", true);

const cgl = op.patch.cgl;
let fb = null;
let reInitFb = true;

op.setPortGroup("Size", [inSize, width, height, aspect]);

inPixelFormat.onChange =
    depth.onChange =
    clear.onChange =
    tfilter.onChange =
    twrap.onChange =
    msaa.onChange = initFbLater;

inSize.onChange = updateUi;

render.onTriggered =
    op.preRender = doRender;

updateUi();

function updateUi()
{
    width.setUiAttribs({ "greyout": inSize.get() != "Manual" });
    height.setUiAttribs({ "greyout": inSize.get() != "Manual" });
    aspect.setUiAttribs({ "greyout": inSize.get() != "Manual" });
}

function initFbLater()
{
    reInitFb = true;
}

function doRender()
{
    CGL.TextureEffect.checkOpNotInTextureEffect(op);

    if (!fb || reInitFb)
    {
        if (fb) fb.delete();

        let selectedWrap = CGL.Texture.WRAP_REPEAT;
        if (twrap.get() == "Clamp") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;
        else if (twrap.get() == "Mirror") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;

        let selectFilter = CGL.Texture.FILTER_NEAREST;
        if (tfilter.get() == "nearest") selectFilter = CGL.Texture.FILTER_NEAREST;
        else if (tfilter.get() == "linear") selectFilter = CGL.Texture.FILTER_LINEAR;
        else if (tfilter.get() == "mipmap") selectFilter = CGL.Texture.FILTER_MIPMAP;

        if (inPixelFormat.get().indexOf("loat") && tfilter.get() == "mipmap") op.setUiError("fpmipmap", "Can't use mipmap and float texture at the same time");
        else op.setUiError("fpmipmap", null);

        if (cgl.glVersion >= 2)
        {
            let ms = true;
            let msSamples = 4;

            if (msaa.get() == "none")
            {
                msSamples = 0;
                ms = false;
            }
            if (msaa.get() == "2x") msSamples = 2;
            if (msaa.get() == "4x") msSamples = 4;
            if (msaa.get() == "8x") msSamples = 8;

            fb = new CGL.Framebuffer2(cgl, 8, 8,
                {
                    "name": "render2texture " + op.id,
                    "pixelFormat": inPixelFormat.get(),
                    "multisampling": ms,
                    "multisamplingSamples": msSamples,
                    "wrap": selectedWrap,
                    "filter": selectFilter,
                    "depth": depth.get(),
                    "clear": clear.get()
                });
        }
        else
        {
            fb = new CGL.Framebuffer(cgl, 8, 8, { "isFloatingPointTexture": false, "clear": clear.get() });
        }

        if (fb && fb.valid)
        {
            texDepth.set(fb.getTextureDepth());
            reInitFb = false;
        }
        else
        {
            fb = null;
            reInitFb = true;
        }
    }

    let setAspect = aspect.get();

    if (inSize.get() == "Canvas")
    {
        setAspect = true;
        width.set(op.patch.cgl.checkTextureSize(cgl.canvasWidth));
        height.set(op.patch.cgl.checkTextureSize(cgl.canvasHeight));
    }

    if (fb.getWidth() != op.patch.cgl.checkTextureSize(width.get()) || fb.getHeight() != op.patch.cgl.checkTextureSize(height.get()))
    {
        fb.setSize(
            op.patch.cgl.checkTextureSize(width.get()),
            op.patch.cgl.checkTextureSize(height.get()));
    }

    fb.renderStart(cgl);

    cgl.pushViewPort(0, 0, width.get(), height.get());

    if (setAspect) mat4.perspective(cgl.pMatrix, 45, width.get() / height.get(), 0.1, 1000.0);

    trigger.trigger();
    fb.renderEnd(cgl);

    cgl.popViewPort();

    texDepth.setRef(fb.getTextureDepth());
    tex.setRef(fb.getTextureColor());
}

//


};

Ops.Gl.RenderToTexture_v3.prototype = new CABLES.Op();
CABLES.OPS["41eec5c7-c480-477a-be81-04c3efac8357"]={f:Ops.Gl.RenderToTexture_v3,objName:"Ops.Gl.RenderToTexture_v3"};




// **************************************************************
// 
// Ops.Gl.Meshes.Rectangle_v4
// 
// **************************************************************

Ops.Gl.Meshes.Rectangle_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    doRender = op.inValueBool("Render Mesh", true),
    width = op.inValue("width", 1),
    height = op.inValue("height", 1),
    pivotX = op.inSwitch("pivot x", ["left", "center", "right"], "center"),
    pivotY = op.inSwitch("pivot y", ["top", "center", "bottom"], "center"),
    axis = op.inSwitch("axis", ["xy", "xz"], "xy"),
    flipTcX = op.inBool("Flip TexCoord X", false),
    flipTcY = op.inBool("Flip TexCoord Y", true),
    nColumns = op.inValueInt("num columns", 1),
    nRows = op.inValueInt("num rows", 1),
    trigger = op.outTrigger("trigger"),
    geomOut = op.outObject("geometry", null, "geometry");

geomOut.ignoreValueSerialize = true;

// const cgl = op.patch.cg || op.patch.cgl;
const geom = new CGL.Geometry("rectangle");

doRender.setUiAttribs({ "title": "Render" });
render.setUiAttribs({ "title": "Trigger" });
trigger.setUiAttribs({ "title": "Next" });
op.setPortGroup("Pivot", [pivotX, pivotY, axis]);
op.setPortGroup("Size", [width, height]);
op.setPortGroup("Structure", [nColumns, nRows]);
op.toWorkPortsNeedToBeLinked(render);
op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_TRIGGER);

const AXIS_XY = 0;
const AXIS_XZ = 1;

let curAxis = AXIS_XY;
let mesh = null;
let needsRebuild = true;
let doScale = true;

const vScale = vec3.create();
vec3.set(vScale, 1, 1, 1);

axis.onChange =
    pivotX.onChange =
    pivotY.onChange =
    flipTcX.onChange =
    flipTcY.onChange =
    nRows.onChange =
    nColumns.onChange = rebuildLater;
updateScale();

width.onChange =
    height.onChange =
    () =>
    {
        if (doScale) updateScale();
        else needsRebuild = true;
    };

function updateScale()
{
    if (curAxis === AXIS_XY) vec3.set(vScale, width.get(), height.get(), 1);
    if (curAxis === AXIS_XZ) vec3.set(vScale, width.get(), 1, height.get());
}

geomOut.onLinkChanged = () =>
{
    doScale = !geomOut.isLinked();
    updateScale();
    needsRebuild = true;
};

function rebuildLater()
{
    needsRebuild = true;
}

render.onTriggered = () =>
{
    if (needsRebuild) rebuild();
    const cg = op.patch.cg;
    if (cg && mesh && doRender.get())
    {
        if (doScale)
        {
            cg.pushModelMatrix();
            mat4.scale(cg.mMatrix, cg.mMatrix, vScale);
        }

        mesh.render(cg.getShader());

        if (doScale) cg.popModelMatrix();
    }

    trigger.trigger();
};

op.onDelete = () =>
{
    if (mesh) mesh.dispose();
    rebuildLater();
};

function rebuild()
{
    if (axis.get() == "xy") curAxis = AXIS_XY;
    if (axis.get() == "xz") curAxis = AXIS_XZ;

    updateScale();
    let w = width.get();
    let h = height.get();

    if (doScale) w = h = 1;

    let x = 0;
    let y = 0;

    if (pivotX.get() == "center") x = 0;
    else if (pivotX.get() == "right") x = -w / 2;
    else if (pivotX.get() == "left") x = +w / 2;

    if (pivotY.get() == "center") y = 0;
    else if (pivotY.get() == "top") y = -h / 2;
    else if (pivotY.get() == "bottom") y = +h / 2;

    const numRows = Math.max(1, Math.round(nRows.get()));
    const numColumns = Math.max(1, Math.round(nColumns.get()));

    const stepColumn = w / numColumns;
    const stepRow = h / numRows;

    const indices = [];
    const tc = new Float32Array((numColumns + 1) * (numRows + 1) * 2);
    const verts = new Float32Array((numColumns + 1) * (numRows + 1) * 3);
    const norms = new Float32Array((numColumns + 1) * (numRows + 1) * 3);
    const tangents = new Float32Array((numColumns + 1) * (numRows + 1) * 3);
    const biTangents = new Float32Array((numColumns + 1) * (numRows + 1) * 3);

    let idxTc = 0;
    let idxVert = 0;
    let idxNorms = 0;
    let idxTangent = 0;
    let idxBiTangent = 0;

    for (let r = 0; r <= numRows; r++)
    {
        for (let c = 0; c <= numColumns; c++)
        {
            verts[idxVert++] = c * stepColumn - w / 2 + x;
            if (curAxis == AXIS_XZ) verts[idxVert++] = 0;
            verts[idxVert++] = r * stepRow - h / 2 + y;

            if (curAxis == AXIS_XY)verts[idxVert++] = 0;

            tc[idxTc++] = c / numColumns;
            tc[idxTc++] = r / numRows;

            if (curAxis == AXIS_XY) // default
            {
                norms[idxNorms++] = 0;
                norms[idxNorms++] = 0;
                norms[idxNorms++] = 1;

                tangents[idxTangent++] = 1;
                tangents[idxTangent++] = 0;
                tangents[idxTangent++] = 0;

                biTangents[idxBiTangent++] = 0;
                biTangents[idxBiTangent++] = 1;
                biTangents[idxBiTangent++] = 0;
            }
            else if (curAxis == AXIS_XZ)
            {
                norms[idxNorms++] = 0;
                norms[idxNorms++] = 1;
                norms[idxNorms++] = 0;

                biTangents[idxBiTangent++] = 0;
                biTangents[idxBiTangent++] = 0;
                biTangents[idxBiTangent++] = 1;
            }
        }
    }

    indices.length = numColumns * numRows * 6;
    let idx = 0;

    for (let c = 0; c < numColumns; c++)
    {
        for (let r = 0; r < numRows; r++)
        {
            const ind = c + (numColumns + 1) * r;
            const v1 = ind;
            const v2 = ind + 1;
            const v3 = ind + numColumns + 1;
            const v4 = ind + 1 + numColumns + 1;

            if (curAxis == AXIS_XY) // default
            {
                indices[idx++] = v1;
                indices[idx++] = v2;
                indices[idx++] = v3;

                indices[idx++] = v3;
                indices[idx++] = v2;
                indices[idx++] = v4;
            }
            else
            if (curAxis == AXIS_XZ)
            {
                indices[idx++] = v1;
                indices[idx++] = v3;
                indices[idx++] = v2;

                indices[idx++] = v2;
                indices[idx++] = v3;
                indices[idx++] = v4;
            }
        }
    }

    if (flipTcY.get()) for (let i = 0; i < tc.length; i += 2)tc[i + 1] = 1.0 - tc[i + 1];
    if (flipTcX.get()) for (let i = 0; i < tc.length; i += 2)tc[i] = 1.0 - tc[i];

    geom.clear();
    geom.vertices = verts;
    geom.texCoords = tc;
    geom.verticesIndices = indices;
    geom.vertexNormals = norms;
    geom.tangents = tangents;
    geom.biTangents = biTangents;

    if (op.patch.cg)
        if (!mesh) mesh = op.patch.cg.createMesh(geom, { "opId": op.id });
        else mesh.setGeom(geom);

    geomOut.setRef(geom);
    needsRebuild = false;
}


};

Ops.Gl.Meshes.Rectangle_v4.prototype = new CABLES.Op();
CABLES.OPS["cc8c3ede-7103-410b-849f-a645793cab39"]={f:Ops.Gl.Meshes.Rectangle_v4,objName:"Ops.Gl.Meshes.Rectangle_v4"};




// **************************************************************
// 
// Ops.Gl.Matrix.TransformView
// 
// **************************************************************

Ops.Gl.Matrix.TransformView = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    posX = op.inValueFloat("posX"),
    posY = op.inValueFloat("posY"),
    posZ = op.inValueFloat("posZ"),
    scale = op.inValueFloat("scale"),
    rotX = op.inValueFloat("rotX"),
    rotY = op.inValueFloat("rotY"),
    rotZ = op.inValueFloat("rotZ"),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Position", [posX, posY, posZ]);
op.setPortGroup("Scale", [scale]);
op.setPortGroup("Rotation", [rotX, rotZ, rotY]);

const vPos = vec3.create();
const vScale = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

let doScale = false;
let doTranslate = false;

let translationChanged = true;
let didScaleChanged = true;
let didRotChanged = true;

render.onTriggered = function ()
{
    const cg = op.patch.cgl;

    let updateMatrix = false;
    if (translationChanged)
    {
        updateTranslation();
        updateMatrix = true;
    }
    if (didScaleChanged)
    {
        updateScale();
        updateMatrix = true;
    }
    if (didRotChanged)
    {
        updateMatrix = true;
    }
    if (updateMatrix)doUpdateMatrix();

    cg.pushViewMatrix();
    mat4.multiply(cg.vMatrix, cg.vMatrix, transMatrix);

    trigger.trigger();
    cg.popViewMatrix();

    if (op.isCurrentUiOp())
        gui.setTransformGizmo(
            {
                "posX": posX,
                "posY": posY,
                "posZ": posZ,
            });
};

op.transform3d = function ()
{
    return {
        "pos": [posX, posY, posZ]
    };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if (doTranslate)mat4.translate(transMatrix, transMatrix, vPos);

    if (rotX.get() !== 0)mat4.rotateX(transMatrix, transMatrix, rotX.get() * CGL.DEG2RAD);
    if (rotY.get() !== 0)mat4.rotateY(transMatrix, transMatrix, rotY.get() * CGL.DEG2RAD);
    if (rotZ.get() !== 0)mat4.rotateZ(transMatrix, transMatrix, rotZ.get() * CGL.DEG2RAD);

    if (doScale)mat4.scale(transMatrix, transMatrix, vScale);
    rotChanged = false;
}

function updateTranslation()
{
    doTranslate = false;
    if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0) doTranslate = true;
    vec3.set(vPos, posX.get(), posY.get(), posZ.get());
    translationChanged = false;
}

function updateScale()
{
    doScale = false;
    if (scale.get() !== 0.0)doScale = true;
    vec3.set(vScale, scale.get(), scale.get(), scale.get());
    scaleChanged = false;
}

function translateChanged()
{
    translationChanged = true;
}

function scaleChanged()
{
    didScaleChanged = true;
}

function rotChanged()
{
    didRotChanged = true;
}

rotX.onChange =
rotY.onChange =
rotZ.onChange = rotChanged;

scale.onChange = scaleChanged;

posX.onChange =
posY.onChange =
posZ.onChange = translateChanged;

rotX.set(0.0);
rotY.set(0.0);
rotZ.set(0.0);

scale.set(1.0);

posX.set(0.0);
posY.set(0.0);
posZ.set(0.0);

doUpdateMatrix();


};

Ops.Gl.Matrix.TransformView.prototype = new CABLES.Op();
CABLES.OPS["0b3e04f7-323e-4ac8-8a22-a21e2f36e0e9"]={f:Ops.Gl.Matrix.TransformView,objName:"Ops.Gl.Matrix.TransformView"};




// **************************************************************
// 
// Ops.Gl.Matrix.ScaleXYZViewMatrix
// 
// **************************************************************

Ops.Gl.Matrix.ScaleXYZViewMatrix = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    scaleX = op.inValueFloat("x", 1),
    scaleY = op.inValueFloat("y", 1),
    scaleZ = op.inValueFloat("z", 1),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
let vScale = vec3.create();
let transMatrix = mat4.create();
mat4.identity(transMatrix);

scaleX.onChange = scaleY.onChange = scaleZ.onChange = scaleChanged;
scaleChanged();

render.onTriggered = exec;

function exec()
{
    cgl.pushViewMatrix();
    mat4.multiply(cgl.vMatrix, cgl.vMatrix, transMatrix);
    trigger.trigger();
    cgl.popViewMatrix();
}

function scaleChanged()
{
    vec3.set(vScale, scaleX.get(), scaleY.get(), scaleZ.get());
    mat4.identity(transMatrix);
    mat4.scale(transMatrix, transMatrix, vScale);
}


};

Ops.Gl.Matrix.ScaleXYZViewMatrix.prototype = new CABLES.Op();
CABLES.OPS["8b1fa9c9-0c4d-41b6-9c4f-8f4b633a9d7f"]={f:Ops.Gl.Matrix.ScaleXYZViewMatrix,objName:"Ops.Gl.Matrix.ScaleXYZViewMatrix"};




// **************************************************************
// 
// Ops.Extension.Deprecated.ScaleXYZ
// 
// **************************************************************

Ops.Extension.Deprecated.ScaleXYZ = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    scaleX = op.inValueFloat("x", 1),
    scaleY = op.inValueFloat("y", 1),
    scaleZ = op.inValueFloat("z", 1),
    trigger = op.outTrigger("trigger");

const vScale = vec3.create();

let hasChanged = true;

scaleX.onChange = scaleY.onChange = scaleZ.onChange = scaleChanged;

scaleChanged();

render.onTriggered = execrender;

function execrender()
{
    const cgl = op.patch.cg || op.patch.cgl;

    if (hasChanged)
    {
        vec3.set(vScale, scaleX.get(), scaleY.get(), scaleZ.get());
        hasChanged = false;
    }

    cgl.pushModelMatrix();
    mat4.scale(cgl.mMatrix, cgl.mMatrix, vScale);
    trigger.trigger();
    cgl.popModelMatrix();
}

function scaleChanged()
{
    hasChanged = true;
}


};

Ops.Extension.Deprecated.ScaleXYZ.prototype = new CABLES.Op();
CABLES.OPS["9ba52457-5f0d-4b20-a97c-4ec4856b8e29"]={f:Ops.Extension.Deprecated.ScaleXYZ,objName:"Ops.Extension.Deprecated.ScaleXYZ"};




// **************************************************************
// 
// Ops.Gl.Meshes.Grid
// 
// **************************************************************

Ops.Gl.Meshes.Grid = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("Render"),
    inNum = op.inInt("Num", 10),
    inSpacing = op.inValue("Spacing", 1),
    inCenter = op.inBool("Center", true),
    axis = op.inSwitch("Axis", ["XY", "XZ"], "XY"),
    next = op.outTrigger("Next");

const cgl = op.patch.cgl;
let mesh = null;

axis.onChange =
    inCenter.onChange =
    inNum.onChange =
    inSpacing.onChange = function ()
    {
        if (mesh)mesh.dispose();
        mesh = null;
    };

function init()
{
    const geomStepsOne = new CGL.Geometry(op.name);
    const geomX = new CGL.Geometry(op.name);

    const space = inSpacing.get();
    const num = Math.floor(inNum.get());
    const l = space * num / 2;

    const tc = [];

    let start = -num / 2;
    let end = num / 2 + 1;

    if (axis.get() == "XY")
        for (let i = start; i < end; i++)
        {
            geomStepsOne.vertices.push(-l, i * space, 0);
            geomStepsOne.vertices.push(l, i * space, 0);
            geomStepsOne.vertices.push(i * space, -l, 0);
            geomStepsOne.vertices.push(i * space, l, 0);

            tc.push(0, 0, 0, 0, 0, 0, 0, 0);
        }
    else
        for (let i = start; i < end; i++)
        {
            geomStepsOne.vertices.push(-l, 0, i * space);
            geomStepsOne.vertices.push(l, 0, i * space);
            geomStepsOne.vertices.push(i * space, 0, -l);
            geomStepsOne.vertices.push(i * space, 0, l);

            tc.push(0, 0, 0, 0, 0, 0, 0, 0);
        }

    if (!inCenter.get())
    {
        for (let i = 0; i < geomStepsOne.vertices.length; i += 3)
        {
            geomStepsOne.vertices[i + 0] += l;
            geomStepsOne.vertices[i + 1] += l;
        }
    }

    geomStepsOne.setTexCoords(tc);
    geomStepsOne.calculateNormals();

    if (!mesh) mesh = new CGL.Mesh(cgl, geomStepsOne);
    else mesh.setGeom(geomStepsOne);
}

render.onTriggered = function ()
{
    if (!mesh)init();
    let shader = cgl.getShader();
    if (!shader) return;

    let oldPrim = shader.glPrimitive;

    shader.glPrimitive = cgl.gl.LINES;

    mesh.render(shader);

    shader.glPrimitive = oldPrim;

    next.trigger();
};


};

Ops.Gl.Meshes.Grid.prototype = new CABLES.Op();
CABLES.OPS["677a7c03-6885-46b4-8a64-e4ea54ee5d7f"]={f:Ops.Gl.Meshes.Grid,objName:"Ops.Gl.Meshes.Grid"};




// **************************************************************
// 
// Ops.Gl.Meshes.FullscreenRectangle_v2
// 
// **************************************************************

Ops.Gl.Meshes.FullscreenRectangle_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"shader_frag":"UNI sampler2D tex;\nIN vec2 texCoord;\n\nvoid main()\n{\n    outColor= texture(tex,texCoord);\n}\n\n","shader_vert":"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\nIN vec2 attrTexCoord;\n\nvoid main()\n{\n   vec4 pos=vec4(vPosition,  1.0);\n\n   texCoord=vec2(attrTexCoord.x,(1.0-attrTexCoord.y));\n\n   gl_Position = projMatrix * mvMatrix * pos;\n}\n",};
const
    render = op.inTrigger("render"),
    inScale = op.inSwitch("Scale", ["Stretch", "Fit"], "Fit"),
    flipY = op.inValueBool("Flip Y"),
    flipX = op.inValueBool("Flip X"),
    inTexture = op.inTexture("Texture"),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
let mesh = null;
let geom = new CGL.Geometry("fullscreen rectangle");
let x = 0, y = 0, w = 0, h = 0;

op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_FUNCTION);
op.toWorkPortsNeedToBeLinked(render);

flipX.onChange = rebuildFlip;
flipY.onChange = rebuildFlip;
render.onTriggered = doRender;
inTexture.onLinkChanged = updateUi;
inScale.onChange = updateScale;

const shader = new CGL.Shader(cgl, "fullscreenrectangle", this);
shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);

shader.setSource(attachments.shader_vert, attachments.shader_frag);
shader.fullscreenRectUniform = new CGL.Uniform(shader, "t", "tex", 0);
shader.aspectUni = new CGL.Uniform(shader, "f", "aspectTex", 0);

let useShader = false;
let updateShaderLater = true;
let fitImageAspect = false;

updateUi();
updateScale();

inTexture.onChange = function ()
{
    updateShaderLater = true;
};

function updateUi()
{
    if (!CABLES.UI) return;
    flipY.setUiAttribs({ "greyout": !inTexture.isLinked() });
    flipX.setUiAttribs({ "greyout": !inTexture.isLinked() });
    inScale.setUiAttribs({ "greyout": !inTexture.isLinked() });
}

function updateShader()
{
    let tex = inTexture.get();
    if (tex) useShader = true;
    else useShader = false;
}

op.preRender = function ()
{
    updateShader();
    shader.bind();
    if (mesh)mesh.render(shader);
    doRender();
};

function updateScale()
{
    fitImageAspect = inScale.get() == "Fit";
}

function doRender()
{
    if (cgl.viewPort[2] != w || cgl.viewPort[3] != h || !mesh) rebuild();

    if (updateShaderLater) updateShader();

    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w, h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    if (fitImageAspect && inTexture.get())
    {
        const rat = inTexture.get().width / inTexture.get().height;

        let _h = h;
        let _w = h * rat;

        if (_w > w)
        {
            _h = w * 1 / rat;
            _w = w;
        }

        cgl.pushViewPort((w - _w) / 2, (h - _h) / 2, _w, _h);
    }

    if (useShader)
    {
        if (inTexture.get()) cgl.setTexture(0, inTexture.get().tex);
        mesh.render(shader);
    }
    else
    {
        mesh.render(cgl.getShader());
    }

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    if (fitImageAspect && inTexture.get()) cgl.popViewPort();

    trigger.trigger();
}

function rebuildFlip()
{
    mesh = null;
}

function rebuild()
{
    if (cgl.viewPort[2] == w && cgl.viewPort[3] == h && mesh) return;

    let xx = 0, xy = 0;

    w = cgl.viewPort[2];
    h = cgl.viewPort[3];

    geom.vertices = new Float32Array([
        xx + w, xy + h, 0.0,
        xx, xy + h, 0.0,
        xx + w, xy, 0.0,
        xx, xy, 0.0
    ]);

    let tc = null;

    if (flipY.get())
        tc = new Float32Array([
            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);
    else
        tc = new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

    if (flipX.get())
    {
        tc[0] = 0.0;
        tc[2] = 1.0;
        tc[4] = 0.0;
        tc[6] = 1.0;
    }

    geom.setTexCoords(tc);

    geom.verticesIndices = new Uint16Array([
        2, 1, 0,
        3, 1, 2
    ]);

    geom.vertexNormals = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
    ]);
    geom.tangents = new Float32Array([
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0]);
    geom.biTangents == new Float32Array([
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0]);

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);
}


};

Ops.Gl.Meshes.FullscreenRectangle_v2.prototype = new CABLES.Op();
CABLES.OPS["fb70721a-eac2-4ff5-a5a2-5c59e2393972"]={f:Ops.Gl.Meshes.FullscreenRectangle_v2,objName:"Ops.Gl.Meshes.FullscreenRectangle_v2"};




// **************************************************************
// 
// Ops.Gl.GradientTexture
// 
// **************************************************************

Ops.Gl.GradientTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const inGrad = op.inGradient("Gradient"),
    inDir = op.inValueSelect("Direction", ["X", "XX", "Y", "YY", "XY", "YX", "Radial"], "X"),
    inSmoothstep = op.inValueBool("Smoothstep", false),
    inStep = op.inBool("Step", false),
    inFlip = op.inBool("Flip", false),
    inSRGB = op.inBool("sRGB", false),
    inOklab = op.inBool("Oklab", false),
    inSize = op.inValueInt("Size", 256),
    tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inValueSelect("wrap", ["clamp to edge", "repeat", "mirrored repeat"], "clamp to edge"),
    inNoise = op.inFloatSlider("Dither", 0),
    inGradArray = op.inArray("Gradient Array"),
    inRandom = op.inTriggerButton("Randomize Colors"),
    outTex = op.outTexture("Texture"),
    outColors = op.outArray("Colors", null, 3),
    outColorPos = op.outArray("Colors Pos", null, 1);

const cgl = op.patch.cgl;
let timeout = null;
inGrad.setUiAttribs({ "editShortcut": true });

const bluenoise = [221, 125, 40, 94, 163, 50, 214, 174, 69, 229, 135, 79, 25, 92, 217, 129, 103, 155, 16, 237, 168, 75, 212, 126, 203, 157, 104, 223, 50, 96, 115, 189, 0, 104, 199, 16, 185, 242, 83, 26, 123, 95, 191, 175, 247, 159, 32, 170, 0, 88, 203, 133, 106, 46, 227, 14, 35, 246, 66, 20, 240, 205, 36, 159, 74, 252, 148, 231, 132, 117, 6, 145, 254, 39, 222, 5, 111, 46, 67, 197, 228, 116, 181, 66, 25, 245, 98, 139, 172, 89, 190, 149, 127, 177, 64, 138, 210, 169, 58, 28, 70, 100, 206, 188, 164, 107, 60, 150, 203, 126, 235, 142, 56, 249, 38, 222, 148, 178, 195, 56, 115, 230, 45, 108, 7, 84, 234, 21, 44, 90, 110, 216, 178, 37, 226, 53, 14, 77, 212, 31, 86, 180, 100, 23, 82, 14, 162, 93, 122, 6, 81, 156, 24, 209, 75, 255, 163, 218, 196, 121, 237, 187, 9, 152, 247, 136, 158, 91, 128, 232, 169, 137, 251, 10, 216, 154, 188, 131, 211, 71, 200, 34, 236, 216, 129, 13, 179, 136, 32, 54, 99, 146, 33, 131, 202, 49, 84, 18, 64, 197, 245, 114, 21, 193, 52, 74, 118, 44, 243, 105, 173, 50, 252, 110, 63, 166, 41, 102, 199, 62, 117, 184, 15, 77, 250, 162, 69, 120, 231, 107, 213, 2, 177, 43, 67, 102, 159, 238, 171, 206, 64, 29, 233, 10, 151, 135, 185, 87, 247, 147, 223, 91, 241, 152, 225, 175, 3, 102, 220, 25, 191, 170, 36, 143, 81, 152, 209, 224, 133, 35, 93, 2, 145, 87, 124, 193, 97, 22, 228, 1, 120, 51, 171, 8, 26, 210, 108, 48, 205, 59, 179, 92, 147, 253, 124, 99, 237, 186, 11, 120, 19, 181, 229, 112, 198, 160, 220, 76, 42, 210, 160, 71, 202, 31, 78, 190, 130, 67, 86, 138, 115, 156, 243, 14, 46, 74, 57, 219, 28, 51, 90, 250, 59, 81, 140, 47, 255, 17, 58, 181, 243, 114, 56, 178, 239, 139, 228, 156, 251, 40, 167, 232, 28, 38, 82, 136, 206, 161, 9, 196, 106, 139, 167, 204, 150, 195, 218, 70, 172, 35, 132, 103, 146, 27, 89, 128, 16, 107, 96, 57, 119, 201, 15, 187, 239, 126, 194, 225, 112, 182, 234, 131, 174, 240, 72, 39, 109, 29, 8, 100, 122, 207, 231, 4, 166, 224, 198, 153, 217, 44, 183, 212, 4, 93, 143, 72, 99, 172, 64, 0, 97, 34, 85, 66, 20, 208, 3, 125, 243, 164, 186, 235, 156, 82, 191, 67, 248, 49, 80, 10, 253, 68, 23, 162, 244, 179, 49, 215, 24, 151, 246, 51, 214, 153, 251, 118, 45, 157, 98, 224, 53, 88, 134, 62, 42, 23, 116, 94, 140, 33, 121, 188, 169, 141, 113, 76, 33, 131, 227, 110, 11, 202, 78, 122, 168, 18, 141, 194, 221, 80, 187, 142, 177, 210, 18, 249, 144, 221, 180, 12, 201, 215, 106, 60, 91, 226, 200, 236, 150, 85, 61, 164, 185, 133, 42, 229, 187, 73, 55, 101, 27, 235, 59, 12, 35, 75, 113, 199, 101, 163, 237, 57, 152, 174, 234, 134, 1, 37, 53, 123, 193, 6, 208, 253, 34, 91, 145, 104, 8, 240, 211, 175, 129, 164, 109, 253, 123, 230, 171, 6, 50, 79, 27, 127, 73, 43, 19, 246, 161, 211, 103, 17, 172, 96, 46, 117, 70, 241, 219, 27, 162, 115, 88, 38, 4, 148, 204, 92, 189, 154, 63, 130, 217, 188, 111, 254, 208, 101, 86, 191, 144, 75, 180, 249, 65, 137, 233, 157, 18, 171, 192, 49, 66, 201, 137, 246, 218, 51, 71, 15, 43, 214, 29, 95, 239, 38, 139, 165, 7, 225, 124, 30, 59, 112, 221, 154, 28, 197, 217, 106, 58, 85, 209, 128, 232, 151, 15, 79, 182, 120, 238, 168, 134, 81, 248, 146, 173, 16, 88, 195, 65, 150, 183, 205, 242, 11, 41, 89, 126, 80, 8, 183, 121, 141, 3, 98, 180, 31, 108, 58, 196, 97, 24, 222, 107, 198, 2, 116, 70, 207, 52, 230, 22, 109, 47, 80, 165, 132, 199, 235, 170, 52, 148, 247, 165, 23, 242, 74, 45, 254, 170, 226, 155, 36, 142, 179, 60, 158, 48, 182, 223, 154, 124, 98, 178, 250, 140, 5, 231, 96, 68, 19, 116, 204, 32, 227, 43, 200, 113, 161, 213, 122, 87, 0, 130, 248, 77, 13, 241, 92, 229, 30, 102, 13, 244, 77, 160, 33, 209, 119, 55, 176, 143, 190, 255, 103, 71, 93, 186, 62, 223, 145, 12, 189, 68, 202, 47, 211, 114, 192, 41, 127, 203, 141, 65, 189, 40, 135, 198, 61, 89, 222, 158, 24, 216, 45, 1, 157, 213, 130, 239, 83, 104, 26, 55, 134, 238, 29, 159, 95, 63, 167, 149, 7, 78, 255, 119, 166, 212, 1, 233, 19, 105, 186, 37, 244, 110, 86, 135, 56, 173, 11, 151, 36, 176, 196, 230, 94, 149, 109, 184, 226, 20, 236, 215, 105, 175, 22, 219, 52, 87, 111, 174, 128, 248, 149, 78, 125, 63, 184, 227, 242, 118, 22, 220, 138, 252, 119, 76, 168, 39, 250, 10, 136, 84, 123, 54, 69, 194, 37, 95, 147, 241, 73, 153, 48, 68, 7, 194, 17, 207, 161, 31, 76, 201, 90, 166, 69, 4, 48, 215, 21, 204, 57, 73, 176, 200, 30, 249, 155, 133, 233, 163, 9, 197, 32, 183, 220, 205, 137, 232, 167, 94, 144, 9, 105, 181, 44, 111, 207, 99, 132, 155, 182, 85, 127, 219, 147, 42, 97, 184, 5, 83, 208, 108, 61, 125, 228, 21, 100, 39, 90, 114, 53, 218, 41, 252, 129, 61, 234, 143, 30, 192, 245, 12, 112, 236, 101, 2, 244, 113, 165, 225, 118, 47, 20, 176, 251, 142, 84, 117, 160, 254, 177, 26, 238, 121, 72, 193, 213, 153, 13, 55, 173, 79, 224, 65, 140, 34, 195, 158, 54, 17, 206, 62, 144, 240, 190, 72, 40, 214, 54, 192, 5, 146, 60, 82, 185, 3, 138, 169, 25, 83, 245];
const bluenoiseSize = 32;

inNoise.onChange =
twrap.onChange =
    tfilter.onChange =
    inStep.onChange =
    inFlip.onChange =
    inSRGB.onChange =
    inOklab.onChange =
    inSize.onChange =
    inGrad.onChange =
    inSmoothstep.onChange =
    inDir.onChange =
    inGradArray.onChange = update;

inGrad.set("{\"keys\" : [{\"pos\":0,\"r\":0,\"g\":0,\"b\":0},{\"pos\":1,\"r\":1,\"g\":1,\"b\":1}]}");

op.onLoaded = update;

inRandom.onTriggered = () =>
{
    const keys = parseKeys();
    if (keys)
    {
        keys.forEach((key) =>
        {
            key.r = Math.random();
            key.g = Math.random();
            key.b = Math.random();
        });
        const newKeys = JSON.stringify({ "keys": keys });
        inGrad.set(newKeys);
    }
};

function rgbToOklab(r, g, b)
{
    let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    l = Math.cbrt(l); m = Math.cbrt(m); s = Math.cbrt(s);
    return [
        l * +0.2104542553 + m * +0.7936177850 + s * -0.0040720468,
        l * +1.9779984951 + m * -2.4285922050 + s * +0.4505937099,
        l * +0.0259040371 + m * +0.7827717662 + s * -0.8086757660
    ];
}

function oklabToRGB(L, a, b)
{
    let l = L + a * +0.3963377774 + b * +0.2158037573;
    let m = L + a * -0.1055613458 + b * -0.0638541728;
    let s = L + a * -0.0894841775 + b * -1.2914855480;
    l **= 3; m **= 3; s **= 3;
    let rgb_r = l * +4.0767416621 + m * -3.3077115913 + s * +0.2309699292;
    let rgb_g = l * -1.2684380046 + m * +2.6097574011 + s * -0.3413193965;
    let rgb_b = l * -0.0041960863 + m * -0.7034186147 + s * +1.7076147010;
    rgb_r = CABLES.clamp(rgb_r, 0, 1); rgb_g = CABLES.clamp(rgb_g, 0, 1); rgb_b = CABLES.clamp(rgb_b, 0, 1);
    return [rgb_r, rgb_g, rgb_b];
}

function lin2srgb(r, g, b)
{
    r /= 255;
    const thr = 0.0031308;
    let c_loR = 12.92 * r;
    let c_hiR = 1.055 * Math.pow(r, 0.41666) - 0.055;
    return ((r < thr) ? c_loR : c_hiR) * 255;
}

function update()
{
    cgl.addNextFrameOnceCallback(doUpdate);
}

function doUpdate()
{
    const keys = parseKeys();
    if (keys) updateGradient(keys);
}

function parseKeys()
{
    let keys = null;
    op.setUiError("nodata", null);
    op.setUiError("parse", null);

    if (Array.isArray(inGradArray.get()))
    {
        keys = inGradArray.get();
    }
    else
    {
        let grad = null;
        if (!inGrad.get() || inGrad.get() === "")
        {
            // op.setUiError("nodata", "gradient no data");
            return null;
        }

        try
        {
            grad = JSON.parse(inGrad.get());
        }
        catch (e)
        {
            op.setUiError("parse", "could not parse gradient data");
        }

        if (!grad || !grad.keys)
        {
            op.setUiError("nodata", "gradient no data");
            return null;
        }
        keys = grad.keys;
    }
    return keys;
}

function noise(x, y)
{
    x %= bluenoiseSize;
    y %= bluenoiseSize;

    return bluenoise[x + y * bluenoiseSize] / 255 - 0.5;
}

function addNoise(pixels, width, height)
{
    if (inNoise.get() == 0.0) return pixels;

    for (let x = 0; x < width; x++)
        for (let y = 0; y < height; y++)
        {
            const r1 = pixels[(x + (y * width)) * 4 + 0];
            const g1 = pixels[(x + (y * width)) * 4 + 1];
            const b1 = pixels[(x + (y * width)) * 4 + 2];

            let offX = (width / 8) * inNoise.get() * noise(x, y);
            let offY = (height / 8) * inNoise.get() * noise(x + bluenoiseSize / 2, y + bluenoiseSize / 2);

            if (height == 1) offY = 0;
            if (width == 1) offX = 0;

            offX = Math.round(offX);
            offY = Math.round(offY);

            const yOffY = CABLES.clamp(y + offY, 0, height - 1);
            const xOffX = CABLES.clamp(x + offX, 0, width - 1);

            const r2 = pixels[(xOffX + ((yOffY) * width)) * 4 + 0];
            const g2 = pixels[(xOffX + ((yOffY) * width)) * 4 + 1];
            const b2 = pixels[(xOffX + ((yOffY) * width)) * 4 + 2];

            pixels[(x + y * width) * 4 + 0] = r2;
            pixels[(x + y * width) * 4 + 1] = g2;
            pixels[(x + y * width) * 4 + 2] = b2;

            pixels[(xOffX + ((yOffY) * width)) * 4 + 0] = r1;
            pixels[(xOffX + ((yOffY) * width)) * 4 + 1] = g1;
            pixels[(xOffX + ((yOffY) * width)) * 4 + 2] = b1;
        }
    return pixels;
}

function updateGradient(keys)
{
    let width = Math.round(inSize.get());
    if (width < 4) width = 4;

    inGrad.setUiAttribs(
        {
            "editShortcut": true,
            "gradEditSmoothstep": inSmoothstep.get(),
            "gradEditStep": inStep.get(),
            "gradOklab": inOklab.get(),
        });

    let selectedWrap = 0;
    let selectedFilter = 0;
    if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
    else if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    else if (twrap.get() == "clamp to edge") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    if (tfilter.get() == "nearest") selectedFilter = CGL.Texture.FILTER_NEAREST;
    else if (tfilter.get() == "linear") selectedFilter = CGL.Texture.FILTER_LINEAR;
    else if (tfilter.get() == "mipmap") selectedFilter = CGL.Texture.FILTER_MIPMAP;

    const tex = new CGL.Texture(cgl);

    let pixels = new Uint8Array(width * 4);

    for (let i = 0; i < keys.length - 1; i++)
    {
        const keyA = keys[i];
        const keyB = keys[i + 1];

        for (let x = keyA.pos * width; x < keyB.pos * width; x++)
        {
            let p = CABLES.map(x, keyA.pos * width, keyB.pos * width, 0, 1);
            if (inStep.get())p = Math.round(p);
            if (inSmoothstep.get()) p = CABLES.smoothStep(p);
            x = Math.round(x);

            let xx = x;
            if (inFlip.get())xx = width - x - 1;

            if (inOklab.get())
            {
                const klabA = rgbToOklab(keyA.r, keyA.g, keyA.b);
                const labA_r = klabA[0];
                const labA_g = klabA[1];
                const labA_b = klabA[2];

                const klabB = rgbToOklab(keyB.r, keyB.g, keyB.b);
                const labB_r = klabB[0];
                const labB_g = klabB[1];
                const labB_b = klabB[2];

                const l = ((p * labB_r + (1.0 - p) * labA_r));
                const a = ((p * labB_g + (1.0 - p) * labA_g));
                const b = ((p * labB_b + (1.0 - p) * labA_b));

                const pixCol = oklabToRGB(l, a, b);
                pixels[xx * 4 + 0] = Math.round(pixCol[0] * 255);
                pixels[xx * 4 + 1] = Math.round(pixCol[1] * 255);
                pixels[xx * 4 + 2] = Math.round(pixCol[2] * 255);
            }
            else
            {
                pixels[xx * 4 + 0] = Math.round((p * keyB.r + (1.0 - p) * keyA.r) * 255);
                pixels[xx * 4 + 1] = Math.round((p * keyB.g + (1.0 - p) * keyA.g) * 255);
                pixels[xx * 4 + 2] = Math.round((p * keyB.b + (1.0 - p) * keyA.b) * 255);
            }

            if (typeof keyA.a !== "undefined" && typeof keyB.a !== "undefined")
            {
                const alpha = Math.round((p * keyB.a + (1.0 - p) * keyA.a) * 255);
                pixels[xx * 4 + 3] = alpha;
            }
            else
            {
                pixels[xx * 4 + 3] = Math.round(255);
            }
        }
    }
    if (inSRGB.get())
        for (let i = 0; i < pixels.length; i += 4)
        {
            pixels[i + 0] = lin2srgb(pixels[i + 0]);
            pixels[i + 1] = lin2srgb(pixels[i + 1]);
            pixels[i + 2] = lin2srgb(pixels[i + 2]);
        }

    if (inDir.get() == "X") tex.initFromData(addNoise(pixels, width, 1), width, 1, selectedFilter, selectedWrap);
    if (inDir.get() == "Y") tex.initFromData(addNoise(pixels, 1, width), 1, width, selectedFilter, selectedWrap);

    if (inDir.get() == "Radial")
    {
        const rpixels = new Uint8Array(width * width * 4);

        for (let x = 0; x < width; x++)
        {
            for (let y = 0; y < width; y++)
            {
                const dx = x - (width - 1) / 2;
                const dy = y - (width - 1) / 2;
                let pos = Math.sqrt(dx * dx + dy * dy) / (width) * 2;

                if (inSmoothstep.get()) pos = CABLES.smoothStep(pos);

                let aa = Math.round(pos * width) * 4;
                if (aa >= width * 4)aa = width * 4 - 4;

                rpixels[(x * 4) + (y * 4 * width) + 0] = pixels[aa + 0];
                rpixels[(x * 4) + (y * 4 * width) + 1] = pixels[aa + 1];
                rpixels[(x * 4) + (y * 4 * width) + 2] = pixels[aa + 2];
                rpixels[(x * 4) + (y * 4 * width) + 3] = Math.round(255);
            }
        }

        pixels = rpixels;

        tex.initFromData(addNoise(pixels, width, width), width, width, selectedFilter, selectedWrap);
    }

    if (inDir.get() == "XX")
    {
        const rpixels = new Uint8Array(width * width * 4);
        for (let x = 0; x < width; x++)
            for (let y = 0; y < width; y++)
            {
                const aa = x * 4;
                rpixels[(x * 4) + (y * 4 * width) + 0] = pixels[aa + 0];
                rpixels[(x * 4) + (y * 4 * width) + 1] = pixels[aa + 1];
                rpixels[(x * 4) + (y * 4 * width) + 2] = pixels[aa + 2];
                rpixels[(x * 4) + (y * 4 * width) + 3] = Math.round(255);
            }
        pixels = rpixels;
        tex.initFromData(addNoise(pixels, width, width), width, width, selectedFilter, selectedWrap);
    }

    if (inDir.get() == "YY")
    {
        const rpixels = new Uint8Array(width * width * 4);
        for (let x = 0; x < width; x++)
            for (let y = 0; y < width; y++)
            {
                const aa = x * 4;
                rpixels[(y * 4) + (x * 4 * width) + 0] = pixels[aa + 0];
                rpixels[(y * 4) + (x * 4 * width) + 1] = pixels[aa + 1];
                rpixels[(y * 4) + (x * 4 * width) + 2] = pixels[aa + 2];
                rpixels[(y * 4) + (x * 4 * width) + 3] = Math.round(255);
            }
        pixels = rpixels;
        tex.initFromData(addNoise(pixels, width, width), width, width, selectedFilter, selectedWrap);
    }

    if (inDir.get() == "XY" || inDir.get() == "YX")
    {
        const rpixels = new Uint8Array(width * width * 4);

        for (let x = 0; x < width; x++)
        {
            let xx = x;
            if (inDir.get() == "YX")xx = width - x - 1;

            for (let y = 0; y < width; y++)
            {
                let aa = Math.round(((xx) + y) / 2) * 4;

                rpixels[(x * 4) + (y * 4 * width) + 0] = pixels[aa + 0];
                rpixels[(x * 4) + (y * 4 * width) + 1] = pixels[aa + 1];
                rpixels[(x * 4) + (y * 4 * width) + 2] = pixels[aa + 2];
                rpixels[(x * 4) + (y * 4 * width) + 3] = Math.round(255);
            }
        }

        pixels = rpixels;

        tex.initFromData(addNoise(pixels, width, width), width, width, selectedFilter, selectedWrap);
    }

    const colorArr = [];
    for (let i = 0; i < keys.length - 1; i++)
    {
        colorArr.push(keys[i].r, keys[i].g, keys[i].b);
    }

    const colorPosArr = [];
    for (let i = 0; i < keys.length - 1; i++)
    {
        colorPosArr.push(keys[i].pos);
    }

    outColors.set(colorArr);
    outColorPos.set(colorPosArr);

    // outTex.set(null);
    outTex.setRef(tex);
}


};

Ops.Gl.GradientTexture.prototype = new CABLES.Op();
CABLES.OPS["01380a50-2dbb-4465-ae80-86349b0b717a"]={f:Ops.Gl.GradientTexture,objName:"Ops.Gl.GradientTexture"};




// **************************************************************
// 
// Ops.Gl.Textures.CombineTextures
// 
// **************************************************************

Ops.Gl.Textures.CombineTextures = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"rgbe2fp_frag":"UNI sampler2D texR;\nUNI sampler2D texG;\nUNI sampler2D texB;\nUNI sampler2D texA;\nIN vec2 texCoord;\n\nUNI float defaultR;\nUNI float defaultG;\nUNI float defaultB;\nUNI float defaultA;\n\nvoid main()\n{\n    float r=defaultR, g=defaultG, b=defaultB, a=defaultA;\n\n    #ifdef HAS_R\n        #ifdef R_SRC_R\n            r=texture(texR,texCoord).r;\n        #endif\n        #ifdef R_SRC_G\n            r=texture(texR,texCoord).g;\n        #endif\n        #ifdef R_SRC_B\n            r=texture(texR,texCoord).b;\n        #endif\n        #ifdef R_SRC_A\n            r=texture(texR,texCoord).a;\n        #endif\n    #endif\n\n    #ifdef HAS_G\n        #ifdef G_SRC_R\n            g=texture(texG,texCoord).r;\n        #endif\n        #ifdef G_SRC_G\n            g=texture(texG,texCoord).g;\n        #endif\n        #ifdef G_SRC_B\n            g=texture(texG,texCoord).b;\n        #endif\n        #ifdef G_SRC_A\n            g=texture(texG,texCoord).a;\n        #endif\n    #endif\n\n    #ifdef HAS_B\n        #ifdef B_SRC_R\n            b=texture(texB,texCoord).r;\n        #endif\n        #ifdef B_SRC_G\n            b=texture(texB,texCoord).g;\n        #endif\n        #ifdef B_SRC_B\n            b=texture(texB,texCoord).b;\n        #endif\n        #ifdef B_SRC_A\n            b=texture(texB,texCoord).a;\n        #endif\n    #endif\n\n    #ifdef HAS_A\n        #ifdef A_SRC_R\n            a=texture(texA,texCoord).r;\n        #endif\n        #ifdef A_SRC_G\n            a=texture(texA,texCoord).g;\n        #endif\n        #ifdef A_SRC_B\n            a=texture(texA,texCoord).b;\n        #endif\n        #ifdef A_SRC_A\n            a=texture(texA,texCoord).a;\n        #endif\n    #endif\n\n    #ifdef INV_R\n        r=1.0-r;\n    #endif\n    #ifdef INV_G\n        g=1.0-g;\n    #endif\n    #ifdef INV_B\n        b=1.0-b;\n    #endif\n    #ifdef INV_A\n        a=1.0-a;\n    #endif\n\n\n    outColor = vec4(r,g,b,a);\n}\n\n\n",};
const
    exec = op.inTrigger("Execute"),
    tfilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inValueSelect("Wrap", ["clamp to edge", "repeat", "mirrored repeat"], "repeat"),
    inPixel = op.inDropDown("Pixel Format", CGL.Texture.PIXELFORMATS, CGL.Texture.PFORMATSTR_RGBA8UB),

    inSize = op.inSwitch("Size", ["Biggest", "Smallest", "R", "G", "B", "A"], "Biggest"),

    inTexR = op.inTexture("R"),
    inSrcR = op.inSwitch("R Source", ["R", "G", "B", "A"], "R"),
    inSrcRVal = op.inSwitch("R Value", ["Source", "Invert"], "Source"),
    inSrcRDefault = op.inFloatSlider("R Default", 1),
    inTexG = op.inTexture("G"),
    inSrcG = op.inSwitch("G Source", ["R", "G", "B", "A"], "G"),
    inSrcGVal = op.inSwitch("G Value", ["Source", "Invert"], "Source"),
    inSrcGDefault = op.inFloatSlider("G Default", 1),
    inTexB = op.inTexture("B"),
    inSrcB = op.inSwitch("B Source", ["R", "G", "B", "A"], "B"),
    inSrcBVal = op.inSwitch("B Value", ["Source", "Invert"], "Source"),
    inSrcBDefault = op.inFloatSlider("B Default", 1),
    inTexA = op.inTexture("A"),
    inSrcA = op.inSwitch("A Source", ["R", "G", "B", "A"], "R"),
    inSrcAVal = op.inSwitch("A Value", ["Source", "Invert"], "Source"),
    inSrcADefault = op.inFloatSlider("A Default", 1),

    next = op.outTrigger("Next"),
    outTex = op.outTexture("Texture");

op.setPortGroup("Red", [inSrcRDefault, inTexR, inSrcR, inSrcRVal]);
op.setPortGroup("Green", [inSrcGDefault, inTexG, inSrcG, inSrcGVal]);
op.setPortGroup("Blue", [inSrcBDefault, inTexB, inSrcB, inSrcBVal]);
op.setPortGroup("Alpha", [inSrcADefault, inTexA, inSrcA, inSrcAVal]);

const cgl = op.patch.cgl;
let currentSize = [2, 2];
let needsUpdate = true;
let tc = null;
let unitexR, unitexG, unitexB, unitexA, uniFloatR, uniFloatG, uniFloatB, uniFloatA;

inSrcRDefault.onChange =
    inSrcGDefault.onChange =
    inSrcBDefault.onChange =
    inSrcADefault.onChange =
    inTexR.onChange =
    inTexG.onChange =
    inTexB.onChange =
    inPixel.onChange =
    inTexA.onChange = () =>
    {
        currentSize = getSize();

        needsUpdate = true;
    };

inTexR.onLinkChanged =
    inTexG.onLinkChanged =
    inTexB.onLinkChanged =
    inTexA.onLinkChanged =
    inSrcR.onChange =
    inSrcG.onChange =
    inSrcB.onChange =
    inSrcA.onChange =
    inSrcRVal.onChange =
    inSrcGVal.onChange =
    inSrcBVal.onChange =
    inSrcAVal.onChange = updateDefines;

inSize.onChange =
    tfilter.onChange =
    twrap.onChange = () => { tc = null; };

function getSize()
{
    let w = 4;
    let h = 4;
    let sizes = [];
    if (inSize.get() == "Biggest" || inSize.get() == "Smallest")
    {
        if (inTexR.get()) sizes.push([inTexR.get().width, inTexR.get().height, inTexR.get().width * inTexR.get().height]);
        if (inTexG.get()) sizes.push([inTexG.get().width, inTexG.get().height, inTexG.get().width * inTexG.get().height]);
        if (inTexB.get()) sizes.push([inTexB.get().width, inTexB.get().height, inTexB.get().width * inTexB.get().height]);
        if (inTexA.get()) sizes.push([inTexA.get().width, inTexA.get().height, inTexA.get().width * inTexA.get().height]);
    }

    if (inSize.get() == "Biggest")
    {
        let biggest = 0;

        for (let i = 0; i < sizes.length; i++)
        {
            if (sizes[i][2] > biggest)
            {
                w = sizes[i][0];
                h = sizes[i][1];
                biggest = sizes[i][2];
            }
        }
    }
    else if (inSize.get() == "Smallest")
    {
        let smallest = op.patch.cgl.gl.MAX_TEXTURE_SIZE + 1;

        for (let i = 0; i < sizes.length; i++)
        {
            if (sizes[i][2] < smallest)
            {
                w = sizes[i][0];
                h = sizes[i][1];
                smallest = sizes[i][2];
            }
        }
    }
    else if (inSize.get() == "R" && inTexR.get())
    {
        w = inTexR.get().width;
        h = inTexR.get().height;
    }
    else if (inSize.get() == "G" && inTexG.get())
    {
        w = inTexG.get().width;
        h = inTexG.get().height;
    }
    else if (inSize.get() == "B" && inTexB.get())
    {
        w = inTexB.get().width;
        h = inTexB.get().height;
    }
    else if (inSize.get() == "A" && inTexA.get())
    {
        w = inTexA.get().width;
        h = inTexA.get().height;
    }

    return [w, h];
}

function initShader()
{
    let wrap = CGL.Texture.WRAP_REPEAT;
    if (twrap.get() == "mirrored repeat") wrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (twrap.get() == "clamp to edge") wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    let filter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "linear") filter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "mipmap") filter = CGL.Texture.FILTER_MIPMAP;

    if (tc)tc.dispose();

    currentSize = getSize();

    tc = new CGL.CopyTexture(cgl, "combinetextures", {
        "shader": attachments.rgbe2fp_frag,
        "isFloatingPointTexture": inPixel.get() == CGL.Texture.PFORMATSTR_RGBA32F,
        "filter": filter,
        "wrap": wrap,
        "width": currentSize[0],
        "height": currentSize[1]

    });

    unitexR = new CGL.Uniform(tc.bgShader, "t", "texR", 0);
    unitexG = new CGL.Uniform(tc.bgShader, "t", "texG", 1);
    unitexB = new CGL.Uniform(tc.bgShader, "t", "texB", 2);
    unitexA = new CGL.Uniform(tc.bgShader, "t", "texA", 3);

    uniFloatR = new CGL.Uniform(tc.bgShader, "f", "defaultR", inSrcRDefault);
    uniFloatG = new CGL.Uniform(tc.bgShader, "f", "defaultG", inSrcGDefault);
    uniFloatB = new CGL.Uniform(tc.bgShader, "f", "defaultB", inSrcBDefault);
    uniFloatA = new CGL.Uniform(tc.bgShader, "f", "defaultA", inSrcADefault);

    updateDefines();
    needsUpdate = true;
}

function updateDefines()
{
    if (!tc) return;

    inSrcR.setUiAttribs({ "greyout": !inTexR.isLinked() });
    inSrcG.setUiAttribs({ "greyout": !inTexG.isLinked() });
    inSrcB.setUiAttribs({ "greyout": !inTexB.isLinked() });
    inSrcA.setUiAttribs({ "greyout": !inTexA.isLinked() });

    inSrcRVal.setUiAttribs({ "greyout": !inTexR.isLinked() });
    inSrcGVal.setUiAttribs({ "greyout": !inTexG.isLinked() });
    inSrcBVal.setUiAttribs({ "greyout": !inTexB.isLinked() });
    inSrcAVal.setUiAttribs({ "greyout": !inTexA.isLinked() });

    inSrcRDefault.setUiAttribs({ "greyout": inTexR.isLinked() });
    inSrcGDefault.setUiAttribs({ "greyout": inTexG.isLinked() });
    inSrcBDefault.setUiAttribs({ "greyout": inTexB.isLinked() });
    inSrcADefault.setUiAttribs({ "greyout": inTexA.isLinked() });

    tc.bgShader.toggleDefine("R_SRC_R", inSrcR.get() == "R");
    tc.bgShader.toggleDefine("R_SRC_G", inSrcR.get() == "G");
    tc.bgShader.toggleDefine("R_SRC_B", inSrcR.get() == "B");
    tc.bgShader.toggleDefine("R_SRC_A", inSrcR.get() == "A");

    tc.bgShader.toggleDefine("G_SRC_R", inSrcG.get() == "R");
    tc.bgShader.toggleDefine("G_SRC_G", inSrcG.get() == "G");
    tc.bgShader.toggleDefine("G_SRC_B", inSrcG.get() == "B");
    tc.bgShader.toggleDefine("G_SRC_A", inSrcG.get() == "A");

    tc.bgShader.toggleDefine("B_SRC_R", inSrcB.get() == "R");
    tc.bgShader.toggleDefine("B_SRC_G", inSrcB.get() == "G");
    tc.bgShader.toggleDefine("B_SRC_B", inSrcB.get() == "B");
    tc.bgShader.toggleDefine("B_SRC_A", inSrcB.get() == "A");

    tc.bgShader.toggleDefine("A_SRC_R", inSrcA.get() == "R");
    tc.bgShader.toggleDefine("A_SRC_G", inSrcA.get() == "G");
    tc.bgShader.toggleDefine("A_SRC_B", inSrcA.get() == "B");
    tc.bgShader.toggleDefine("A_SRC_A", inSrcA.get() == "A");

    tc.bgShader.toggleDefine("INV_R", inSrcRVal.get() == "Invert");
    tc.bgShader.toggleDefine("INV_G", inSrcGVal.get() == "Invert");
    tc.bgShader.toggleDefine("INV_B", inSrcBVal.get() == "Invert");
    tc.bgShader.toggleDefine("INV_A", inSrcAVal.get() == "Invert");

    tc.bgShader.toggleDefine("HAS_R", inTexR.isLinked());
    tc.bgShader.toggleDefine("HAS_G", inTexG.isLinked());
    tc.bgShader.toggleDefine("HAS_B", inTexB.isLinked());
    tc.bgShader.toggleDefine("HAS_A", inTexA.isLinked());

    // if (currentSize[0] != size[0] || currentSize[1] != size[1])tc = null;

    needsUpdate = true;
}

exec.onTriggered = () =>
{
    if (!tc || needsUpdate && !op.patch.cgl.frameStore.shadowPass)
    {
        if (!tc)initShader();
        tc.bgShader.popTextures();

        if (inTexR.get()) tc.bgShader.pushTexture(unitexR, inTexR.get().tex);
        else tc.bgShader.pushTexture(unitexR, CGL.Texture.getEmptyTexture(cgl).tex);
        if (inTexG.get()) tc.bgShader.pushTexture(unitexG, inTexG.get().tex);
        else tc.bgShader.pushTexture(unitexG, CGL.Texture.getEmptyTexture(cgl).tex);
        if (inTexB.get()) tc.bgShader.pushTexture(unitexB, inTexB.get().tex);
        else tc.bgShader.pushTexture(unitexB, CGL.Texture.getEmptyTexture(cgl).tex);
        if (inTexA.get()) tc.bgShader.pushTexture(unitexA, inTexA.get().tex);
        else tc.bgShader.pushTexture(unitexA, CGL.Texture.getEmptyTexture(cgl).tex);

        uniFloatR.setValue(inSrcRDefault.get());
        uniFloatG.setValue(inSrcGDefault.get());
        uniFloatB.setValue(inSrcBDefault.get());
        uniFloatA.setValue(inSrcADefault.get());

        tc.setSize(currentSize[0], currentSize[1]);

        // outTex.set(CGL.Texture.getEmptyTexture(cgl));
        outTex.setRef(tc.copy(inTexR.get() || inTexG.get() || inTexB.get() || inTexA.get() || CGL.Texture.getEmptyTexture(cgl)));

        needsUpdate = false;
    }

    next.trigger();
};


};

Ops.Gl.Textures.CombineTextures.prototype = new CABLES.Op();
CABLES.OPS["5f33dd4a-a553-4f0f-b3b1-66a80cd240a7"]={f:Ops.Gl.Textures.CombineTextures,objName:"Ops.Gl.Textures.CombineTextures"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.ImageCompose_v4
// 
// **************************************************************

Ops.Gl.ImageCompose.ImageCompose_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"imgcomp_frag":"IN vec2 texCoord;\nUNI vec4 bgColor;\nUNI sampler2D tex;\n#ifdef USE_UVTEX\nUNI sampler2D UVTex;\n#endif\n\nvoid main()\n{\n\n    #ifndef USE_TEX\n        outColor=bgColor;\n    #endif\n    #ifdef USE_TEX\n        #ifndef USE_UVTEX\n        outColor=texture(tex,texCoord);\n        #else\n        outColor=texture(tex,texture(UVTex,texCoord).xy);\n        #endif\n    #endif\n\n\n\n}\n",};
const
    cgl = op.patch.cgl,
    render = op.inTrigger("Render"),
    inTex = op.inTexture("Base Texture"),
    inUVTex = op.inTexture("UV Texture"),
    inSize = op.inSwitch("Size", ["Auto", "Canvas", "Manual"], "Auto"),
    width = op.inValueInt("Width", 640),
    height = op.inValueInt("Height", 480),
    inFilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"], "linear"),
    inWrap = op.inValueSelect("Wrap", ["clamp to edge", "repeat", "mirrored repeat"], "repeat"),
    aniso = op.inSwitch("Anisotropic", ["0", "1", "2", "4", "8", "16"], "0"),

    inPixelFormat = op.inDropDown("Pixel Format", CGL.Texture.PIXELFORMATS, CGL.Texture.PFORMATSTR_RGBA8UB),

    inClear = op.inBool("Clear", true),
    r = op.inValueSlider("R", 0),
    g = op.inValueSlider("G", 0),
    b = op.inValueSlider("B", 0),
    a = op.inValueSlider("A", 0),

    trigger = op.outTrigger("Next"),
    texOut = op.outTexture("texture_out", CGL.Texture.getEmptyTexture(cgl)),
    outRatio = op.outNumber("Aspect Ratio"),
    outWidth = op.outNumber("Texture Width"),
    outHeight = op.outNumber("Texture Height");

op.setPortGroup("Texture Size", [inSize, width, height]);
op.setPortGroup("Texture Parameters", [inWrap, aniso, inFilter, inPixelFormat]);

r.setUiAttribs({ "colorPick": true });
op.setPortGroup("Color", [r, g, b, a, inClear]);

op.toWorkPortsNeedToBeLinked(render);

const prevViewPort = [0, 0, 0, 0];
let effect = null;
let tex = null;
let reInitEffect = true;
let isFloatTex = false;
let copyShader = null;
let copyShaderTexUni = null;
let copyShaderUVTexUni = null;
let copyShaderRGBAUni = null;

inWrap.onChange =
inFilter.onChange =
aniso.onChange =
inPixelFormat.onChange = reInitLater;

inTex.onLinkChanged =
inClear.onChange =
    inSize.onChange =
    inUVTex.onChange = updateUi;

render.onTriggered =
    op.preRender = doRender;

updateUi();

function initEffect()
{
    if (effect)effect.delete();
    if (tex)tex.delete();
    tex = null;
    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": CGL.Texture.isPixelFormatFloat(inPixelFormat.get()), "name": op.name });

    const cgl_aniso = Math.min(cgl.maxAnisotropic, parseFloat(aniso.get()));

    tex = new CGL.Texture(cgl,
        {
            "anisotropic": cgl_aniso,
            "name": "image_compose_v2_" + op.id,
            "pixelFormat": inPixelFormat.get(),
            "filter": getFilter(),
            "wrap": getWrap(),
            "width": getWidth(),
            "height": getHeight()
        });

    effect.setSourceTexture(tex);

    outWidth.set(getWidth());
    outHeight.set(getHeight());
    outRatio.set(getWidth() / getHeight());

    texOut.set(CGL.Texture.getEmptyTexture(cgl));

    reInitEffect = false;
    updateUi();
}

function getFilter()
{
    if (inFilter.get() == "nearest") return CGL.Texture.FILTER_NEAREST;
    else if (inFilter.get() == "linear") return CGL.Texture.FILTER_LINEAR;
    else if (inFilter.get() == "mipmap") return CGL.Texture.FILTER_MIPMAP;
}

function getWrap()
{
    if (inWrap.get() == "repeat") return CGL.Texture.WRAP_REPEAT;
    else if (inWrap.get() == "mirrored repeat") return CGL.Texture.WRAP_MIRRORED_REPEAT;
    else if (inWrap.get() == "clamp to edge") return CGL.Texture.WRAP_CLAMP_TO_EDGE;
}

function getWidth()
{
    let x = 0;
    if (inTex.get() && inSize.get() == "Auto") x = inTex.get().width;
    else if (inSize.get() == "Auto" || inSize.get() == "Canvas") x = cgl.canvasWidth;
    else if (inSize.get() == "ViewPort") x = cgl.getViewPort()[2];
    else x = Math.ceil(width.get());
    return op.patch.cgl.checkTextureSize(x);
}

function getHeight()
{
    let x = 0;

    if (inTex.get() && inSize.get() == "Auto") x = inTex.get().height;
    else if (inSize.get() == "Auto" || inSize.get() == "Canvas") x = cgl.canvasHeight;
    else if (inSize.get() == "ViewPort") x = cgl.getViewPort()[3];
    else x = Math.ceil(height.get());
    return op.patch.cgl.checkTextureSize(x);
}

function reInitLater()
{
    reInitEffect = true;
}

function updateResolution()
{
    if ((
        getWidth() != tex.width ||
        getHeight() != tex.height ||
        // tex.anisotropic != parseFloat(aniso.get()) ||
        // tex.isFloatingPoint() != CGL.Texture.isPixelFormatFloat(inPixelFormat.get()) ||
        tex.pixelFormat != inPixelFormat.get() ||
        tex.filter != getFilter() ||
        tex.wrap != getWrap()
    ) && (getWidth() !== 0 && getHeight() !== 0))
    {
        initEffect();
        effect.setSourceTexture(tex);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
        updateResolutionInfo();
        checkTypes();
    }
}

function updateResolutionInfo()
{
    let info = null;

    if (inSize.get() == "Manual")
    {
        info = null;
    }
    else if (inSize.get() == "Auto")
    {
        if (inTex.get()) info = "Input Texture";
        else info = "Canvas Size";

        info += ": " + getWidth() + " x " + getHeight();
    }

    let changed = false;
    changed = inSize.uiAttribs.info != info;
    inSize.setUiAttribs({ "info": info });
    if (changed)op.refreshParams();
}

function updateDefines()
{
    if (copyShader)copyShader.toggleDefine("USE_TEX", inTex.isLinked() || !inClear.get());
    if (copyShader)copyShader.toggleDefine("USE_UVTEX", inUVTex.isLinked());
}

function updateUi()
{
    aniso.setUiAttribs({ "greyout": getFilter() != CGL.Texture.FILTER_MIPMAP });

    r.setUiAttribs({ "greyout": inTex.isLinked() });
    b.setUiAttribs({ "greyout": inTex.isLinked() });
    g.setUiAttribs({ "greyout": inTex.isLinked() });
    a.setUiAttribs({ "greyout": inTex.isLinked() });

    inClear.setUiAttribs({ "greyout": inTex.isLinked() });
    width.setUiAttribs({ "greyout": inSize.get() != "Manual" });
    height.setUiAttribs({ "greyout": inSize.get() != "Manual" });

    // width.setUiAttribs({ "hideParam": inSize.get() != "Manual" });
    // height.setUiAttribs({ "hideParam": inSize.get() != "Manual" });

    if (tex)
        if (CGL.Texture.isPixelFormatFloat(inPixelFormat.get()) && getFilter() == CGL.Texture.FILTER_MIPMAP) op.setUiError("fpmipmap", "Don't use mipmap and 32bit at the same time, many systems do not support this.");
        else op.setUiError("fpmipmap", null);

    updateResolutionInfo();
    updateDefines();
    checkTypes();
}

function checkTypes()
{
    if (tex)
        if (inTex.isLinked() && inTex.get() && (tex.isFloatingPoint() != inTex.get().isFloatingPoint()))
            op.setUiError("textypediff", "Warning: Mixing floating point and non floating point texture can result in data/precision loss", 1);
        else
            op.setUiError("textypediff", null);
}

op.preRender = () =>
{
    doRender();
};

function copyTexture()
{
    if (!copyShader)
    {
        copyShader = new CGL.Shader(cgl, "copytextureshader");
        copyShader.setSource(copyShader.getDefaultVertexShader(), attachments.imgcomp_frag);
        copyShaderTexUni = new CGL.Uniform(copyShader, "t", "tex", 0);
        copyShaderUVTexUni = new CGL.Uniform(copyShader, "t", "UVTex", 1);
        copyShaderRGBAUni = new CGL.Uniform(copyShader, "4f", "bgColor", r, g, b, a);
        updateDefines();
    }

    cgl.pushShader(copyShader);
    cgl.currentTextureEffect.bind();

    if (inTex.get()) cgl.setTexture(0, inTex.get().tex);
    else if (!inClear.get() && texOut.get()) cgl.setTexture(0, texOut.get().tex);
    if (inUVTex.get()) cgl.setTexture(1, inUVTex.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();
}

function doRender()
{
    if (!effect || reInitEffect) initEffect();

    cgl.pushBlend(false);

    updateResolution();

    const oldEffect = cgl.currentTextureEffect;
    cgl.currentTextureEffect = effect;
    cgl.currentTextureEffect.imgCompVer = 3;
    cgl.currentTextureEffect.width = width.get();
    cgl.currentTextureEffect.height = height.get();
    effect.setSourceTexture(tex);

    effect.startEffect(inTex.get() || CGL.Texture.getEmptyTexture(cgl, isFloatTex), true);
    copyTexture();

    trigger.trigger();

    cgl.pushViewPort(0, 0, width.get(), height.get());

    effect.endEffect();
    texOut.setRef(effect.getCurrentSourceTexture());

    cgl.popViewPort();

    cgl.popBlend();
    cgl.currentTextureEffect = oldEffect;
}


};

Ops.Gl.ImageCompose.ImageCompose_v4.prototype = new CABLES.Op();
CABLES.OPS["17212e2b-d692-464c-8f8d-2d511dd3410a"]={f:Ops.Gl.ImageCompose.ImageCompose_v4,objName:"Ops.Gl.ImageCompose.ImageCompose_v4"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.FastBlur_v2
// 
// **************************************************************

Ops.Gl.ImageCompose.FastBlur_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"blur_frag":"\nUNI sampler2D tex;\n#ifdef USE_MASK\n    UNI sampler2D texMask;\n#endif\nUNI float amount;\nUNI float pass;\n\nIN vec2 texCoord;\n\nUNI float dirX;\nUNI float dirY;\nUNI float width;\nUNI float height;\n\nIN vec2 coord0;\nIN vec2 coord1;\nIN vec2 coord2;\nIN vec2 coord3;\nIN vec2 coord4;\nIN vec2 coord5;\nIN vec2 coord6;\n\n#ifdef HAS_MASK\n    UNI sampler2D imageMask;\n#endif\n\nvoid main()\n{\n    vec4 color = vec4(0.0);\n\n    #ifdef USE_MASK\n        #ifdef MASK_INVERT\n            if(texture(texMask,texCoord).r<0.5)\n            {\n                outColor= texture(tex, texCoord);\n                return;\n            }\n        #endif\n\n        #ifndef MASK_INVERT\n            if(texture(texMask,texCoord).r>0.5)\n            {\n                outColor= texture(tex, texCoord);\n                return;\n            }\n        #endif\n    #endif\n\n    color += texture(tex, coord0) * 0.06927096443792478;\n    color += texture(tex, coord1) * 0.1383328848652136;\n    color += texture(tex, coord2) * 0.21920904690397863;\n    color += texture(tex, coord3) * 0.14637421;\n    color += texture(tex, coord4) * 0.21920904690397863;\n    color += texture(tex, coord5) * 0.1383328848652136;\n    color += texture(tex, coord6) * 0.06927096443795711;\n\n    outColor= color;\n}","blur_vert":"\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nOUT vec2 texCoord;\nOUT vec3 norm;\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\nUNI mat4 modelMatrix;\n\nUNI float pass;\nUNI float dirX;\nUNI float dirY;\nUNI float width;\nUNI float height;\n\nOUT vec2 coord0;\nOUT vec2 coord1;\nOUT vec2 coord2;\nOUT vec2 coord3;\nOUT vec2 coord4;\nOUT vec2 coord5;\nOUT vec2 coord6;\n\nvoid main()\n{\n    texCoord=attrTexCoord;\n    norm=attrVertNormal;\n    vec4 pos=vec4(vPosition,  1.0);\n    {{MODULE_VERTEX_POSITION}}\n\n    vec2 dir=vec2(dirX,dirY);\n    vec2 res=vec2( (1.) / width , (1.) / height )*dir;\n\n    coord3= attrTexCoord;\n\n    coord0= attrTexCoord + (-3.0368997744118595 * res);\n    coord1= attrTexCoord + (-2.089778445362373 * res);\n    coord2= attrTexCoord + (-1.2004366090034069 * res);\n    coord4= attrTexCoord + (1.2004366090034069 * res);\n    coord5= attrTexCoord + (2.089778445362373* res);\n    coord6= attrTexCoord + (3.0368997744118595 * res);\n\n    #ifdef CLAMP\n        coord0=clamp(coord0,0.0,1.0);\n        coord1=clamp(coord1,0.0,1.0);\n        coord2=clamp(coord2,0.0,1.0);\n        coord3=clamp(coord3,0.0,1.0);\n        coord4=clamp(coord4,0.0,1.0);\n        coord5=clamp(coord5,0.0,1.0);\n        coord6=clamp(coord6,0.0,1.0);\n    #endif\n\n    gl_Position = projMatrix * mvMatrix * pos;\n}\n",};
// http://dev.theomader.com/gaussian-kernel-calculator/
// http://rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/

const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    inPasses = op.inFloat("Passes", 3),
    clamp = op.inBool("Clamp", false),
    direction = op.inDropDown("direction", ["both", "vertical", "horizontal"], "both"),
    mask = op.inTexture("Mask"),
    maskInvert = op.inBool("Mask Invert", false);

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "fastblur");

op.setPortGroup("Mask", [mask, maskInvert]);

shader.setSource(attachments.blur_vert, attachments.blur_frag);
const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    uniDirX = new CGL.Uniform(shader, "f", "dirX", 0),
    uniDirY = new CGL.Uniform(shader, "f", "dirY", 0),
    uniWidth = new CGL.Uniform(shader, "f", "width", 0),
    uniHeight = new CGL.Uniform(shader, "f", "height", 0),
    uniPass = new CGL.Uniform(shader, "f", "pass", 0),
    uniAmount = new CGL.Uniform(shader, "f", "amount", inPasses.get()),
    textureAlpha = new CGL.Uniform(shader, "t", "texMask", 1);

inPasses.onChange = () => { uniAmount.setValue(inPasses.get()); };

let dir = 0;
direction.onChange = () =>
{
    if (direction.get() == "both") dir = 0;
    if (direction.get() == "horizontal") dir = 1;
    if (direction.get() == "vertical") dir = 2;
};

clamp.onChange = () => { shader.toggleDefine("CLAMP", clamp.get()); };

maskInvert.onChange =
    mask.onChange = updateDefines;
updateDefines();

function updateDefines()
{
    shader.toggleDefine("USE_MASK", mask.isLinked());
    shader.toggleDefine("MASK_INVERT", maskInvert.get());

    maskInvert.setUiAttribs({ "greyout": !mask.isLinked() });
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
    uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);
    const numPasses = inPasses.get();

    if (mask.get())cgl.setTexture(1, mask.get().tex);

    for (let i = 0; i < numPasses; i++)
    {
        cgl.pushShader(shader);

        uniPass.setValue(i / numPasses);

        // first pass
        if (dir === 0 || dir == 2)
        {
            cgl.currentTextureEffect.bind();
            cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

            uniDirX.setValue(0.0);
            uniDirY.setValue(1.0 + (i * i));

            cgl.currentTextureEffect.finish();
        }

        // second pass
        if (dir === 0 || dir == 1)
        {
            cgl.currentTextureEffect.bind();
            cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

            uniDirX.setValue(1.0 + (i * i));
            uniDirY.setValue(0.0);

            cgl.currentTextureEffect.finish();
        }

        cgl.popShader();
    }

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.FastBlur_v2.prototype = new CABLES.Op();
CABLES.OPS["61ed277f-d096-43b2-9de8-dc87fb3a9169"]={f:Ops.Gl.ImageCompose.FastBlur_v2,objName:"Ops.Gl.ImageCompose.FastBlur_v2"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Vignette_v3
// 
// **************************************************************

Ops.Gl.ImageCompose.Vignette_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"vignette_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float lensRadius1;\nUNI float aspect;\nUNI float amount;\nUNI float strength;\nUNI float sharp;\n\nUNI vec3 vcol;\n\n{{CGL.BLENDMODES3}}\n\nvoid main()\n{\n    vec4 base=texture(tex,texCoord);\n    vec4 vvcol=vec4(vcol,1.0);\n    vec4 col=texture(tex,texCoord);\n    vec2 tcPos=vec2(texCoord.x,(texCoord.y-0.5)*aspect+0.5);\n    float dist = distance(tcPos, vec2(0.5,0.5));\n    float am = (1.0-smoothstep( (lensRadius1+0.5), (lensRadius1*0.99+0.5)*sharp, dist));\n\n    col=mix(col,vvcol,am*strength);\n\n    #ifndef ALPHA\n        outColor=cgl_blendPixel(base,col,amount);\n    #endif\n\n    #ifdef ALPHA\n        outColor=vec4(base.rgb,base.a*(1.0-am*strength));\n    #endif\n}\n",};
const
    render = op.inTrigger("Render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    maskAlpha = CGL.TextureEffect.AddBlendAlphaMask(op),
    amount = op.inValueSlider("Amount", 1),
    trigger = op.outTrigger("Trigger"),
    strength = op.inValueSlider("Strength", 1),
    lensRadius1 = op.inValueSlider("Radius", 0.3),
    sharp = op.inValueSlider("Sharp", 0.25),
    aspect = op.inValue("Aspect", 1),
    r = op.inValueSlider("r", 0),
    g = op.inValueSlider("g", 0),
    b = op.inValueSlider("b", 0),
    alpha = op.inBool("Alpha", false);

r.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "vignette");

shader.setSource(shader.getDefaultVertexShader(), attachments.vignette_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount),
    uniLensRadius1 = new CGL.Uniform(shader, "f", "lensRadius1", lensRadius1),
    uniaspect = new CGL.Uniform(shader, "f", "aspect", aspect),
    unistrength = new CGL.Uniform(shader, "f", "strength", strength),
    unisharp = new CGL.Uniform(shader, "f", "sharp", sharp),
    unir = new CGL.Uniform(shader, "3f", "vcol", r, g, b);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount, maskAlpha);

alpha.onChange = updateDefines;
updateDefines();

function updateDefines()
{
    shader.toggleDefine("ALPHA", alpha.get());

    r.setUiAttribs({ "greyout": alpha.get() });
    g.setUiAttribs({ "greyout": alpha.get() });
    b.setUiAttribs({ "greyout": alpha.get() });
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.Vignette_v3.prototype = new CABLES.Op();
CABLES.OPS["588302cb-f5a7-4129-90d2-ba66212d69e5"]={f:Ops.Gl.ImageCompose.Vignette_v3,objName:"Ops.Gl.ImageCompose.Vignette_v3"};




// **************************************************************
// 
// Ops.Gl.TextMeshMSDF_v2
// 
// **************************************************************

Ops.Gl.TextMeshMSDF_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"textmeshsdf_frag":"\nUNI sampler2D tex0;\nUNI sampler2D tex1;\nUNI sampler2D tex2;\nUNI sampler2D tex3;\n\nIN vec2 texCoord;\nIN vec4 fragAttrColors;\n\nUNI vec4 color;\nUNI vec2 texSize;\n\n#ifdef BORDER\n    UNI float borderWidth;\n    UNI float borderSmooth;\n    UNI vec3 colorBorder;\n#endif\n\n#ifdef TEXTURE_COLOR\nUNI sampler2D texMulColor;\n#endif\n#ifdef TEXTURE_MASK\nUNI sampler2D texMulMask;\n#endif\n\nUNI float smoothing;\nIN float texIndex;\n\n#ifdef SHADOW\n    UNI float shadowWidth;\n#endif\n\n\nfloat median(float r, float g, float b)\n{\n    return max(min(r, g), min(max(r, g), b));\n}\n\nvoid main()\n{\n    vec4 bgColor=vec4(0.0,0.0,0.0,0.0);\n    vec4 fgColor=color;\n    float opacity=1.0;\n\n    #ifndef SDF\n        if(int(texIndex)==0) outColor = texture(tex0, texCoord);\n        if(int(texIndex)==1) outColor = texture(tex1, texCoord);\n        if(int(texIndex)==2) outColor = texture(tex2, texCoord);\n        if(int(texIndex)==3) outColor = texture(tex3, texCoord);\n\n        return;\n    #endif\n\n\n    #ifdef TEXTURE_COLOR\n        fgColor.rgb *= texture(texMulColor, vec2(0.0,0.0)).rgb; //todo texcoords from char positioning\n    #endif\n    #ifdef TEXTURE_MASK\n        opacity *= texture(texMulMask, vec2(0.0,0.0)).r; //todo texcoords from char positioning\n    #endif\n\n\n    #ifdef SHADOW\n        vec2 msdfUnit1 = texSize;\n        vec2 tcv=vec2(texCoord.x-0.002,texCoord.y-0.002);\n        vec3 smpl1;\n        if(int(texIndex)==0) smpl1 = texture(tex0, tcv).rgb;\n        if(int(texIndex)==1) smpl1 = texture(tex1, tcv).rgb;\n        if(int(texIndex)==2) smpl1 = texture(tex2, tcv).rgb;\n        if(int(texIndex)==3) smpl1 = texture(tex3, tcv).rgb;\n\n        float sigDist1 = median(smpl1.r, smpl1.g, smpl1.b) - 0.001;\n        float opacity1 = smoothstep(0.0,0.9,sigDist1*sigDist1);\n        outColor = mix(bgColor, vec4(0.0,0.0,0.0,1.0), opacity1);\n    #endif\n\n    vec2 msdfUnit = 8.0/texSize;\n    vec3 smpl;\n\n    if(int(texIndex)==0) smpl = texture(tex0, texCoord).rgb;\n    if(int(texIndex)==1) smpl = texture(tex1, texCoord).rgb;\n    if(int(texIndex)==2) smpl = texture(tex2, texCoord).rgb;\n    if(int(texIndex)==3) smpl = texture(tex3, texCoord).rgb;\n\n\n    float sigDist = median(smpl.r, smpl.g, smpl.b) - 0.5;\n    sigDist *= dot(msdfUnit, (0.5+(smoothing-0.5))/fwidth(texCoord));\n    opacity *= clamp(sigDist + 0.5, 0.0, 1.0);\n\n    #ifdef BORDER\n        float sigDist2 = median(smpl.r, smpl.g, smpl.b) - 0.01;\n        float bw=borderWidth*0.6+0.24;\n        float opacity2 = smoothstep(bw-borderSmooth,bw+borderSmooth,sigDist2*sigDist2);\n        fgColor=mix(fgColor,vec4(colorBorder,1.0),1.0-opacity2);\n    #endif\n\n    float opa=opacity*color.a;\n\n    if(opa==0.0)discard;\n\n    outColor = mix(outColor, fgColor, opa);\n\n#ifdef HAS_ATTR_COLORS\n    outColor*=fragAttrColors;\n#endif\n}\n\n","textmeshsdf_vert":"UNI sampler2D tex1;\nUNI sampler2D tex2;\nUNI sampler2D tex3;\nUNI sampler2D tex4;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN mat4 instMat;\nIN vec2 attrTexOffsets;\nIN vec2 attrSize;\nIN vec2 attrTcSize;\nIN float attrPage;\nIN vec4 attrColors;\n\nOUT vec2 texCoord;\nOUT float texIndex;\nOUT vec4 fragAttrColors;\n\n\n\n\nconst float mulSize=0.01;\n\nvoid main()\n{\n    texCoord=(attrTexOffsets+attrTexCoord*attrTcSize);\n    texCoord.y=1.0-texCoord.y;\n\n    mat4 instMVMat=instMat;\n    vec4 vert=vec4( vPosition, 1. );\n    vert.x*=attrSize.x*mulSize;\n    vert.y*=attrSize.y*mulSize;\n\n    fragAttrColors=attrColors;\n\n    texIndex=attrPage+0.4; // strange ios rounding errors?!\n\n    mat4 mvMatrix=viewMatrix * modelMatrix * instMVMat;\n\n    gl_Position = projMatrix * mvMatrix * vert;\n}\n",};
// https://soimy.github.io/msdf-bmfont-xml/

// antialiasing:
// https://github.com/Chlumsky/msdfgen/issues/22

const
    render = op.inTrigger("Render"),
    str = op.inString("Text", "cables"),
    inFont = op.inDropDown("Font", [], "", true),
    scale = op.inFloat("Scale", 0.25),

    letterSpace = op.inFloat("Letter Spacing", 0),
    lineHeight = op.inFloat("Line Height", 1),

    align = op.inSwitch("Align", ["Left", "Center", "Right"], "Center"),
    valign = op.inSwitch("Vertical Align", ["Zero", "Top", "Middle", "Bottom"], "Middle"),

    r = op.inValueSlider("r", 1),
    g = op.inValueSlider("g", 1),
    b = op.inValueSlider("b", 1),
    a = op.inValueSlider("a", 1),
    doSDF = op.inBool("SDF", true),

    smoothing = op.inValueSlider("Smoothing", 0.3),

    inBorder = op.inBool("Border", false),
    inBorderWidth = op.inFloatSlider("Border Width", 0.5),
    inBorderSmooth = op.inFloatSlider("Smoothness", 0.25),
    br = op.inValueSlider("Border r", 1),
    bg = op.inValueSlider("Border g", 1),
    bb = op.inValueSlider("Border b", 1),

    inShadow = op.inBool("Shadow", false),

    inTexColor = op.inTexture("Texture Color"),
    inTexMask = op.inTexture("Texture Mask"),

    inPosArr = op.inArray("Positions"),
    inScaleArr = op.inArray("Scalings"),
    inRotArr = op.inArray("Rotations"),
    inColors = op.inArray("Colors"),

    next = op.outTrigger("Next"),
    outArr = op.outArray("Positions Original", null, 3),

    outScales = op.outArray("Scales", null, 2),
    outLines = op.outNumber("Num Lines"),

    outWidth = op.outNumber("Width"),
    outHeight = op.outNumber("Height"),
    outStartY = op.outNumber("Start Y"),
    outNumChars = op.outNumber("Num Chars");

op.setPortGroup("Size", [letterSpace, lineHeight, scale]);
op.setPortGroup("Character Transformations", [inScaleArr, inRotArr, inPosArr]);
op.setPortGroup("Alignment", [align, valign]);
op.setPortGroup("Color", [r, g, b, a, doSDF]);
op.setPortGroup("Border", [br, bg, bb, inBorderSmooth, inBorderWidth, inBorder]);

r.setUiAttribs({ "colorPick": true });
br.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;
const fontDataVarPrefix = "font_data_";
const substrLength = fontDataVarPrefix.length;
const alignVec = vec3.create();
const vScale = vec3.create();
const shader = new CGL.Shader(cgl, "TextMeshSDF");
shader.define("INSTANCING");

let fontTexs = null;
let fontData = null;
let fontChars = null;
let needUpdate = true;
let geom = null;
let mesh = null;
let disabled = false;
let valignMode = 1;
let heightAll = 0, widthAll = 0;
let avgHeight = 0;
let minY, maxY, minX, maxX;
let needsUpdateTransmats = true;
let transMats = null;
let offY = 0;

if (cgl.glVersion == 1)
{
    cgl.gl.getExtension("OES_standard_derivatives");
    shader.enableExtension("GL_OES_standard_derivatives");
}

shader.setSource(attachments.textmeshsdf_vert, attachments.textmeshsdf_frag);

const
    uniTex = new CGL.Uniform(shader, "t", "tex0", 0),
    uniTex1 = new CGL.Uniform(shader, "t", "tex1", 1),
    uniTex2 = new CGL.Uniform(shader, "t", "tex2", 2),
    uniTex3 = new CGL.Uniform(shader, "t", "tex3", 3),
    uniTexMul = new CGL.Uniform(shader, "t", "texMulColor", 4),
    uniTexMulMask = new CGL.Uniform(shader, "t", "texMulMask", 5),
    uniColor = new CGL.Uniform(shader, "4f", "color", r, g, b, a),
    uniColorBorder = new CGL.Uniform(shader, "3f", "colorBorder", br, bg, bb),

    uniTexSize = new CGL.Uniform(shader, "2f", "texSize", 0, 0),

    uniSmoothing = new CGL.Uniform(shader, "f", "smoothing", smoothing),
    uniborderSmooth = new CGL.Uniform(shader, "f", "borderSmooth", inBorderSmooth),
    uniborderWidth = new CGL.Uniform(shader, "f", "borderWidth", inBorderWidth);

scale.onChange = updateScale;

inRotArr.onChange =
    inPosArr.onChange =
    inScaleArr.onChange = function () { needsUpdateTransmats = true; };

inTexColor.onChange =
inTexMask.onChange =
inShadow.onChange =
inBorder.onChange =
doSDF.onChange =
    updateDefines;

inColors.onLinkChanged = () =>
{
    updateDefines();
    needsUpdateTransmats = true;
    needUpdate = true;
};

inColors.onChange = () =>
{
    needUpdate = true;
    if (mesh && inColors.get() && inColors.isLinked())
        mesh.setAttribute("attrColors", new Float32Array(inColors.get()), 4, { "instanced": true });
};

align.onChange =
    str.onChange =
    letterSpace.onChange =
    lineHeight.onChange =
    function ()
    {
        needUpdate = true;
    };

valign.onChange = updateAlign;

op.patch.addEventListener("variablesChanged", updateFontList);
op.patch.addEventListener("FontLoadedMSDF", updateFontList);

inFont.onChange = updateFontData;

updateDefines();
updateScale();
updateFontList();

function updateDefines()
{
    shader.toggleDefine("SDF", doSDF.get());
    shader.toggleDefine("SHADOW", inShadow.get());
    shader.toggleDefine("BORDER", inBorder.get());
    shader.toggleDefine("TEXTURE_COLOR", inTexColor.isLinked());
    shader.toggleDefine("TEXTURE_MASK", inTexMask.isLinked());
    shader.toggleDefine("HAS_ATTR_COLORS", inColors.isLinked());

    br.setUiAttribs({ "greyout": !inBorder.get() });
    bg.setUiAttribs({ "greyout": !inBorder.get() });
    bb.setUiAttribs({ "greyout": !inBorder.get() });
    inBorderSmooth.setUiAttribs({ "greyout": !inBorder.get() });
    inBorderWidth.setUiAttribs({ "greyout": !inBorder.get() });
}

function updateFontData()
{
    updateFontList();
    const varname = fontDataVarPrefix + inFont.get();

    fontData = null;
    fontTexs = null;
    fontChars = {};

    const dataVar = op.patch.getVar(varname);

    if (!dataVar || !dataVar.getValue())
    {
        fontData = null;

        // op.warn("no varname", varname);
        return;
    }

    fontData = dataVar.getValue().data;

    if (!fontData)
    {
        return;
    }

    const basename = dataVar.getValue().basename;

    const textVar = op.patch.getVar("font_tex_" + basename);
    if (!textVar)
    {
        fontTexs = null;
        fontData = null;
        return;
    }

    fontTexs = textVar.getValue();

    for (let i = 0; i < fontData.chars.length; i++) fontChars[fontData.chars[i].char] = fontData.chars[i];
    needUpdate = true;
}

function updateFontList()
{
    const vars = op.patch.getVars();
    const names = ["..."];

    for (const i in vars)
        if (vars[i].type == "fontData")
            names.push(i.substr(substrLength));

    inFont.uiAttribs.values = names;
}

function updateScale()
{
    const s = scale.get();
    vec3.set(vScale, s, s, s);
    vec3.set(alignVec, 0, offY * s, 0);

    outWidth.set(widthAll * s);
    outHeight.set(heightAll * s);

    outStartY.set((maxY + offY) * s);
}

function updateAlign()
{
    if (minX == undefined) return;
    if (valign.get() == "Top") valignMode = 0;
    else if (valign.get() == "Middle") valignMode = 1;
    else if (valign.get() == "Bottom") valignMode = 2;
    else if (valign.get() == "Zero") valignMode = 3;

    offY = 0;
    widthAll = (Math.abs(minX - maxX));
    heightAll = (Math.abs(minY - maxY));

    if (valignMode === 1) offY = heightAll / 2;
    else if (valignMode === 2) offY = heightAll;

    if (valignMode != 0)offY -= avgHeight;

    updateScale();
}

function buildTransMats()
{
    needsUpdateTransmats = false;

    // if(!( inPosArr.get() || inScaleArr.get() || inRotArr.get()))
    // {
    //     transMats=null;
    //     return;
    // }

    const transformations = [];
    const translates = inPosArr.get() || outArr.get();
    const scales = inScaleArr.get();
    const rots = inRotArr.get();

    for (let i = 0; i < mesh.numInstances; i++)
    {
        const m = mat4.create();
        mat4.translate(m, m, [translates[i * 3 + 0], translates[i * 3 + 1], translates[i * 3 + 2]]);

        if (scales) mat4.scale(m, m, [scales[i * 3 + 0], scales[i * 3 + 1], scales[i * 3 + 2]]);

        if (rots)
        {
            mat4.rotateX(m, m, rots[i * 3 + 0] * CGL.DEG2RAD);
            mat4.rotateY(m, m, rots[i * 3 + 1] * CGL.DEG2RAD);
            mat4.rotateZ(m, m, rots[i * 3 + 2] * CGL.DEG2RAD);
        }

        transformations.push(Array.prototype.slice.call(m));
    }

    transMats = [].concat.apply([], transformations);
}

render.onTriggered = function ()
{
    if (!fontData || !fontTexs)
    {
        updateFontData();
    }

    if (!fontData)
    {
        op.setUiError("nodata", "No font data!");
        op.setUiError("msdfhint", "Use the FontMSDF op to create font and texture.", 0);
    }
    if (!fontTexs)
    {
        op.setUiError("nodata", "No font texture");
        op.setUiError("msdfhint", "Use the FontMSDF op to create font and texture.", 0);
    }
    if (fontTexs && fontData)
    {
        op.setUiError("nodata", null);
        op.setUiError("msdfhint", null);
    }

    if (needUpdate)
    {
        generateMesh();
        needUpdate = false;
    }

    if (mesh && mesh.numInstances > 0 && fontTexs)
    {
        cgl.pushShader(shader);

        cgl.setTexture(0, CGL.Texture.getEmptyTexture(cgl).tex);

        if (fontTexs[0]) uniTexSize.setValue([fontTexs[0].width, fontTexs[0].height]);

        if (fontTexs[0]) cgl.setTexture(0, fontTexs[0].tex);
        else cgl.setTexture(0, CGL.Texture.getEmptyTexture(cgl).tex);

        if (fontTexs[1])cgl.setTexture(1, fontTexs[1].tex);
        else cgl.setTexture(1, CGL.Texture.getEmptyTexture(cgl).tex);

        if (fontTexs[2])cgl.setTexture(2, fontTexs[2].tex);
        else cgl.setTexture(2, CGL.Texture.getEmptyTexture(cgl).tex);

        if (fontTexs[3])cgl.setTexture(3, fontTexs[3].tex);
        else cgl.setTexture(3, CGL.Texture.getEmptyTexture(cgl).tex);

        if (inTexColor.get()) cgl.setTexture(4, inTexColor.get().tex);
        if (inTexMask.get()) cgl.setTexture(5, inTexMask.get().tex);

        cgl.pushModelMatrix();
        mat4.translate(cgl.mMatrix, cgl.mMatrix, alignVec);

        if (needsUpdateTransmats) buildTransMats();
        if (transMats) mesh.setAttribute("instMat", new Float32Array(transMats), 16, { "instanced": true });

        if (!disabled)
        {
            mat4.scale(cgl.mMatrix, cgl.mMatrix, vScale);

            mesh.render(cgl.getShader());
        }

        cgl.popModelMatrix();

        // cgl.setTexture(0, null);
        cgl.popShader();
        // cgl.popBlendMode();
    }

    next.trigger();
};

function getChar(chStr)
{
    return fontChars[String(chStr)] || fontChars["?"] || fontChars._ || fontChars.X;
}

function generateMesh()
{
    if (!fontData || !fontChars)
    {
        outNumChars.set(0);
        return;
    }

    const theString = String(str.get() + "");

    if (!geom)
    {
        geom = new CGL.Geometry("textmesh");

        geom.vertices = [
            0.5, 0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, -0.5, 0.0,
            -0.5, -0.5, 0.0
        ];

        geom.normals = [
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0
        ];

        geom.texCoords = new Float32Array([
            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);

        geom.verticesIndices = [
            0, 1, 2,
            2, 1, 3
        ];
    }

    if (mesh)mesh.dispose();
    mesh = new CGL.Mesh(cgl, geom);

    const strings = (theString).split("\n");
    const transformations = [];
    const tcOffsets = [];
    const sizes = [];
    const texPos = [];
    const tcSizes = [];
    const pages = [];
    let charCounter = 0;
    const arrPositions = [];

    const mulSize = 0.01;

    outLines.set(strings.length);
    minY = 99999;
    maxY = -99999;
    minX = 99999;
    maxX = -99999;

    avgHeight = 0;

    for (let i = 0; i < fontData.chars.length; i++)
    {
        if (fontData.chars[i].height) avgHeight += fontData.chars[i].height;
    }
    avgHeight /= fontData.chars.length;
    avgHeight *= mulSize;

    for (let s = 0; s < strings.length; s++)
    {
        const txt = strings[s];
        const numChars = txt.length;
        let lineWidth = 0;

        for (let i = 0; i < numChars; i++)
        {
            const chStr = txt.substring(i, i + 1);
            const char = getChar(chStr);
            if (char) lineWidth += char.xadvance * mulSize + letterSpace.get();
        }

        let pos = 0;
        if (align.get() == "Right") pos -= lineWidth;
        else if (align.get() == "Center") pos -= lineWidth / 2;

        for (let i = 0; i < numChars; i++)
        {
            const m = mat4.create();

            const chStr = txt.substring(i, i + 1);
            const char = getChar(chStr);

            if (!char) continue;

            pages.push(char.page || 0);
            sizes.push(char.width, char.height);

            tcOffsets.push(char.x / fontData.common.scaleW, (char.y / fontData.common.scaleH));

            const charWidth = char.width / fontData.common.scaleW;
            const charHeight = char.height / fontData.common.scaleH;
            const charOffsetY = (char.yoffset / fontData.common.scaleH);
            const charOffsetX = char.xoffset / fontData.common.scaleW;

            if (chStr == " ") tcSizes.push(0, 0);
            else tcSizes.push(charWidth, charHeight);

            mat4.identity(m);

            let adv = (char.xadvance / 2) * mulSize;
            pos += adv;

            const x = pos + (char.xoffset / 2) * mulSize;
            const y = (s * -lineHeight.get()) + (avgHeight) - (mulSize * (char.yoffset + char.height / 2));

            minX = Math.min(x - charWidth, minX);
            maxX = Math.max(x + charWidth, maxX);
            minY = Math.min(y - charHeight - avgHeight / 2, minY);
            maxY = Math.max(y + charHeight + avgHeight / 2, maxY);

            mat4.translate(m, m, [x, y, 0]);
            arrPositions.push(x, y, 0);

            adv = (char.xadvance / 2) * mulSize + letterSpace.get();

            pos += adv;

            minX = Math.min(pos - charWidth, minX);
            maxX = Math.max(pos + charWidth, maxX);

            transformations.push(Array.prototype.slice.call(m));

            charCounter++;
        }
    }

    transMats = [].concat.apply([], transformations);

    disabled = false;
    if (transMats.length == 0) disabled = true;

    mesh.numInstances = transMats.length / 16;
    outNumChars.set(mesh.numInstances);

    if (mesh.numInstances == 0)
    {
        disabled = true;
        return;
    }

    mesh.setAttribute("instMat", new Float32Array(transMats), 16, { "instanced": true });
    mesh.setAttribute("attrTexOffsets", new Float32Array(tcOffsets), 2, { "instanced": true });
    mesh.setAttribute("attrTcSize", new Float32Array(tcSizes), 2, { "instanced": true });
    mesh.setAttribute("attrSize", new Float32Array(sizes), 2, { "instanced": true });
    mesh.setAttribute("attrPage", new Float32Array(pages), 1, { "instanced": true });

    if (inColors.isLinked())
        mesh.setAttribute("attrColors", new Float32Array(inColors.get()), 4, { "instanced": true });

    outScales.set(sizes);
    updateAlign();
    needsUpdateTransmats = true;
    outArr.setRef(arrPositions);
}


};

Ops.Gl.TextMeshMSDF_v2.prototype = new CABLES.Op();
CABLES.OPS["b5c99363-a749-4040-884b-66f91294bcad"]={f:Ops.Gl.TextMeshMSDF_v2,objName:"Ops.Gl.TextMeshMSDF_v2"};




// **************************************************************
// 
// Ops.Math.Round
// 
// **************************************************************

Ops.Math.Round = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValueFloat("number"),
    decPlaces = op.inInt("Decimal Places", 0),
    result = op.outNumber("result");

let decm = 0;

number1.onChange = exec;
decPlaces.onChange = updateDecm;

updateDecm();

function updateDecm()
{
    decm = Math.pow(10, decPlaces.get());
    exec();
}

function exec()
{
    result.set(Math.round(number1.get() * decm) / decm);
}


};

Ops.Math.Round.prototype = new CABLES.Op();
CABLES.OPS["1a1ef636-6d02-42ba-ae1e-627b917d0d2b"]={f:Ops.Math.Round,objName:"Ops.Math.Round"};




// **************************************************************
// 
// Ops.String.NumberToString_v2
// 
// **************************************************************

Ops.String.NumberToString_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    val = op.inValue("Number"),
    decPlaces = op.inInt("Decimal Places", 4),
    result = op.outString("Result");

let doDec = false;
let decm = 1;
decPlaces.onChange = updateDecm;
val.onChange = update;
updateDecm();
update();

function updateDecm()
{
    doDec = decPlaces.get() < 100;
    decm = Math.pow(10, decPlaces.get());
    update();
}

function update()
{
    if (doDec)
        result.set(String(Math.round(val.get() * decm) / decm));
    else
        result.set(String(val.get() || 0));
}


};

Ops.String.NumberToString_v2.prototype = new CABLES.Op();
CABLES.OPS["5c6d375a-82db-4366-8013-93f56b4061a9"]={f:Ops.String.NumberToString_v2,objName:"Ops.String.NumberToString_v2"};




// **************************************************************
// 
// Ops.Math.Incrementor
// 
// **************************************************************

Ops.Math.Incrementor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    increment = op.inTriggerButton("Increment"),
    decrement = op.inTriggerButton("Decrement"),
    inLimit = op.inBool("Limit", false),
    inLength = op.inValueInt("Length"),
    inMode = op.inSwitch("Mode", ["Rewind", "Stop at Max"], "Rewind"),
    inDefault = op.inValueInt("Default", 0),
    reset = op.inTriggerButton("Reset"),
    outChanged = op.outTrigger("Changed"),
    value = op.outNumber("Value"),
    outRestarted = op.outTrigger("Restarted");

const MODE_REWIND = 0;
const MODE_STOP = 1;
value.ignoreValueSerialize = true;
inLength.set(10);
let val = 0;
let mode = MODE_REWIND;
value.set(0);

inLength.onTriggered = reset;
inDefault.onChange = doReset;
reset.onTriggered = doReset;
inLimit.onChange = updateUi;

updateUi();

inMode.onChange = () =>
{
    if (inMode.get() == "Rewind")
    {
        mode = MODE_REWIND;
    }
    if (inMode.get() == "Stop at Max")
    {
        mode = MODE_STOP;
    }
};

function updateUi()
{
    inLength.setUiAttribs({ "greyout": !inLimit.get() });
    inMode.setUiAttribs({ "greyout": !inLimit.get() });
}

function doReset()
{
    value.set(null);
    val = inDefault.get();
    value.set(val);
    outRestarted.trigger();
}

decrement.onTriggered = function ()
{
    val--;
    if (inLimit.get())
    {
        if (mode == MODE_REWIND && val < 0)val = inLength.get() - 1;
        if (mode == MODE_STOP && val < 0)val = 0;
    }
    value.set(val);

    outChanged.trigger();
};

increment.onTriggered = function ()
{
    val++;
    if (inLimit.get())
    {
        if (mode == MODE_REWIND && val >= inLength.get())
        {
            val = 0;
            outRestarted.trigger();
        }
        if (mode == MODE_STOP && val >= inLength.get())val = inLength.get() - 1;
    }

    value.set(val);

    outChanged.trigger();
};


};

Ops.Math.Incrementor.prototype = new CABLES.Op();
CABLES.OPS["45cc0011-ada8-4423-8f5b-39a3810b8389"]={f:Ops.Math.Incrementor,objName:"Ops.Math.Incrementor"};




// **************************************************************
// 
// Ops.Math.SmootherStep
// 
// **************************************************************

Ops.Math.SmootherStep = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    val = op.inValueFloat("val", 0),
    min = op.inValueFloat("min", 0),
    max = op.inValueFloat("max", 1),
    result = op.outNumber("result");

val.onChange = max.onChange = min.onChange = exec;
exec();

function exec()
{
    let x = Math.max(0, Math.min(1, (val.get() - min.get()) / (max.get() - min.get())));
    result.set(x * x * x * (x * (x * 6 - 15) + 10) * (max.get() - min.get())); // smootherstep
}


};

Ops.Math.SmootherStep.prototype = new CABLES.Op();
CABLES.OPS["c66da84f-ff2f-45de-b3c2-557bdf1cb946"]={f:Ops.Math.SmootherStep,objName:"Ops.Math.SmootherStep"};




// **************************************************************
// 
// Ops.String.StringCompose_v3
// 
// **************************************************************

Ops.String.StringCompose_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    format=op.inString('Format',"hello $a, $b $c und $d"),
    a=op.inString('String A','world'),
    b=op.inString('String B',1),
    c=op.inString('String C',2),
    d=op.inString('String D',3),
    e=op.inString('String E'),
    f=op.inString('String F'),
    result=op.outString("Result");

format.onChange=
    a.onChange=
    b.onChange=
    c.onChange=
    d.onChange=
    e.onChange=
    f.onChange=update;

update();

function update()
{
    var str=format.get()||'';
    if(typeof str!='string')
        str='';

    str = str.replace(/\$a/g, a.get());
    str = str.replace(/\$b/g, b.get());
    str = str.replace(/\$c/g, c.get());
    str = str.replace(/\$d/g, d.get());
    str = str.replace(/\$e/g, e.get());
    str = str.replace(/\$f/g, f.get());

    result.set(str);
}

};

Ops.String.StringCompose_v3.prototype = new CABLES.Op();
CABLES.OPS["6afea9f4-728d-4f3c-9e75-62ddc1448bf0"]={f:Ops.String.StringCompose_v3,objName:"Ops.String.StringCompose_v3"};




// **************************************************************
// 
// Ops.Gl.Meshes.Circle_v3
// 
// **************************************************************

Ops.Gl.Meshes.Circle_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    radius = op.inValue("radius", 0.5),
    innerRadius = op.inValueSlider("innerRadius", 0),
    segments = op.inValueInt("segments", 40),
    percent = op.inValueSlider("percent", 1),
    steps = op.inValue("steps", 0),
    invertSteps = op.inValueBool("invertSteps", false),
    mapping = op.inSwitch("mapping", ["flat", "round"]),
    drawSpline = op.inValueBool("Spline", false),
    inDraw = op.inValueBool("Draw", true),
    trigger = op.outTrigger("trigger"),
    geomOut = op.outObject("geometry", null, "geometry");

op.setPortGroup("Size", [radius, innerRadius]);
op.setPortGroup("Display", [percent, steps, invertSteps]);
op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_FUNCTION);

inDraw.setUiAttribs({ "title": "Render mesh" });

mapping.set("flat");

mapping.onChange =
    segments.onChange =
    radius.onChange =
    innerRadius.onChange =
    percent.onChange =
    steps.onChange =
    invertSteps.onChange =
    drawSpline.onChange = calcLater;

geomOut.ignoreValueSerialize = true;
const cgl = op.patch.cgl;

let geom = new CGL.Geometry("circle");
let mesh = null;
const lastSegs = -1;

let oldPrim = 0;
let shader = null;
let needsCalc = true;

render.onTriggered = renderMesh;

op.preRender = () =>
{
    renderMesh();
};

render.onLinkChanged = function ()
{
    if (!render.isLinked()) geomOut.set(null);
    else geomOut.setRef(geom);
};

function renderMesh()
{
    if (!op.patch.cg) return;
    if (needsCalc)calc();

    if (!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    shader = op.patch.cg.getShader();
    if (!shader) return;
    oldPrim = shader.glPrimitive;

    if (drawSpline.get()) shader.glPrimitive = cgl.gl.LINE_STRIP;

    if (inDraw.get() && mesh)
    {
        // mesh.instances = 3;
        mesh.render(shader);
    }
    trigger.trigger();

    shader.glPrimitive = oldPrim;
}

function calc()
{
    const segs = Math.max(3, Math.floor(segments.get()));

    geom.clear();

    const faces = [];
    const texCoords = [];
    const vertexNormals = [];
    const tangents = [];
    const biTangents = [];

    let i = 0, degInRad = 0;
    let oldPosX = 0, oldPosY = 0;
    let oldPosXTexCoord = 0, oldPosYTexCoord = 0;

    let oldPosXIn = 0, oldPosYIn = 0;
    let oldPosXTexCoordIn = 0, oldPosYTexCoordIn = 0;

    let posxTexCoordIn = 0, posyTexCoordIn = 0;
    let posxTexCoord = 0, posyTexCoord = 0;
    let posx = 0, posy = 0;

    const perc = Math.max(0.0, percent.get());
    const verts = [];

    if (drawSpline.get())
    {
        let lastX = 0;
        let lastY = 0;
        const tc = [];
        for (i = 0; i <= segs * perc; i++)
        {
            degInRad = (360 / segs) * i * CGL.DEG2RAD;
            posx = Math.cos(degInRad) * radius.get();
            posy = Math.sin(degInRad) * radius.get();

            posyTexCoord = 0.5;

            if (i > 0)
            {
                verts.push(lastX);
                verts.push(lastY);
                verts.push(0);
                posxTexCoord = 1.0 - (i - 1) / segs;

                tc.push(posxTexCoord, posyTexCoord);
            }
            verts.push(posx);
            verts.push(posy);
            verts.push(0);

            lastX = posx;
            lastY = posy;
        }
        geom.setPointVertices(verts);
    }
    else
    if (innerRadius.get() <= 0)
    {
        for (i = 0; i <= segs * perc; i++)
        {
            degInRad = (360 / segs) * i * CGL.DEG2RAD;
            posx = Math.cos(degInRad) * radius.get();
            posy = Math.sin(degInRad) * radius.get();

            if (mapping.get() == "flat")
            {
                posxTexCoord = (Math.cos(degInRad) + 1.0) / 2;
                posyTexCoord = 1.0 - (Math.sin(degInRad) + 1.0) / 2;
                posxTexCoordIn = 0.5;
                posyTexCoordIn = 0.5;
            }
            else if (mapping.get() == "round")
            {
                posxTexCoord = 1.0 - i / segs;
                posyTexCoord = 0;
                posxTexCoordIn = posxTexCoord;
                posyTexCoordIn = 1;
            }

            faces.push(
                [0, 0, 0],
                [oldPosX, oldPosY, 0],
                [posx, posy, 0]
            );

            texCoords.push(
                posxTexCoordIn, posyTexCoordIn, oldPosXTexCoord, oldPosYTexCoord, posxTexCoord, posyTexCoord
            );
            vertexNormals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
            tangents.push(1, 0, 0, 1, 0, 0, 1, 0, 0);
            biTangents.push(0, -1, 0, 0, -1, 0, 0, -1, 0);

            oldPosXTexCoord = posxTexCoord;
            oldPosYTexCoord = posyTexCoord;

            oldPosX = posx;
            oldPosY = posy;
        }

        geom = CGL.Geometry.buildFromFaces(faces, "circle");
        geom.vertexNormals = vertexNormals;
        geom.tangents = tangents;
        geom.biTangents = biTangents;
        geom.texCoords = texCoords;
    }
    else
    {
        let count = 0;
        const numSteps = segs * perc;
        const pos = 0;

        for (i = 0; i <= numSteps; i++)
        {
            count++;

            degInRad = (360 / segs) * i * CGL.DEG2RAD;
            posx = Math.cos(degInRad) * radius.get();
            posy = Math.sin(degInRad) * radius.get();

            const posxIn = Math.cos(degInRad) * innerRadius.get() * radius.get();
            const posyIn = Math.sin(degInRad) * innerRadius.get() * radius.get();

            if (mapping.get() == "round")
            {
                posxTexCoord = 1.0 - i / segs;
                posyTexCoord = 0;
                posxTexCoordIn = posxTexCoord;
                posyTexCoordIn = 1;
            }

            if (steps.get() === 0.0 ||
                (count % parseInt(steps.get(), 10) === 0 && !invertSteps.get()) ||
                (count % parseInt(steps.get(), 10) !== 0 && invertSteps.get()))
            {
                faces.push(
                    [posxIn, posyIn, 0],
                    [oldPosX, oldPosY, 0],
                    [posx, posy, 0]
                );

                faces.push(
                    [oldPosXIn, oldPosYIn, 0],
                    [oldPosX, oldPosY, 0],
                    [posxIn, posyIn, 0]
                );

                texCoords.push(
                    posxTexCoord, 0, oldPosXTexCoord, 0, posxTexCoordIn, 1, posxTexCoord, 1, oldPosXTexCoord, 0, oldPosXTexCoordIn, 1);

                vertexNormals.push(
                    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1
                );
                tangents.push(
                    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0
                );
                biTangents.push(
                    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1
                );
            }

            oldPosXTexCoordIn = posxTexCoordIn;
            oldPosYTexCoordIn = posyTexCoordIn;

            oldPosXTexCoord = posxTexCoord;
            oldPosYTexCoord = posyTexCoord;

            oldPosX = posx;
            oldPosY = posy;

            oldPosXIn = posxIn;
            oldPosYIn = posyIn;
        }

        geom = CGL.Geometry.buildFromFaces(faces, "circle");
        geom.vertexNormals = vertexNormals;
        geom.tangents = tangents;
        geom.biTangents = biTangents;

        if (mapping.get() == "flat") geom.mapTexCoords2d();
        else geom.texCoords = texCoords;
    }

    geomOut.setRef(geom);

    if (geom.vertices.length == 0) return;
    if (mesh) mesh.dispose();
    mesh = null;
    if (op.patch.cg)
        mesh = op.patch.cg.createMesh(geom, { "opId": op.id });
    needsCalc = false;
}

function calcLater()
{
    needsCalc = true;
}

op.onDelete = function ()
{
    if (mesh)mesh.dispose();
};


};

Ops.Gl.Meshes.Circle_v3.prototype = new CABLES.Op();
CABLES.OPS["ae07830b-91c3-4cbe-a7d6-d3b737392c16"]={f:Ops.Gl.Meshes.Circle_v3,objName:"Ops.Gl.Meshes.Circle_v3"};




// **************************************************************
// 
// Ops.Array.StringToArray_v2
// 
// **************************************************************

Ops.Array.StringToArray_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const text = op.inStringEditor("text", "1,2,3"),
    separator = op.inString("separator", ","),
    toNumber = op.inValueBool("Numbers", true),
    trim = op.inValueBool("Trim", true),
    splitNewLines = op.inBool("Split Lines", false),
    arr = op.outArray("array"),
    parsed = op.outTrigger("Parsed"),
    len = op.outNumber("length");

text.setUiAttribs({ "ignoreBigPort": true });

text.onChange = separator.onChange = toNumber.onChange = trim.onChange = parse;

splitNewLines.onChange = () =>
{
    separator.setUiAttribs({ "greyout": splitNewLines.get() });
    parse();
};

parse();

function parse()
{
    if (!text.get())
    {
        arr.set(null);
        arr.set([]);
        len.set(0);
        return;
    }

    let textInput = text.get();
    if (trim.get() && textInput)
    {
        textInput = textInput.replace(/^\s+|\s+$/g, "");
        textInput = textInput.trim();
    }

    let r;
    let sep = separator.get();
    if (separator.get() === "\\n") sep = "\n";
    if (splitNewLines.get()) r = textInput.split("\n");
    else r = textInput.split(sep);

    if (r[r.length - 1] === "") r.length -= 1;

    len.set(r.length);

    if (trim.get())
    {
        for (let i = 0; i < r.length; i++)
        {
            r[i] = r[i].replace(/^\s+|\s+$/g, "");
            r[i] = r[i].trim();
        }
    }

    op.setUiError("notnum", null);
    if (toNumber.get())
    {
        let hasStrings = false;
        for (let i = 0; i < r.length; i++)
        {
            r[i] = Number(r[i]);
            if (!CABLES.UTILS.isNumeric(r[i]))
            {
                hasStrings = true;
            }
        }
        if (hasStrings)
        {
            op.setUiError("notnum", "Parse Error / Not all values numerical!", 1);
        }
    }

    arr.setRef(r);
    parsed.trigger();
}


};

Ops.Array.StringToArray_v2.prototype = new CABLES.Op();
CABLES.OPS["c974de41-4ce4-4432-b94d-724741109c71"]={f:Ops.Array.StringToArray_v2,objName:"Ops.Array.StringToArray_v2"};




// **************************************************************
// 
// Ops.Array.ArrayGetString
// 
// **************************************************************

Ops.Array.ArrayGetString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    array = op.inArray("array"),
    index = op.inValueInt("index"),
    result = op.outString("result");

array.ignoreValueSerialize = true;

index.onChange = update;

array.onChange = function ()
{
    update();
};

function update()
{
    const arr = array.get();
    if (arr) result.set(arr[index.get()]);
}


};

Ops.Array.ArrayGetString.prototype = new CABLES.Op();
CABLES.OPS["be8f16c0-0c8a-48a2-a92b-45dbf88c76c1"]={f:Ops.Array.ArrayGetString,objName:"Ops.Array.ArrayGetString"};




// **************************************************************
// 
// Ops.Ui.VizArrayTable
// 
// **************************************************************

Ops.Ui.VizArrayTable = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inArr = op.inArray("Array"),
    inStride = op.inInt("Stride", 0),
    inOffset = op.inInt("Start Row", 0);

op.setUiAttrib({ "height": 200, "width": 400, "resizable": true, "vizLayerMaxZoom": 2500 });

function getCellValue(v)
{
    let str = "";

    if (typeof v == "string")
    {
        // if (CABLES.UTILS.isNumeric(v)) str = "\"" + v + "\"";
        // else str = v;
        str = "\"" + v + "\"";
    }
    else if (CABLES.UTILS.isNumeric(v)) str = String(Math.round(v * 10000) / 10000);
    else if (Array.isArray(v))
    {
        let preview = "...";
        if (v.length == 0) preview = "";
        str = "[" + preview + "] (" + v.length + ")";
    }
    else if (typeof v == "object")
    {
        try
        {
            str = JSON.stringify(v, true, 1);
        }
        catch (e)
        {
            str = "{???}";
        }
    }
    else if (v != v || v === undefined)
    {
        str += String(v);
    }
    else
    {
        str += String(v);
    }

    return str;
}

op.renderVizLayer = (ctx, layer) =>
{
    ctx.fillStyle = "#222";
    ctx.fillRect(layer.x, layer.y, layer.width, layer.height);

    ctx.save();
    ctx.scale(layer.scale, layer.scale);

    ctx.font = "normal 10px sourceCodePro";
    ctx.fillStyle = "#ccc";

    const arr = inArr.get() || [];
    let stride = inStride.get() || 1;

    if (inArr.get() === null) op.setUiAttrib({ "extendTitle": "null" });
    else if (inArr.get() === undefined) op.setUiAttrib({ "extendTitle": "undefined" });
    else op.setUiAttrib({ "extendTitle": "length: " + arr.length });

    if (inArr.links.length > 0 && inArr.links[0].getOtherPort(inArr))
        stride = inArr.links[0].getOtherPort(inArr).uiAttribs.stride || inStride.get() || 1;

    if (arr.length % stride != 0)op.setUiError("stride", "stride does not fit length of array. some values may not be shown", 1);
    else op.setUiError("stride", null);

    let lines = Math.floor(layer.height / layer.scale / 10 - 1);
    let padding = 4;
    let offset = inOffset.get() * stride;
    let columnsWidth = [];

    for (let i = 0; i < stride; i++)columnsWidth[i] = 0;

    for (let i = offset; i < offset + lines * stride; i += stride)
    {
        for (let s = 0; s < stride; s++)
        {
            const v = arr[i + s];

            columnsWidth[s] = Math.max(columnsWidth[s], getCellValue(v).length);
        }
    }

    let columsPos = [];
    let addUpPos = 30;
    for (let i = 0; i < stride; i++)
    {
        columsPos[i] = addUpPos;
        addUpPos += (columnsWidth[i] + 1) * 7;
    }

    for (let i = offset; i < offset + lines * stride; i += stride)
    {
        if (i < 0) continue;
        if (i + stride > arr.length) continue;

        ctx.fillStyle = "#666";

        const lineNum = (i) / stride;

        if (lineNum >= 0)
            ctx.fillText(lineNum,
                layer.x / layer.scale + padding,
                layer.y / layer.scale + 10 + (i - offset) / stride * 10 + padding);

        for (let s = 0; s < stride; s++)
        {
            const v = arr[i + s];
            let str = getCellValue(v);

            ctx.fillStyle = "#ccc";

            if (typeof v == "string")
            {
                str = v;
            }
            else if (CABLES.UTILS.isNumeric(v)) str = String(Math.round(v * 10000) / 10000);
            else if (Array.isArray(v))
            {
                str = JSON.stringify(v);
            }
            else if (typeof v == "object")
            {
                try
                {
                    str = JSON.stringify(v);
                }
                catch (e)
                {
                    str = "{object}";
                }
            }
            else if (v != v || v === undefined)
            {
                ctx.fillStyle = "#f00";
                str = "?";
            }

            ctx.fillText(str,
                layer.x / layer.scale + columsPos[s],
                layer.y / layer.scale + 10 + (i - offset) / stride * 10 + padding);
        }
    }

    if (inArr.get() === null) ctx.fillText("null", layer.x / layer.scale + 10, layer.y / layer.scale + 10 + padding);
    else if (inArr.get() === undefined) ctx.fillText("undefined", layer.x / layer.scale + 10, layer.y / layer.scale + 10 + padding);

    const gradHeight = 30;

    if (layer.scale <= 0) return;
    if (offset > 0)
    {
        const radGrad = ctx.createLinearGradient(0, layer.y / layer.scale + 5, 0, layer.y / layer.scale + gradHeight);
        radGrad.addColorStop(0, "#222");
        radGrad.addColorStop(1, "rgba(34,34,34,0.0)");
        ctx.fillStyle = radGrad;
        ctx.fillRect(layer.x / layer.scale, layer.y / layer.scale, 200000, gradHeight);
    }

    if (offset + lines * stride < arr.length)
    {
        const radGrad = ctx.createLinearGradient(0, layer.y / layer.scale + layer.height / layer.scale - gradHeight + 5, 0, layer.y / layer.scale + layer.height / layer.scale - gradHeight + gradHeight);
        radGrad.addColorStop(1, "#222");
        radGrad.addColorStop(0, "rgba(34,34,34,0.0)");
        ctx.fillStyle = radGrad;
        ctx.fillRect(layer.x / layer.scale, layer.y / layer.scale + layer.height / layer.scale - gradHeight, 200000, gradHeight);
    }

    ctx.restore();
};


};

Ops.Ui.VizArrayTable.prototype = new CABLES.Op();
CABLES.OPS["af2eeaaf-ff86-4bfb-9a27-42f05160a5d8"]={f:Ops.Ui.VizArrayTable,objName:"Ops.Ui.VizArrayTable"};




// **************************************************************
// 
// Ops.Number.TriggerOnChangeNumber
// 
// **************************************************************

Ops.Number.TriggerOnChangeNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inval = op.inFloat("Value"),
    next = op.outTrigger("Next"),
    number = op.outNumber("Number");

inval.onChange = function ()
{
    number.set(inval.get());
    next.trigger();
};


};

Ops.Number.TriggerOnChangeNumber.prototype = new CABLES.Op();
CABLES.OPS["f5c8c433-ce13-49c4-9a33-74e98f110ed0"]={f:Ops.Number.TriggerOnChangeNumber,objName:"Ops.Number.TriggerOnChangeNumber"};




// **************************************************************
// 
// Ops.Html.DivElement_v3
// 
// **************************************************************

Ops.Html.DivElement_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inText = op.inString("Text", "Hello Div"),
    inId = op.inString("Id"),
    inClass = op.inString("Class"),
    inStyle = op.inStringEditor("Style", "position:absolute;\nz-index:100;", "inline-css"),
    inInteractive = op.inValueBool("Interactive", false),
    inVisible = op.inValueBool("Visible", true),
    inBreaks = op.inValueBool("Convert Line Breaks", false),
    inPropagation = op.inValueBool("Propagate Click-Events", true),
    outElement = op.outObject("DOM Element", null, "element"),
    outHover = op.outBoolNum("Hover"),
    outClicked = op.outTrigger("Clicked");

let listenerElement = null;
let oldStr = null;
let prevDisplay = "block";
let div = null;

const canvas = op.patch.cgl.canvas.parentElement;

createElement();

inClass.onChange = updateClass;
inBreaks.onChange = inText.onChange = updateText;
inStyle.onChange = updateStyle;
inInteractive.onChange = updateInteractive;
inVisible.onChange = updateVisibility;

updateText();
updateStyle();
warning();
updateInteractive();

op.onDelete = removeElement;

outElement.onLinkChanged = updateStyle;

inInteractive.onLinkChanged =
outClicked.onLinkChanged = () =>
{
    op.setUiError("interactiveProblem", null);
    if (outClicked.isLinked() && !inInteractive.get() && !inInteractive.isLinked())
        op.setUiError("interactiveProblem", "Interactive should be activated when linking clicked port");
};

function createElement()
{
    div = op.patch.getDocument().createElement("div");
    div.dataset.op = op.id;
    div.classList.add("cablesEle");

    if (inId.get()) div.id = inId.get();

    canvas.appendChild(div);
    outElement.setRef(div);
}

function removeElement()
{
    if (div) removeClasses();
    if (div && div.parentNode) div.parentNode.removeChild(div);
    oldStr = null;
    div = null;
}

function setCSSVisible(visible)
{
    if (!visible)
    {
        div.style.visibility = "hidden";
        prevDisplay = div.style.display || "inherit";
        div.style.display = "none";
    }
    else
    {
        // prevDisplay=div.style.display||'inherit';
        if (prevDisplay == "none") prevDisplay = "inherit";
        div.style.visibility = "visible";
        div.style.display = prevDisplay;
    }
}

function updateVisibility()
{
    setCSSVisible(inVisible.get());
}

function updateText()
{
    let str = inText.get();

    if (oldStr === str) return;
    oldStr = str;

    if (str && inBreaks.get()) str = str.replace(/(?:\r\n|\r|\n)/g, "<br>");

    if (div.innerHTML != str) div.innerHTML = str;

    outElement.setRef(div);
}

// inline css inisde div
function updateStyle()
{
    if (!div) return;
    // if (inStyle.get() != div.style)
    // {
    div.setAttribute("style", inStyle.get());
    updateVisibility();
    outElement.setRef(div);
    // }

    if (!div.parentElement) canvas.appendChild(div);

    warning();
}

let oldClassesStr = "";

function removeClasses()
{
    if (!div) return;

    const classes = (inClass.get() || "").split(" ");
    for (let i = 0; i < classes.length; i++)
    {
        if (classes[i]) div.classList.remove(classes[i]);
    }
    oldClassesStr = "";
}

function updateClass()
{
    const classes = (inClass.get() || "").split(" ");
    const oldClasses = (oldClassesStr || "").split(" ");

    let found = false;

    for (let i = 0; i < oldClasses.length; i++)
    {
        if (
            oldClasses[i] &&
            classes.indexOf(oldClasses[i].trim()) == -1)
        {
            found = true;
            div.classList.remove(oldClasses[i]);
        }
    }

    for (let i = 0; i < classes.length; i++)
    {
        if (classes[i])
        {
            div.classList.add(classes[i].trim());
        }
    }

    oldClassesStr = inClass.get();
    warning();
}

function onMouseEnter(e)
{
    outHover.set(true);
}

function onMouseLeave(e)
{
    outHover.set(false);
}

function onMouseClick(e)
{
    if (!inPropagation.get())
    {
        e.stopPropagation();
    }
    outClicked.trigger();
}

function updateInteractive()
{
    op.setUiError("interactiveProblem", null);

    removeListeners();
    if (inInteractive.get()) addListeners();
}

inId.onChange = function ()
{
    div.id = inId.get();
};

function removeListeners()
{
    if (listenerElement)
    {
        listenerElement.removeEventListener("pointerdown", onMouseClick);
        listenerElement.removeEventListener("pointerleave", onMouseLeave);
        listenerElement.removeEventListener("pointerenter", onMouseEnter);
        listenerElement = null;
    }
}

function addListeners()
{
    if (listenerElement)removeListeners();

    listenerElement = div;

    if (listenerElement)
    {
        listenerElement.addEventListener("pointerdown", onMouseClick);
        listenerElement.addEventListener("pointerleave", onMouseLeave);
        listenerElement.addEventListener("pointerenter", onMouseEnter);
    }
}

op.addEventListener("onEnabledChange", function (enabled)
{
    removeElement();
    if (enabled)
    {
        createElement();
        updateStyle();
        updateClass();
        updateText();
        updateInteractive();
    }
    // if(enabled) updateVisibility();
    // else setCSSVisible(false);
});

function warning()
{
    if (inClass.get() && inStyle.get())
    {
        op.setUiError("error", "Element uses external and inline CSS", 1);
    }
    else
    {
        op.setUiError("error", null);
    }
}


};

Ops.Html.DivElement_v3.prototype = new CABLES.Op();
CABLES.OPS["d55d398c-e68e-486b-b0ce-d9c4bdf7df05"]={f:Ops.Html.DivElement_v3,objName:"Ops.Html.DivElement_v3"};




// **************************************************************
// 
// Ops.String.StringEditor
// 
// **************************************************************

Ops.String.StringEditor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    v = op.inStringEditor("value", ""),
    syntax = op.inValueSelect("Syntax", ["text", "glsl", "css", "html", "xml", "json", "javascript", "inline-css", "sql"], "text"),
    result = op.outString("Result");

syntax.onChange = updateSyntax;

function updateSyntax()
{
    let s = syntax.get();
    if (s == "javascript")s = "js";
    v.setUiAttribs({ "editorSyntax": s });
}

v.onChange = function ()
{
    result.set(v.get());
};


};

Ops.String.StringEditor.prototype = new CABLES.Op();
CABLES.OPS["6468b7c1-f63e-4db4-b809-4b203d27ead3"]={f:Ops.String.StringEditor,objName:"Ops.String.StringEditor"};




// **************************************************************
// 
// Ops.Html.CSS.CSS_v2
// 
// **************************************************************

Ops.Html.CSS.CSS_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    code = op.inStringEditor("css code"),
    inActive = op.inBool("Active", true);

code.setUiAttribs(
    {
        "editorSyntax": "css",
        "ignoreBigPort": true
    });

let styleEle = null;
const eleId = "css_" + CABLES.uuid();

code.onChange = update;
update();

inActive.onChange = () =>
{
    if (!inActive.get())styleEle.remove();
    else addElement();
};

function getCssContent()
{
    let css = code.get();
    if (css)
    {
        let patchId = null;
        if (op.storage && op.storage.blueprint && op.storage.blueprint.patchId)
        {
            patchId = op.storage.blueprint.patchId;
        }
        css = css.replace(new RegExp("{{ASSETPATH}}", "g"), op.patch.getAssetPath(patchId));
    }
    return css;
}

function update()
{
    styleEle = op.patch.getDocument().getElementById(eleId);

    if (styleEle)
    {
        styleEle.textContent = getCssContent();
    }
    else
    {
        styleEle = op.patch.getDocument().createElement("style");
        styleEle.type = "text/css";
        styleEle.id = eleId;
        styleEle.textContent = attachments.css_spinner;
        styleEle.classList.add("cablesEle");
        addElement();
    }
}

function addElement()
{
    const head = op.patch.getDocument().getElementsByTagName("body")[0];
    head.appendChild(styleEle);
}

op.onDelete = function ()
{
    styleEle = op.patch.getDocument().getElementById(eleId);
    if (styleEle)styleEle.remove();
};


};

Ops.Html.CSS.CSS_v2.prototype = new CABLES.Op();
CABLES.OPS["a56d3edd-06ad-44ed-9810-dbf714600c67"]={f:Ops.Html.CSS.CSS_v2,objName:"Ops.Html.CSS.CSS_v2"};




// **************************************************************
// 
// Ops.Html.CSS.TransformCSS3DElement
// 
// **************************************************************

Ops.Html.CSS.TransformCSS3DElement = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    cgl = op.patch.cgl,
    origins = [
	    "top-left", "top-middle", "top-right",
	    "center-left", "center-middle", "center-right",
	    "bottom-left", "bottom-middle", "bottom-right"
    ],
    trigger = op.inTrigger("trigger"),
    inElement = op.inObject("DOMElement"),
    inOrigin = op.inValueSelect("origin", origins, "center-middle"),
    next = op.outTrigger("next"),
    sCSSMatrix = mat4.create(),
    sScalingVector = vec3.create();
op.uuid = CABLES.uuid();
let oldEle = null;

let elProjection = cgl.canvas.parentElement.querySelector("[data-provide=\"css3d\"]");
if (!elProjection)
{
    elProjection = document.createElement("div");
    elProjection.dataset.op = op.id;
    elProjection.style.position = "absolute";
    elProjection.style.top = elProjection.style.left = 0;
    elProjection.style.width = elProjection.style.height = "100%";
    elProjection.dataset.provide = "css3d";
    elProjection.style.zIndex = 1000;
    elProjection.style.pointerEvents = "none";
    elProjection.style.perspectiveOrigin = "center center";
    cgl.canvas.parentElement.appendChild(elProjection);

    let style = document.createElement("style");
    style.dataset.op = op.id;
    style.type = "text/css";
    style.textContent = [
	    ".cables-loading .cables-css3dview {visibility:hidden;pointer-events:none;backface-visibility:hidden;}",
	    ".cables-css3dview {position:absolute;left:0;top:0;width:100%;height:100%;transform-style:preserve-3d;}",
        ".cables-css3dview > * {pointer-events:auto;}",
        ".cables-css3dview.origin-top-left > * {}",
        ".cables-css3dview.origin-top-middle > * {transform:translate3d(-50%,0,0);}",
        ".cables-css3dview.origin-top-right > * {transform:translate3d(-100%,0,0);}",
        ".cables-css3dview.origin-center-left > * {transform:translate3d(0,-50%,0);}",
        ".cables-css3dview.origin-center-middle > * {transform:translate3d(-50%,-50%,0);}",
        ".cables-css3dview.origin-center-right > * {transform:translate3d(-100%,-50%,0);}",
        ".cables-css3dview.origin-bottom-left > * {transform:translate3d(0,-100%,0);}",
        ".cables-css3dview.origin-bottom-middle > * {transform:translate3d(-50%,-100%,0);}",
        ".cables-css3dview.origin-bottom-right > * {transform:translate3d(-100%,-100%,0);}"
    ].join("\n");
    elProjection.appendChild(style);
}

op.onDelete = function ()
{
    let el = elProjection.querySelector("[data-ccs3did=\"" + op.uuid + "\"]");
    if (el && el.parentElement) el.parentElement.removeChild(el);
};

function wrap(el)
{
    let view = document.createElement("div");
    view.classList.add("cables-css3dview");
    view.dataset.css3did = op.uuid;
    view.appendChild(el);
    return view;
}

inElement.onChange = function (self, el)
{
    op.onDelete();
    if (!el) return;
    elProjection.appendChild(wrap(el));
    inOrigin.onChange();
};
inOrigin.onChange = function ()
{
    let el = inElement.get();
    if (!el || !el.parentElement) return;
    DOMTokenList.prototype.remove.apply(el.parentElement.classList, origins.map(function (o) { return "origin-" + o; }));
    el.parentElement.classList.add("origin-" + inOrigin.get());
};
trigger.onTriggered = function ()
{
    let pxfov = 0.5 / (1 / cgl.pMatrix[5]) * cgl.gl.drawingBufferHeight / op.patch.cgl.pixelDensity;
    elProjection.style.perspective = (pxfov) + "px";
    // elProjection.style["-webkit-perspective"] = (pxfov) + "px";

    let a = -2 * cgl.gl.drawingBufferWidth / cgl.gl.drawingBufferHeight;
    vec3.set(
        sScalingVector,
        a / cgl.gl.drawingBufferWidth * op.patch.cgl.pixelDensity,
        -2 / cgl.gl.drawingBufferHeight * op.patch.cgl.pixelDensity,
        1
    );
    let el = inElement.get();
    if (el)
    {
        mat4.multiply(
            sCSSMatrix,
            cgl.vMatrix,
            cgl.mMatrix
        );
        mat4.scale(
            sCSSMatrix,
            sCSSMatrix,
            sScalingVector
        );

        if (el.parentElement)
    		el.parentElement.style.transform = "translateZ(" + (pxfov) + "px) matrix3d(" +
    			sCSSMatrix[0] + "," +
    			-sCSSMatrix[1] + "," +
    			sCSSMatrix[2] + "," +
    			sCSSMatrix[3] + "," +

    			sCSSMatrix[4] + "," +
    			-sCSSMatrix[5] + "," +
    			sCSSMatrix[6] + "," +
    			sCSSMatrix[7] + "," +

    			sCSSMatrix[8] + "," +
    			-sCSSMatrix[9] + "," +
    			sCSSMatrix[10] + "," +
    			sCSSMatrix[11] + "," +

    			sCSSMatrix[12] + "," +
    			-sCSSMatrix[13] + "," +
    			sCSSMatrix[14] + "," +
    			sCSSMatrix[15] +
    		") scaleX(-1) translate3d(" +
    			(cgl.gl.drawingBufferWidth / 2 / op.patch.cgl.pixelDensity) + "px," +
    			(cgl.gl.drawingBufferHeight / 2 / op.patch.cgl.pixelDensity) + "px" +
    			",0" +
    		")";
    }
    next.trigger();
    oldEle = el;
};
inOrigin.onChange();

function removeProperties(el)
{
    if (!el)el = inElement.get();
    if (el && el.parentElement)el.parentElement.style.transform = "";
}

op.onDelete = function ()
{
    removeProperties(oldEle);
};

inElement.onLinkChanged = function ()
{
    if (!inElement.isLinked())
        removeProperties(oldEle);
};

op.addEventListener("onEnabledChange", function (enabled)
{
    if (!enabled) removeProperties();
});


};

Ops.Html.CSS.TransformCSS3DElement.prototype = new CABLES.Op();
CABLES.OPS["7b81ed97-6fb9-4044-a731-962a2a11db27"]={f:Ops.Html.CSS.TransformCSS3DElement,objName:"Ops.Html.CSS.TransformCSS3DElement"};




// **************************************************************
// 
// Ops.Gl.CanvasInfo_v2
// 
// **************************************************************

Ops.Gl.CanvasInfo_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    pixelRatio = op.outNumber("Pixel Ratio"),
    widthPixel = op.outNumber("Pixel Width"),
    heightPixel = op.outNumber("Pixel Height"),
    inUnit = op.inSwitch("Pixel Unit", ["Display", "CSS"], "Display"),
    aspect = op.outNumber("Aspect Ratio"),
    landscape = op.outBool("Landscape"),
    outCanvasEle = op.outObject("Canvas", "element"),
    outCanvasParentEle = op.outObject("Canvas Parent", "element");

let cgl = op.patch.cgl;
outCanvasEle.set(op.patch.cgl.canvas);
outCanvasParentEle.set(op.patch.cgl.canvas.parentElement);

cgl.on("resize", update);

inUnit.onChange = update;
update();

function update()
{
    let div = 1;
    if (inUnit.get() == "CSS")div = op.patch.cgl.pixelDensity;
    height.set(cgl.canvasHeight);
    width.set(cgl.canvasWidth);

    heightPixel.set(cgl.canvasHeight * op.patch.cgl.pixelDensity);
    widthPixel.set(cgl.canvasWidth * op.patch.cgl.pixelDensity);

    pixelRatio.set(op.patch.cgl.pixelDensity); // window.devicePixelRatio

    aspect.set(cgl.canvasWidth / cgl.canvasHeight);
    landscape.set(cgl.canvasWidth > cgl.canvasHeight ? 1 : 0);
}


};

Ops.Gl.CanvasInfo_v2.prototype = new CABLES.Op();
CABLES.OPS["a249e025-ae2c-4fb1-99f1-f86bfe7d5fc4"]={f:Ops.Gl.CanvasInfo_v2,objName:"Ops.Gl.CanvasInfo_v2"};




// **************************************************************
// 
// Ops.Math.Divide
// 
// **************************************************************

Ops.Math.Divide = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 2),
    result = op.outNumber("result");

op.setUiAttribs({ "mathTitle": true });

number1.onChange = number2.onChange = exec;
exec();

function exec()
{
    result.set(number1.get() / number2.get());
}


};

Ops.Math.Divide.prototype = new CABLES.Op();
CABLES.OPS["86fcfd8c-038d-4b91-9820-a08114f6b7eb"]={f:Ops.Math.Divide,objName:"Ops.Math.Divide"};




// **************************************************************
// 
// Ops.Html.CSS.CSSProperty_v2
// 
// **************************************************************

Ops.Html.CSS.CSSProperty_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inEle = op.inObject("Element"),
    inProperty = op.inString("Property"),
    inValue = op.inFloat("Value"),
    inValueSuffix = op.inString("Value Suffix", "px"),
    outEle = op.outObject("HTML Element", null, "element");

op.setPortGroup("Element", [inEle]);
op.setPortGroup("Attributes", [inProperty, inValue, inValueSuffix]);

inProperty.onChange = updateProperty;
inValue.onChange = update;
inValueSuffix.onChange = update;
let ele = null;

inEle.onChange = inEle.onLinkChanged = function ()
{
    if (ele && ele.style)
    {
        ele.style[inProperty.get()] = "initial";
    }
    update();
};

function updateProperty()
{
    update();
    op.setUiAttrib({ "extendTitle": inProperty.get() + "" });
}

function update()
{
    ele = inEle.get();
    if (ele && ele.style)
    {
        const str = inValue.get() + inValueSuffix.get();
        try
        {
            if (ele.style[inProperty.get()] != str)
                ele.style[inProperty.get()] = str;
        }
        catch (e)
        {
            op.logError(e);
        }
    }
    else
    {
        setTimeout(update, 50);
    }

    outEle.setRef(inEle.get());
}


};

Ops.Html.CSS.CSSProperty_v2.prototype = new CABLES.Op();
CABLES.OPS["c179aa0e-b558-4130-8c2d-2deab2919a07"]={f:Ops.Html.CSS.CSSProperty_v2,objName:"Ops.Html.CSS.CSSProperty_v2"};




// **************************************************************
// 
// Ops.Boolean.BoolToNumber_v2
// 
// **************************************************************

Ops.Boolean.BoolToNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    useValue1Port = op.inBool("Use Value 1", false),
    value0port = op.inFloat("Value 0", 0),
    value1port = op.inFloat("Value 1", 1),
    outValuePort = op.outNumber("Out Value", 0);

value0port.onChange =
    value1port.onChange =
    useValue1Port.onChange = setOutput;

function setOutput()
{
    const useValue1 = useValue1Port.get();

    if (useValue1)
    {
        outValuePort.set(value1port.get());
    }
    else
    {
        outValuePort.set(value0port.get());
    }
}


};

Ops.Boolean.BoolToNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["400eea7d-5a68-4dda-a94d-2bb2ee7c2331"]={f:Ops.Boolean.BoolToNumber_v2,objName:"Ops.Boolean.BoolToNumber_v2"};




// **************************************************************
// 
// Ops.Html.HyperLink_v2
// 
// **************************************************************

Ops.Html.HyperLink_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    exec = op.inTriggerButton("Open"),
    inUrl = op.inString("URL", "https://cables.gl"),
    inTarget = op.inString("Target Name", "_self"),
    inSpecs = op.inString("Specs", "");

exec.onTriggered = function ()
{
    // document.location.href=inUrl.get();
    window.open(inUrl.get(), inTarget.get(), inSpecs.get());
};


};

Ops.Html.HyperLink_v2.prototype = new CABLES.Op();
CABLES.OPS["a669d4f7-1e35-463c-bf8b-08c9f1b68e04"]={f:Ops.Html.HyperLink_v2,objName:"Ops.Html.HyperLink_v2"};




// **************************************************************
// 
// Ops.Array.GateArray_v2
// 
// **************************************************************

Ops.Array.GateArray_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    arrayIn = op.inArray("Array in"),
    passThrough = op.inValueBool("Pass Through", true),
    inIfNull = op.inSwitch("When False", ["keep last array", "null"], "keep last array"),
    arrayOut = op.outArray("Array Out");

let oldArr = null;

function copyArray(source)
{
    if (!source) return null;
    const dest = [];
    dest.length = source.length;
    for (let i = 0; i < source.length; i++)
        dest[i] = source[i];

    return dest;
}

inIfNull.onChange =
    arrayIn.onChange =
    passThrough.onChange =
    function ()
    {
        if (passThrough.get())
        {
            oldArr = copyArray(arrayIn.get());
            arrayOut.setRef(oldArr);
        }
        else
        {
            if (inIfNull.get() == "null") arrayOut.setRef(null);
        }
    };


};

Ops.Array.GateArray_v2.prototype = new CABLES.Op();
CABLES.OPS["e28a489c-46b6-4279-928c-6b0cbaaaae2a"]={f:Ops.Array.GateArray_v2,objName:"Ops.Array.GateArray_v2"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Denoise
// 
// **************************************************************

Ops.Gl.ImageCompose.Denoise = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"denoise_frag":"UNI sampler2D tex;\nUNI float exponent;\nUNI float strength;\nUNI vec2 texSize;\nIN vec2 texCoord;\n\nvoid main()\n{\n    vec4 center = texture(tex, texCoord);\n    vec4 color = vec4(0.0);\n    float total = 0.0;\n    const float pixels=4.0;\n    for (float x = -pixels; x <= pixels; x += 1.0) {\n        for (float y = -pixels; y <= pixels; y += 1.0) {\n            vec4 smpl = texture(tex, texCoord + vec2(x, y) / texSize);\n            float weight = 1.0 - abs(dot(smpl.rgb - center.rgb, vec3(0.25)));\n            weight = pow(weight, (1.0-exponent)*50.0);\n            color += smpl * weight;\n            total += weight;\n        }\n    }\n    outColor = color / total;\n}\n",};
let render = op.inTrigger("render");
let strength = op.inValueSlider("Exponent", 0.6);

let trigger = op.outTrigger("trigger");

let cgl = op.patch.cgl;
let shader = new CGL.Shader(cgl, op.name, op);
let tsize = [128, 128];
let srcFrag = attachments.denoise_frag;

shader.setSource(shader.getDefaultVertexShader(), srcFrag);
let textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

let strengthUniform = new CGL.Uniform(shader, "f", "exponent", strength);
let texSizeUniform = new CGL.Uniform(shader, "2f", "texSize", tsize);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    tsize[0] = cgl.currentTextureEffect.getCurrentSourceTexture().width;
    tsize[1] = cgl.currentTextureEffect.getCurrentSourceTexture().height;
    texSizeUniform.setValue(tsize);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.Denoise.prototype = new CABLES.Op();
CABLES.OPS["0abfea0f-1aa9-47bf-b540-f54f89a60a6c"]={f:Ops.Gl.ImageCompose.Denoise,objName:"Ops.Gl.ImageCompose.Denoise"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.BulgePinch
// 
// **************************************************************

Ops.Gl.ImageCompose.BulgePinch = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"bulgepinch_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\n\nUNI float radius;\nUNI float strength;\nUNI float centerX;\nUNI float centerY;\n\nvoid main()\n{\n   vec2 center=vec2(centerX,centerY);\n   vec2 coord=texCoord;\n   coord -= center;\n   float distance = length(coord);\n   float percent = distance / radius;\n   if (strength > 0.0) coord *= mix(1.0, smoothstep(0.0, radius / distance, percent), strength * 0.75);\n   else coord *= mix(1.0, pow(percent, 1.0 + strength * 0.75) * radius / distance, 1.0 - percent);\n   coord += center;\n   vec4 col=texture(tex,coord);\n   outColor= col;\n}",};
const
    render = op.inTrigger("render"),
    radius = op.inValueFloat("Radius", 0.5),
    strength = op.inValueFloat("Strength", 1),
    centerX = op.inValueFloat("Center X", 0.5),
    centerY = op.inValueFloat("Center Y", 0.5),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "bulgepinch");
shader.setSource(shader.getDefaultVertexShader(), attachments.bulgepinch_frag);

const
    uniRadius = new CGL.Uniform(shader, "f", "radius", radius),
    uniStrength = new CGL.Uniform(shader, "f", "strength", strength),
    uniCenterX = new CGL.Uniform(shader, "f", "centerX", centerX),
    uniCenterY = new CGL.Uniform(shader, "f", "centerY", centerY),
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.BulgePinch.prototype = new CABLES.Op();
CABLES.OPS["25696840-bd64-463e-9301-964a81385bfb"]={f:Ops.Gl.ImageCompose.BulgePinch,objName:"Ops.Gl.ImageCompose.BulgePinch"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Twirl_v4
// 
// **************************************************************

Ops.Gl.ImageCompose.Twirl_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"twirl_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float twistAmount;\nUNI float times;\nUNI float radius;\nUNI float centerX;\nUNI float centerY;\nUNI float aspect;\n\n{{CGL.BLENDMODES3}}\n\nvoid main()\n{\n    vec2 center=vec2(centerX,centerY);\n    center =((center+1.0)/2.0);\n    vec2 tc = texCoord;\n    tc -= center;\n\n    float dist = length(vec2(tc.x,tc.y/aspect));\n    if (dist < radius)\n    {\n        float percent = (radius - dist) / radius;\n        float theta = percent * percent * twistAmount * 8.0;\n        float s = sin(theta);\n        float c = cos(theta);\n        tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));\n    }\n    tc += center;\n\n    vec4 col = texture(tex, tc);\n    vec4 base=texture(tex,texCoord);\n    outColor=cgl_blendPixel(base,col,amount);\n}\n",};
const render = op.inTrigger("Render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    amount = op.inValueSlider("Amount", 1),
    twistAmount = op.inValue("Twist amount", 500),
    radius = op.inValue("Radius", 0.5),
    centerX = op.inValue("Center X", 0),
    centerY = op.inValue("Center Y", 0),
    trigger = op.outTrigger("Next");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name, op);

shader.setSource(shader.getDefaultVertexShader(), attachments.twirl_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount),
    uniTwistAmount = new CGL.Uniform(shader, "f", "twistAmount", 1),
    uniRadius = new CGL.Uniform(shader, "f", "radius", radius),
    uniAspect = new CGL.Uniform(shader, "f", "aspect", 1),
    unicenterX = new CGL.Uniform(shader, "f", "centerX", centerX),
    unicenterY = new CGL.Uniform(shader, "f", "centerY", centerY);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    let texture = cgl.currentTextureEffect.getCurrentSourceTexture();

    uniTwistAmount.setValue(twistAmount.get() * (1 / texture.width));
    uniAspect.setValue(cgl.currentTextureEffect.aspectRatio);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.Twirl_v4.prototype = new CABLES.Op();
CABLES.OPS["6691bf7f-602d-4a24-b648-cab4b2a2c15e"]={f:Ops.Gl.ImageCompose.Twirl_v4,objName:"Ops.Gl.ImageCompose.Twirl_v4"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Mix
// 
// **************************************************************

Ops.Gl.ImageCompose.Mix = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"mix_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI sampler2D tex1;\nUNI sampler2D tex2;\nUNI float fade;\n\nvoid main()\n{\n    vec4 col=texture(tex,texCoord);\n    vec4 col1=texture(tex1,texCoord);\n    vec4 col2=texture(tex2,texCoord);\n\n    col=mix(col1,col2,fade);\n\n    outColor= col;\n}\n",};
const
    render = op.inTrigger("Render"),
    inTex2 = op.inTexture("Texture 1"),
    inFade = op.inFloatSlider("Fade", 0),
    inTex1 = op.inTexture("Texture 2"),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name, op);

shader.setSource(shader.getDefaultVertexShader(), attachments.mix_frag);
const
    texUni = new CGL.Uniform(shader, "t", "tex1", 0),
    tex1Uni = new CGL.Uniform(shader, "t", "tex1", 1),
    tex2Uni = new CGL.Uniform(shader, "t", "tex2", 2),
    uniFade = new CGL.Uniform(shader, "f", "fade", inFade);

inTex1.onLinkChanged =
inTex2.onLinkChanged =
    updateDefines;

updateDefines();

function updateDefines()
{
    // shader.toggleDefine("MOD_MASK", inTexMask.get());

    // shader.toggleDefine("MOD_OP_SUB_CX", inOp.get() === "c-x");
    // shader.toggleDefine("MOD_OP_SUB_XC", inOp.get() === "x-c");

    // shader.toggleDefine("MOD_OP_ADD", inOp.get() === "c+x");
    // shader.toggleDefine("MOD_OP_MUL", inOp.get() === "c*x");

    // shader.toggleDefine("MOD_OP_DIV_XC", inOp.get() === "x/c");
    // shader.toggleDefine("MOD_OP_DIV_CX", inOp.get() === "c/x");

    // shader.toggleDefine("MOD_OP_MODULO", inOp.get() === "c%x");
    // shader.toggleDefine("MOD_OP_DISTANCE", inOp.get() === "dist");
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    if (inTex1.get())cgl.setTexture(1, inTex1.get().tex);
    if (inTex2.get())cgl.setTexture(2, inTex2.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.Mix.prototype = new CABLES.Op();
CABLES.OPS["dbd68d4d-60ff-427f-8a76-c931fb8bb59b"]={f:Ops.Gl.ImageCompose.Mix,objName:"Ops.Gl.ImageCompose.Mix"};




// **************************************************************
// 
// Ops.Math.MathExpression
// 
// **************************************************************

Ops.Math.MathExpression = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const inA = op.inFloat("A", 0);
const inB = op.inFloat("B", 1);
const inC = op.inFloat("C", 2);
const inD = op.inFloat("D", 3);
op.setPortGroup("Parameters", [inA, inB, inC, inD]);
const inExpression = op.inString("Expression", "a*(b+c+d)");
op.setPortGroup("Expression", [inExpression]);
const outResult = op.outNumber("Result");
const outExpressionIsValid = op.outBool("Expression Valid");

let currentFunction = inExpression.get();
let functionValid = false;

const createFunction = () =>
{
    try
    {
        currentFunction = new Function("m", "a", "b", "c", "d", `with(m) { return ${inExpression.get()} }`);
        functionValid = true;
        evaluateFunction();
        outExpressionIsValid.set(functionValid);
    }
    catch (e)
    {
        functionValid = false;
        outExpressionIsValid.set(functionValid);
        if (e instanceof ReferenceError || e instanceof SyntaxError) return;
    }
};

const evaluateFunction = () =>
{
    if (functionValid)
    {
        outResult.set(currentFunction(Math, inA.get(), inB.get(), inC.get(), inD.get()));
        if (!inExpression.get()) outResult.set(0);
    }

    outExpressionIsValid.set(functionValid);
};


inA.onChange = inB.onChange = inC.onChange = inD.onChange = evaluateFunction;
inExpression.onChange = createFunction;
createFunction();


};

Ops.Math.MathExpression.prototype = new CABLES.Op();
CABLES.OPS["d2343a1e-64ea-45b2-99ed-46e167bbdcd3"]={f:Ops.Math.MathExpression,objName:"Ops.Math.MathExpression"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Noise.GlitchNoise_v2
// 
// **************************************************************

Ops.Gl.ImageCompose.Noise.GlitchNoise_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"glitchnoise_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\n\n{{CGL.BLENDMODES3}}\n\nUNI float amount;\nUNI float time;\nUNI float frequency;\nUNI float strength;\nUNI float blockSizeA;\nUNI float blockSizeB;\nUNI float blockSizeC;\nUNI float blockSizeD;\nUNI float scrollX;\nUNI float scrollY;\n\nfloat rng2(vec2 seed)\n{\n    return fract(sin(dot(seed * floor(time * (frequency * 10.0)), vec2(127.1,311.7))) * 43758.5453123);//43758.5453123\n}\n\nfloat rng(float seed)\n{\n    return rng2(vec2(seed, 1.0));\n}\n\nvoid main( )\n{\n    //add scroll for x and y\n    vec2 scrollXY = vec2(scrollX,scrollY);\n    vec2 blockS = floor((texCoord + scrollXY ) * vec2(blockSizeA,blockSizeB));\n    vec2 blockL = floor((texCoord )  * vec2(blockSizeC,blockSizeD));\n\n    float r = rng2(texCoord);\n    vec3 noise = (vec3(r, 1. - r, r / 2. + 0.5) * 1.0 - 2.0) * 0.08;\n\n    float lineNoise = pow(rng2(blockS), 8.0) * pow(rng2(blockL), 3.0) - pow(rng(7.2341), 17.0) * 2.;\n\n    vec4 col1 = texture(tex, texCoord);\n    vec4 col2 = texture(tex, texCoord + vec2(lineNoise * (0.05 * strength)  * rng(5.0), 1));\n    vec4 col3 = texture(tex, texCoord - vec2(lineNoise * (0.05 * strength) * rng(31.0), 1));\n\n    float glitch = (lineNoise * strength * rng(5.0)) + (lineNoise * strength * rng(31.));\n    float glitch2 = lineNoise * strength * rng(31.);\n\n    //blend section\n    vec4 col=vec4(vec3(glitch),1.0);\n    //original texture\n    vec4 base=texture(tex,texCoord);\n\n    outColor=cgl_blendPixel(base,col,amount);\n\n}",};
const
    render = op.inTrigger("render"),
    amount = op.inValueSlider("Amount", 1),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    maskAlpha = CGL.TextureEffect.AddBlendAlphaMask(op),

    time = op.inValue("Seed", 0),
    inFrequency = op.inValue("frequency", 1),
    inStrength = op.inValue("strength", 8.0),
    inBlockSizeA = op.inValue("Block size small x", 24.0),
    inBlockSizeB = op.inValue("Block size small y", 9.0),
    inBlockSizeC = op.inValue("Block size large x", 8.0),
    inBlockSizeD = op.inValue("Block size large y", 4.0),
    inScrollX = op.inValue("Scroll X", 0.0),
    inScrollY = op.inValue("Scroll Y", 0.0),
    trigger = op.outTrigger("trigger");

const TEX_SLOT = 0;
const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name, op);
shader.setSource(shader.getDefaultVertexShader(), attachments.glitchnoise_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", TEX_SLOT),
    uniformAmount = new CGL.Uniform(shader, "f", "amount", amount),
    timeUniform = new CGL.Uniform(shader, "f", "time", time),
    frequencyUniform = new CGL.Uniform(shader, "f", "frequency", inFrequency),
    strengthUniform = new CGL.Uniform(shader, "f", "strength", inStrength),
    sizeAUniform = new CGL.Uniform(shader, "f", "blockSizeA", inBlockSizeA),
    sizeBUniform = new CGL.Uniform(shader, "f", "blockSizeB", inBlockSizeB),
    sizeCUniform = new CGL.Uniform(shader, "f", "blockSizeC", inBlockSizeC),
    sizeDUniform = new CGL.Uniform(shader, "f", "blockSizeD", inBlockSizeD),
    scrollXUniform = new CGL.Uniform(shader, "f", "scrollX", inScrollX),
    scrollYUniform = new CGL.Uniform(shader, "f", "scrollY", inScrollY);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount, maskAlpha);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(TEX_SLOT, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.Noise.GlitchNoise_v2.prototype = new CABLES.Op();
CABLES.OPS["87de572e-644a-4613-b0f3-68b9ec74f489"]={f:Ops.Gl.ImageCompose.Noise.GlitchNoise_v2,objName:"Ops.Gl.ImageCompose.Noise.GlitchNoise_v2"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.Twist_v3
// 
// **************************************************************

Ops.Gl.ShaderEffects.Twist_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"twist_vert":"\nfloat MOD_angle_rad = MOD_amount * 3.14159 / 180.0;\n\nfloat MOD_axis=pos.y;\n\n#ifdef MOD_AXIS_Z\n    MOD_axis=pos.z;\n#endif\n\n#ifdef MOD_AXIS_X\n    MOD_axis=pos.x;\n#endif\n\nfloat MOD_ang = (MOD_height*0.5 + MOD_axis)/MOD_height * MOD_angle_rad;\n\npos = MOD_twist(pos, MOD_ang);\n\n\nnorm = normalize(MOD_twist( vec4(norm, 1.0), MOD_ang ).xyz);\n","twist_head_vert":"vec4 MOD_twist(vec4 pos, float t)\n{\n\tfloat st = sin(t);\n\tfloat ct = cos(t);\n\tvec4 new_pos;\n\n\tnew_pos.x = pos.x;\n\tnew_pos.y = pos.y;\n\tnew_pos.z = pos.z;\n\tnew_pos.w = pos.w;\n\n    #ifdef MOD_AXIS_Z\n    \tnew_pos.x = pos.y*ct - pos.x*st;\n    \tnew_pos.y = pos.y*st + pos.x*ct;\n    #endif\n\n    #ifdef MOD_AXIS_Y\n    \tnew_pos.x = pos.x*ct - pos.z*st;\n    \tnew_pos.z = pos.x*st + pos.z*ct;\n    #endif\n\n    #ifdef MOD_AXIS_X\n    \tnew_pos.y = pos.y*ct - pos.z*st;\n    \tnew_pos.z = pos.y*st + pos.z*ct;\n    #endif\n\n\treturn( new_pos );\n}\n",};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("Trigger"),
    amount = op.inFloat("Degree", 180),
    height = op.inFloat("Height", 2),
    axis = op.inValueSelect("Axis", ["X", "Y", "Z"], "Y");

const cgl = op.patch.cgl;

axis.onChange = updateAxis;

const mod = new CGL.ShaderModifier(cgl, op.name, { "opId": op.id });
mod.addModule({
    "name": "MODULE_VERTEX_POSITION",
    "srcHeadVert": attachments.twist_head_vert,
    "srcBodyVert": attachments.twist_vert
});

updateAxis();

mod.addUniformVert("f", "MOD_amount", amount);
mod.addUniformVert("f", "MOD_height", height);

function updateAxis()
{
    mod.toggleDefine("MOD_AXIS_X", axis.get() == "X");
    mod.toggleDefine("MOD_AXIS_Y", axis.get() == "Y");
    mod.toggleDefine("MOD_AXIS_Z", axis.get() == "Z");
}

render.onTriggered = function ()
{
    if (cgl.shouldDrawHelpers(op))
    {
        CABLES.GL_MARKER.drawCube(op, 1, height.get() / 2, 1);
    }

    mod.bind();
    trigger.trigger();
    mod.unbind();
};


};

Ops.Gl.ShaderEffects.Twist_v3.prototype = new CABLES.Op();
CABLES.OPS["4635abe3-a6b1-413f-9cd1-fbf64f8c4942"]={f:Ops.Gl.ShaderEffects.Twist_v3,objName:"Ops.Gl.ShaderEffects.Twist_v3"};




// **************************************************************
// 
// Ops.Math.Interpolate
// 
// **************************************************************

Ops.Math.Interpolate = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    val1 = op.inFloat("Value 1"),
    val2 = op.inFloat("Value 2"),
    perc = op.inFloatSlider("Percentage"),
    result = op.outNumber("Result");

val1.onChange =
val2.onChange =
perc.onChange = update;

function update()
{
    result.set((val2.get() - val1.get()) * perc.get() + val1.get());
}


};

Ops.Math.Interpolate.prototype = new CABLES.Op();
CABLES.OPS["d126e2c8-221e-428f-8ff4-8b8c5f6b8905"]={f:Ops.Math.Interpolate,objName:"Ops.Math.Interpolate"};




// **************************************************************
// 
// Ops.Devices.Mouse.MouseButtons
// 
// **************************************************************

Ops.Devices.Mouse.MouseButtons = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    mouseClickLeft = op.outTrigger("Click Left"),
    mouseClickRight = op.outTrigger("Click Right"),
    mouseDoubleClick = op.outTrigger("Double Click"),
    mouseDownLeft = op.outBoolNum("Button pressed Left", false),
    mouseDownMiddle = op.outBoolNum("Button pressed Middle", false),
    mouseDownRight = op.outBoolNum("Button pressed Right", false),
    triggerMouseDownLeft = op.outTrigger("Mouse Down Left"),
    triggerMouseDownMiddle = op.outTrigger("Mouse Down Middle"),
    triggerMouseDownRight = op.outTrigger("Mouse Down Right"),
    triggerMouseUpLeft = op.outTrigger("Mouse Up Left"),
    triggerMouseUpMiddle = op.outTrigger("Mouse Up Middle"),
    triggerMouseUpRight = op.outTrigger("Mouse Up Right"),
    area = op.inValueSelect("Area", ["Canvas", "Document"], "Canvas"),
    active = op.inValueBool("Active", true);

const cgl = op.patch.cgl;
let listenerElement = null;
area.onChange = updateListeners;
op.onDelete = removeListeners;
updateListeners();

function onMouseDown(e)
{
    if (e.which == 1)
    {
        mouseDownLeft.set(true);
        triggerMouseDownLeft.trigger();
    }
    else if (e.which == 2)
    {
        mouseDownMiddle.set(true);
        triggerMouseDownMiddle.trigger();
    }
    else if (e.which == 3)
    {
        mouseDownRight.set(true);
        triggerMouseDownRight.trigger();
    }
}

function onMouseUp(e)
{
    if (e.which == 1)
    {
        mouseDownLeft.set(false);
        triggerMouseUpLeft.trigger();
    }
    else if (e.which == 2)
    {
        mouseDownMiddle.set(false);
        triggerMouseUpMiddle.trigger();
    }
    else if (e.which == 3)
    {
        mouseDownRight.set(false);
        triggerMouseUpRight.trigger();
    }
}

function onClickRight(e)
{
    mouseClickRight.trigger();
    e.preventDefault();
}

function onDoubleClick(e)
{
    mouseDoubleClick.trigger();
}

function onmouseclick(e)
{
    mouseClickLeft.trigger();
}

function ontouchstart(event)
{
    if (event.touches && event.touches.length > 0)
    {
        event.touches[0].which = 1;
        onMouseDown(event.touches[0]);
    }
}

function ontouchend(event)
{
    onMouseUp({ "which": 1 });
}

function removeListeners()
{
    if (!listenerElement) return;
    listenerElement.removeEventListener("touchend", ontouchend);
    listenerElement.removeEventListener("touchcancel", ontouchend);
    listenerElement.removeEventListener("touchstart", ontouchstart);
    listenerElement.removeEventListener("dblclick", onDoubleClick);
    listenerElement.removeEventListener("click", onmouseclick);
    listenerElement.removeEventListener("mousedown", onMouseDown);
    listenerElement.removeEventListener("mouseup", onMouseUp);
    listenerElement.removeEventListener("contextmenu", onClickRight);
    listenerElement.removeEventListener("mouseleave", onMouseUp);
    listenerElement = null;
}

function addListeners()
{
    if (listenerElement)removeListeners();

    listenerElement = cgl.canvas;
    if (area.get() == "Document") listenerElement = document.body;

    listenerElement.addEventListener("touchend", ontouchend);
    listenerElement.addEventListener("touchcancel", ontouchend);
    listenerElement.addEventListener("touchstart", ontouchstart);
    listenerElement.addEventListener("dblclick", onDoubleClick);
    listenerElement.addEventListener("click", onmouseclick);
    listenerElement.addEventListener("mousedown", onMouseDown);
    listenerElement.addEventListener("mouseup", onMouseUp);
    listenerElement.addEventListener("contextmenu", onClickRight);
    listenerElement.addEventListener("mouseleave", onMouseUp);
}

op.onLoaded = updateListeners;

active.onChange = updateListeners;

function updateListeners()
{
    removeListeners();
    if (active.get()) addListeners();
}


};

Ops.Devices.Mouse.MouseButtons.prototype = new CABLES.Op();
CABLES.OPS["c7e5e545-c8a1-4fef-85c2-45422b947f0d"]={f:Ops.Devices.Mouse.MouseButtons,objName:"Ops.Devices.Mouse.MouseButtons"};




// **************************************************************
// 
// Ops.Boolean.Or
// 
// **************************************************************

Ops.Boolean.Or = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    bool0 = op.inValueBool("bool 1"),
    bool1 = op.inValueBool("bool 2"),
    bool2 = op.inValueBool("bool 3"),
    bool3 = op.inValueBool("bool 4"),
    bool4 = op.inValueBool("bool 5"),
    bool5 = op.inValueBool("bool 6"),
    bool6 = op.inValueBool("bool 7"),
    bool7 = op.inValueBool("bool 8"),
    bool8 = op.inValueBool("bool 9"),
    bool9 = op.inValueBool("bool 10"),
    result = op.outBoolNum("result");

bool0.onChange =
    bool1.onChange =
    bool2.onChange =
    bool3.onChange =
    bool4.onChange =
    bool5.onChange =
    bool6.onChange =
    bool7.onChange =
    bool8.onChange =
    bool9.onChange = exec;

function exec()
{
    result.set(bool0.get() || bool1.get() || bool2.get() || bool3.get() || bool4.get() || bool5.get() || bool6.get() || bool7.get() || bool8.get() || bool9.get());
}


};

Ops.Boolean.Or.prototype = new CABLES.Op();
CABLES.OPS["b3b36238-4592-4e11-afe3-8361c4fd6be5"]={f:Ops.Boolean.Or,objName:"Ops.Boolean.Or"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.BrightnessContrast
// 
// **************************************************************

Ops.Gl.ImageCompose.BrightnessContrast = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"brightness_contrast_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float amountbright;\n\nvoid main()\n{\n    vec4 col=vec4(1.0,0.0,0.0,1.0);\n    col=texture(tex,texCoord);\n\n    // apply contrast\n    col.rgb = ((col.rgb - 0.5) * max(amount*2.0, 0.0))+0.5;\n\n    // apply brightness\n    col.rgb *= amountbright*2.0;\n\n    outColor = col;\n}",};
const
    render = op.inTrigger("render"),
    amount = op.inValueSlider("contrast", 0.5),
    amountBright = op.inValueSlider("brightness", 0.5),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;

const shader = new CGL.Shader(cgl, "brightnesscontrast");
shader.setSource(shader.getDefaultVertexShader(), attachments.brightness_contrast_frag);
const textureUniform = new CGL.Uniform(shader, "t", "tex", 0);
const amountUniform = new CGL.Uniform(shader, "f", "amount", amount);
const amountBrightUniform = new CGL.Uniform(shader, "f", "amountbright", amountBright);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    if (!cgl.currentTextureEffect.getCurrentSourceTexture()) return;
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.BrightnessContrast.prototype = new CABLES.Op();
CABLES.OPS["54b89199-c594-4dff-bc48-82d6c7a55e8a"]={f:Ops.Gl.ImageCompose.BrightnessContrast,objName:"Ops.Gl.ImageCompose.BrightnessContrast"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.ColorBalance_v2
// 
// **************************************************************

Ops.Gl.ImageCompose.ColorBalance_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"colorbalance_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float r;\nUNI float g;\nUNI float b;\n\nfloat lumi(vec3 color)\n{\n    return vec3(dot(vec3(0.2126,0.7152,0.0722), color)).r;\n}\n\nvoid main()\n{\n    vec4 base=texture(tex,texCoord);\n    float l=lumi(base.rgb);\n\n    #ifdef TONE_MID\n        l=smoothstep(0.33,0.66,l);\n    #endif\n\n    #ifdef TONE_LOW\n        l=1.0-l;\n    #endif\n\n    l=l*l;\n    vec3 color=base.rgb+vec3(l*r*0.1,l*g*0.1,l*b*0.1);\n    outColor= vec4(color,base.a);\n}\n",};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    tone = op.inValueSelect("Tone", ["Highlights", "Midtones", "Shadows"], "Highlights"),
    r = op.inValue("r"),
    g = op.inValue("g"),
    b = op.inValue("b");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name, op);

shader.setSource(shader.getDefaultVertexShader(), attachments.colorbalance_frag);
const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    uniR = new CGL.Uniform(shader, "f", "r", r),
    uniG = new CGL.Uniform(shader, "f", "g", g),
    uniB = new CGL.Uniform(shader, "f", "b", b);

tone.onChange = function ()
{
    shader.toggleDefine("TONE_HIGH", tone.get() == "Highlights");
    shader.toggleDefine("TONE_MID", tone.get() == "Midtones");
    shader.toggleDefine("TONE_LOW", tone.get() == "Shadows");
};

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.ColorBalance_v2.prototype = new CABLES.Op();
CABLES.OPS["5af81475-2aa6-451b-a1f3-0980f641a72e"]={f:Ops.Gl.ImageCompose.ColorBalance_v2,objName:"Ops.Gl.ImageCompose.ColorBalance_v2"};




// **************************************************************
// 
// Ops.Gl.FontMSDF_v2
// 
// **************************************************************

Ops.Gl.FontMSDF_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
let defaultTexUrl = null;
let defaultDataUrl = null;

if (CABLES.UI)
{
    defaultTexUrl = "/assets/library/fonts_msdf/worksans-regular_int.png";
    defaultDataUrl = "/assets/library/fonts_msdf/worksans-regular_int.json";
}

const
    inUUID = op.inString("Font Name", CABLES.uuid()),
    urlData = op.inUrl("Font Data", [".json"], defaultDataUrl),
    urlTex = op.inUrl("Font Image", [".png"], defaultTexUrl),
    urlTex1 = op.inUrl("Font Image 1", [".png"]),
    urlTex2 = op.inUrl("Font Image 2", [".png"]),
    urlTex3 = op.inUrl("Font Image 3", [".png"]),
    outLoaded = op.outBool("Loaded"),
    outNumChars = op.outNumber("Total Chars"),
    outChars = op.outString("Chars"),
    cgl = op.patch.cgl;

let
    loadedData = false,
    loadedTex = false,
    loadingId = 0;

inUUID.onChange =
urlData.onChange =
    urlTex.onChange =
    urlTex1.onChange =
    urlTex2.onChange =
    urlTex3.onChange = loadLater;

const textures = [];

function updateLoaded()
{
    const l = loadedData && loadedTex;
    if (!outLoaded.get() && l) op.patch.emitEvent("FontLoadedMSDF");
    outLoaded.set(l);
}

op.onFileChanged = function (fn)
{
    if (
        (urlTex.get() && urlTex.get().indexOf(fn) > -1) ||
        (urlTex1.get() && urlTex1.get().indexOf(fn) > -1) ||
        (urlTex2.get() && urlTex2.get().indexOf(fn) > -1) ||
        (urlTex3.get() && urlTex3.get().indexOf(fn) > -1))
    {
        loadLater();
    }
};

function loadLater()
{
    cgl.addNextFrameOnceCallback(load);
}

let oldUUID = "";

function load()
{
    if (!urlData.get() || !urlTex.get()) return;

    textures.length = 0;
    op.patch.deleteVar("font_data_" + oldUUID);
    op.patch.deleteVar("font_tex_" + oldUUID);
    oldUUID = inUUID.get();

    const varNameData = "font_data_" + inUUID.get();
    const varNameTex = "font_tex_" + inUUID.get();

    op.patch.setVarValue(varNameData, {});
    op.patch.setVarValue(varNameTex, textures);

    op.patch.getVar(varNameData).type = "fontData";
    op.patch.getVar(varNameTex).type = "fontTexture";

    loadedData = loadedTex = false;
    updateLoaded();

    op.patch.loading.finished(loadingId);
    loadingId = op.patch.loading.start("jsonFile", "" + urlData.get(), op);

    op.setUiError("invaliddata", null);
    op.setUiError("jsonerr", null);
    op.setUiError("texurlerror", null);

    const urlDatastr = op.patch.getFilePath(String(urlData.get()));

    // load font data json
    cgl.patch.loading.addAssetLoadingTask(() =>
    {
        CABLES.ajax(urlDatastr, (err, _data, xhr) =>
        {
            if (err)
            {
                // op.logError(err);
                return;
            }
            try
            {
                let data = _data;
                if (typeof data === "string") data = JSON.parse(_data);
                if (!data.chars || !data.info || !data.info.face)
                {
                    op.setUiError("invaliddata", "data file is invalid");
                    return;
                }

                outNumChars.set(data.chars.length);
                let allChars = "";
                for (let i = 0; i < data.chars.length; i++)allChars += data.chars[i].char;
                outChars.set(allChars);

                op.setUiAttrib({ "extendTitle": data.info.face });
                op.patch.setVarValue(varNameData, null);
                op.patch.setVarValue(varNameData,
                    {
                        "name": CABLES.basename(urlData.get()),
                        "basename": inUUID.get(),
                        "data": data
                    });

                op.patch.loading.finished(loadingId);
                loadedData = true;
                updateLoaded();
            }
            catch (e)
            {
                op.patch.setVarValue(varNameData, null);
                op.patch.setVarValue(varNameTex, null);

                // op.logError(e);
                op.setUiError("jsonerr", "Problem while loading json:<br/>" + e);
                op.patch.loading.finished(loadingId);
                updateLoaded();
                outLoaded.set(false);
            }
        });
    });

    // load font texture

    for (let i = 0; i < 4; i++)
    {
        const num = i;

        let texPort = urlTex;
        if (i == 1)texPort = urlTex1;
        if (i == 2)texPort = urlTex2;
        if (i == 3)texPort = urlTex3;

        if (!texPort.get()) continue;

        const loadingIdTex = cgl.patch.loading.start(op.objName, texPort.get(), op);
        const urlTexstr = op.patch.getFilePath(String(texPort.get()));

        CGL.Texture.load(cgl, urlTexstr, function (err, tex)
        {
            if (err)
            {
                op.setUiError("texurlerror", "could not load texture");
                cgl.patch.loading.finished(loadingIdTex);
                loadedTex = false;
                return;
            }
            textures[num] = tex;
            op.patch.setVarValue(varNameTex, null);
            op.patch.setVarValue(varNameTex, textures);

            loadedTex = true;
            cgl.patch.loading.finished(loadingIdTex);
            updateLoaded();
        }, {
            "filter": CGL.Texture.FILTER_LINEAR,
            "flip": false
        });
    }
}


};

Ops.Gl.FontMSDF_v2.prototype = new CABLES.Op();
CABLES.OPS["6cbd5d67-25d5-4936-a2ad-3ee8ed478570"]={f:Ops.Gl.FontMSDF_v2,objName:"Ops.Gl.FontMSDF_v2"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.ZoomBlur_v2
// 
// **************************************************************

Ops.Gl.ImageCompose.ZoomBlur_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"zoomblur_frag":"UNI sampler2D tex;\nUNI float x;\nUNI float y;\nUNI float strength;\nIN vec2 texCoord;\n\n#ifdef HAS_MASK\n    UNI sampler2D texMask;\n#endif\n\nfloat random(vec3 scale, float seed)\n{\n    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n}\n\n#ifdef MASK_SRC_LUM\n    {{CGL.LUMINANCE}}\n#endif\n\nvoid main()\n{\n    float total = 0.0;\n    vec4 color = vec4(0.0);\n    vec2 center=vec2(x,y);\n    center=(center/2.0)+0.5;\n\n    vec2 texSize=vec2(1.0,1.0);\n    vec2 toCenter = center - texCoord * texSize;\n\n    /* randomize the lookup values to hide the fixed number of samples */\n    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n    float am = strength;\n\n    #ifdef HAS_MASK\n\n        float mul=1.0;\n        #ifdef MASK_SRC_R\n            mul=texture(texMask,texCoord).r;\n        #endif\n        #ifdef MASK_SRC_G\n            mul=texture(texMask,texCoord).g;\n        #endif\n        #ifdef MASK_SRC_B\n            mul=texture(texMask,texCoord).b;\n        #endif\n        #ifdef MASK_SRC_A\n            mul=texture(texMask,texCoord).a;\n        #endif\n        #ifdef MASK_SRC_LUM\n            mul=cgl_luminance(texture(texMask,texCoord).rgb);\n        #endif\n\n        #ifdef MASK_INV\n            mul=1.0-mul;\n        #endif\n\n        am=am*mul;\n\n        // if(am<=0.0)\n        // {\n        //     outColor=texture(tex, texCoord);\n        //     return;\n        // }\n    #endif\n\n    for (float t = 0.0; t <= NUM_SAMPLES; t++)\n    {\n        float percent = (t + offset) / NUM_SAMPLES;\n        float weight = 4.0 * (percent - percent * percent);\n        vec4 smpl = texture(tex, texCoord + toCenter * percent * am / texSize);\n\n        smpl.rgb *= smpl.a;\n\n        color += smpl * weight;\n        total += weight;\n    }\n\n    outColor = color / total;\n}",};
const
    render = op.inTrigger("render"),
    strength = op.inValueSlider("Strength", 0.5),
    inNumSamples = op.inInt("Samples", 40),
    x = op.inValue("X", 0),
    y = op.inValue("Y", 0),
    inMaskTex = op.inTexture("Strength Map"),
    inMaskSource = op.inSwitch("Source Strength Map", ["R", "G", "B", "A", "Lum"], "R"),
    inMaskInv = op.inBool("Invert Strength Map", false),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Strengh Map", [inMaskTex, inMaskSource, inMaskInv]);

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "zoomblur");

shader.setSource(shader.getDefaultVertexShader(), attachments.zoomblur_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    textureMask = new CGL.Uniform(shader, "t", "texMask", 1),
    uniX = new CGL.Uniform(shader, "f", "x", x),
    uniY = new CGL.Uniform(shader, "f", "y", y),
    strengthUniform = new CGL.Uniform(shader, "f", "strength", strength);

inNumSamples.onChange =
inMaskSource.onChange =
    inMaskInv.onChange =
    inMaskTex.onChange = updateDefines;

updateDefines();

function updateDefines()
{
    shader.toggleDefine("HAS_MASK", inMaskTex.isLinked());

    shader.toggleDefine("MASK_SRC_R", inMaskSource.get() == "R");
    shader.toggleDefine("MASK_SRC_G", inMaskSource.get() == "G");
    shader.toggleDefine("MASK_SRC_B", inMaskSource.get() == "B");
    shader.toggleDefine("MASK_SRC_A", inMaskSource.get() == "A");
    shader.toggleDefine("MASK_SRC_LUM", inMaskSource.get() == "Lum");

    shader.toggleDefine("MASK_INV", inMaskInv.get());

    shader.define("NUM_SAMPLES", inNumSamples.get() + ".0");

    inMaskSource.setUiAttribs({ "greyout": !inMaskTex.isLinked() });
    inMaskInv.setUiAttribs({ "greyout": !inMaskTex.isLinked() });
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    if (strength.get() > 0)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

        if (inMaskTex.get() && inMaskTex.get().tex) cgl.setTexture(1, inMaskTex.get().tex);

        cgl.currentTextureEffect.finish();
        cgl.popShader();
    }
    trigger.trigger();
};


};

Ops.Gl.ImageCompose.ZoomBlur_v2.prototype = new CABLES.Op();
CABLES.OPS["b720a2f5-5501-48ef-90de-94a280ba6fbd"]={f:Ops.Gl.ImageCompose.ZoomBlur_v2,objName:"Ops.Gl.ImageCompose.ZoomBlur_v2"};




// **************************************************************
// 
// Ops.Anim.LFO_v2
// 
// **************************************************************

Ops.Anim.LFO_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    time = op.inValue("Time"),
    speed = op.inFloat("Frequency", 1),
    type = op.inValueSelect("Type", ["sine", "triangle", "ramp up", "ramp down", "square"], "sine"),
    phase = op.inValue("Phase", 0),
    rangeMin = op.inValue("Range Min", -1),
    rangeMax = op.inValue("Range Max", 1),
    result = op.outNumber("Result");

let v = 0;
type.onChange = updateType;

updateType();

const PI2 = Math.PI / 2;

function updateType()
{
    if (type.get() == "sine") time.onChange = sine;
    if (type.get() == "ramp up") time.onChange = rampUp;
    if (type.get() == "ramp down") time.onChange = rampDown;
    if (type.get() == "square") time.onChange = square;
    if (type.get() == "triangle") time.onChange = triangle;
}

function updateTime()
{
    return (time.get() * speed.get()) + phase.get();
}

function square()
{
    let t = updateTime() + 0.5;
    v = t % 2.0;
    if (v <= 1.0)v = -1;
    else v = 1;
    v = CABLES.map(v, -1, 1, rangeMin.get(), rangeMax.get());
    result.set(v);
}

function rampUp()
{
    let t = (updateTime() + 1);
    t *= 0.5;
    v = t % 1.0;
    v -= 0.5;
    v *= 2.0;
    v = CABLES.map(v, -1, 1, rangeMin.get(), rangeMax.get());
    result.set(v);
}

function rampDown()
{
    let t = updateTime();
    v = t % 1.0;
    v -= 0.5;
    v *= -2.0;
    v = CABLES.map(v, -1, 1, rangeMin.get(), rangeMax.get());
    result.set(v);
}

function triangle()
{
    let t = updateTime();
    v = t % 2.0;
    if (v > 1) v = 2.0 - v;
    v -= 0.5;
    v *= 2.0;
    v = CABLES.map(v, -1, 1, rangeMin.get(), rangeMax.get());
    result.set(v);
}

function sine()
{
    let t = updateTime() * Math.PI - (PI2);
    v = Math.sin((t));
    v = CABLES.map(v, -1, 1, rangeMin.get(), rangeMax.get());
    result.set(v);
}


};

Ops.Anim.LFO_v2.prototype = new CABLES.Op();
CABLES.OPS["621f3334-f428-4310-b0da-66eb8259df33"]={f:Ops.Anim.LFO_v2,objName:"Ops.Anim.LFO_v2"};




// **************************************************************
// 
// Ops.Anim.Timer_v2
// 
// **************************************************************

Ops.Anim.Timer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inSpeed = op.inValue("Speed", 1),
    playPause = op.inValueBool("Play", true),
    reset = op.inTriggerButton("Reset"),
    inSyncTimeline = op.inValueBool("Sync to timeline", false),
    outTime = op.outNumber("Time");

op.setPortGroup("Controls", [playPause, reset, inSpeed]);

const timer = new CABLES.Timer();
let lastTime = null;
let time = 0;
let syncTimeline = false;

playPause.onChange = setState;
setState();

function setState()
{
    if (playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered = doReset;

function doReset()
{
    time = 0;
    lastTime = null;
    timer.setTime(0);
    outTime.set(0);
}

inSyncTimeline.onChange = function ()
{
    syncTimeline = inSyncTimeline.get();
    playPause.setUiAttribs({ "greyout": syncTimeline });
    reset.setUiAttribs({ "greyout": syncTimeline });
};

op.onAnimFrame = function (tt, frameNum, deltaMs)
{
    if (timer.isPlaying())
    {
        if (CABLES.overwriteTime !== undefined)
        {
            outTime.set(CABLES.overwriteTime * inSpeed.get());
        }
        else

        if (syncTimeline)
        {
            outTime.set(tt * inSpeed.get());
        }
        else
        {
            timer.update();

            const timerVal = timer.get();

            if (lastTime === null)
            {
                lastTime = timerVal;
                return;
            }

            const t = Math.abs(timerVal - lastTime);
            lastTime = timerVal;

            time += t * inSpeed.get();
            if (time != time)time = 0;
            outTime.set(time);
        }
    }
};


};

Ops.Anim.Timer_v2.prototype = new CABLES.Op();
CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer_v2,objName:"Ops.Anim.Timer_v2"};




// **************************************************************
// 
// Ops.Vars.VarGetString
// 
// **************************************************************

Ops.Vars.VarGetString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
var val=op.outString("Value");
op.varName=op.inValueSelect("Variable",[],"",true);

new CABLES.VarGetOpWrapper(op,"string",op.varName,val);


};

Ops.Vars.VarGetString.prototype = new CABLES.Op();
CABLES.OPS["3ad08cfc-bce6-4175-9746-fef2817a3b12"]={f:Ops.Vars.VarGetString,objName:"Ops.Vars.VarGetString"};




// **************************************************************
// 
// Ops.String.StringContains_v2
// 
// **************************************************************

Ops.String.StringContains_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inStr = op.inString("String"),
    inValue = op.inString("SearchValue"),
    outFound = op.outBoolNum("Found", false),
    outIndex = op.outNumber("Index", -1);

inValue.onChange =
    inStr.onChange = exec;

exec();

function exec()
{
    if (inStr.get() && inValue.get() && inValue.get().length > 0)
    {
        const index = inStr.get().indexOf(inValue.get());
        outIndex.set(index);
        outFound.set(index > -1);
    }
    else
    {
        outIndex.set(-1);
        outFound.set(false);
    }
}


};

Ops.String.StringContains_v2.prototype = new CABLES.Op();
CABLES.OPS["2ca3e5d7-e6b4-46a7-8381-3fe1ad8b6879"]={f:Ops.String.StringContains_v2,objName:"Ops.String.StringContains_v2"};




// **************************************************************
// 
// Ops.Boolean.And
// 
// **************************************************************

Ops.Boolean.And = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    bool0 = op.inValueBool("bool 1"),
    bool1 = op.inValueBool("bool 2"),
    result = op.outBoolNum("result");

bool0.onChange =
bool1.onChange = exec;

function exec()
{
    result.set(bool1.get() && bool0.get());
}


};

Ops.Boolean.And.prototype = new CABLES.Op();
CABLES.OPS["c26e6ce0-8047-44bb-9bc8-5a4f911ed8ad"]={f:Ops.Boolean.And,objName:"Ops.Boolean.And"};




// **************************************************************
// 
// Ops.Gl.Meshes.Triangle_v2
// 
// **************************************************************

Ops.Gl.Meshes.Triangle_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    sizeW = op.inValueFloat("width", 1),
    sizeH = op.inValueFloat("height", 1),
    draw = op.inValueBool("Draw", true),
    geom = new CGL.Geometry("triangle"),
    geomOut = op.outObject("geometry");

geomOut.ignoreValueSerialize = true;

op.toWorkPortsNeedToBeLinked(render);
op.setPortGroup("Size", [sizeW, sizeH]);

const cgl = op.patch.cgl;
let mesh = null;
sizeW.onChange = sizeH.onChange = () => { mesh = null; };

render.onLinkChanged = () =>
{
    if (!render.isLinked()) geomOut.set(null);
    else create();
};

render.onTriggered = function ()
{
    if (!mesh)create();
    if (draw.get() && mesh)mesh.render(cgl.getShader());
    trigger.trigger();
};

function create()
{
    geom.vertices = [
        0.0, sizeH.get(), 0.0,
        -sizeW.get(), -sizeH.get(), 0.0,
        sizeW.get(), -sizeH.get(), 0.0
    ];

    geom.vertexNormals = [
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0
    ];
    geom.tangents = [
        1, 0, 0,
        1, 0, 0,
        1, 0, 0
    ];
    geom.biTangents = [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
    ];

    geom.texCoords = [
        0.5, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];

    geom.verticesIndices = [
        0, 1, 2
    ];

    mesh = new CGL.Mesh(cgl, geom);
    geomOut.setRef(geom);
}


};

Ops.Gl.Meshes.Triangle_v2.prototype = new CABLES.Op();
CABLES.OPS["ef522d4a-9712-4063-8a99-c6b409f26456"]={f:Ops.Gl.Meshes.Triangle_v2,objName:"Ops.Gl.Meshes.Triangle_v2"};




// **************************************************************
// 
// Ops.Anim.Smooth
// 
// **************************************************************

Ops.Anim.Smooth = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    exec = op.inTrigger("Update"),
    inMode = op.inBool("Separate inc/dec", false),
    inVal = op.inValue("Value"),
    next = op.outTrigger("Next"),
    inDivisorUp = op.inValue("Inc factor", 4),
    inDivisorDown = op.inValue("Dec factor", 4),
    result = op.outNumber("Result", 0);

let val = 0;
let goal = 0;
let oldVal = 0;
let lastTrigger = 0;

op.toWorkPortsNeedToBeLinked(exec);

let divisorUp;
let divisorDown;
let divisor = 4;
let finished = true;

let selectIndex = 0;
const MODE_SINGLE = 0;
const MODE_UP_DOWN = 1;

onFilterChange();
getDivisors();

inMode.setUiAttribs({ "hidePort": true });

inDivisorUp.onChange = inDivisorDown.onChange = getDivisors;
inMode.onChange = onFilterChange;
update();

function onFilterChange()
{
    const selectedMode = inMode.get();
    if (!selectedMode) selectIndex = MODE_SINGLE;
    else selectIndex = MODE_UP_DOWN;

    if (selectIndex == MODE_SINGLE)
    {
        inDivisorDown.setUiAttribs({ "greyout": true });
        inDivisorUp.setUiAttribs({ "title": "Inc/Dec factor" });
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        inDivisorDown.setUiAttribs({ "greyout": false });
        inDivisorUp.setUiAttribs({ "title": "Inc factor" });
    }

    getDivisors();
    update();
}

function getDivisors()
{
    if (selectIndex == MODE_SINGLE)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorUp.get();
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorDown.get();
    }

    if (divisorUp <= 0.2 || divisorUp != divisorUp)divisorUp = 0.2;
    if (divisorDown <= 0.2 || divisorDown != divisorDown)divisorDown = 0.2;
}

inVal.onChange = function ()
{
    finished = false;
    let oldGoal = goal;
    goal = inVal.get();
};

inDivisorUp.onChange = function ()
{
    getDivisors();
};

function update()
{
    let tm = 1;
    if (performance.now() - lastTrigger > 500 || lastTrigger === 0) val = inVal.get() || 0;
    else tm = (performance.now() - lastTrigger) / (performance.now() - lastTrigger);
    lastTrigger = performance.now();

    if (val != val)val = 0;

    if (divisor <= 0)divisor = 0.0001;

    const diff = goal - val;

    if (diff >= 0) val += (diff) / (divisorDown * tm);
    else val += (diff) / (divisorUp * tm);

    if (Math.abs(diff) < 0.00001)val = goal;

    if (divisor != divisor)val = 0;
    if (val != val || val == -Infinity || val == Infinity)val = inVal.get();

    if (oldVal != val)
    {
        result.set(val);
        oldVal = val;
    }

    if (val == goal && !finished)
    {
        finished = true;
        result.set(val);
    }

    next.trigger();
}

exec.onTriggered = function ()
{
    update();
};


};

Ops.Anim.Smooth.prototype = new CABLES.Op();
CABLES.OPS["5677b5b5-753a-4fbf-9e91-64c81ec68a2f"]={f:Ops.Anim.Smooth,objName:"Ops.Anim.Smooth"};




// **************************************************************
// 
// Ops.Gl.Meshes.LinesArray
// 
// **************************************************************

Ops.Gl.Meshes.LinesArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    width = op.inValueFloat("width", 10),
    height = op.inValueFloat("height", 1),
    doLog = op.inValueBool("Logarithmic", false),
    pivotX = op.inValueSelect("pivot x", ["center", "left", "right"], "center"),
    pivotY = op.inValueSelect("pivot y", ["center", "top", "bottom"], "center"),
    nColumns = op.inValueInt("num columns", 10),
    nRows = op.inValueInt("num rows", 10),
    axis = op.inValueSelect("axis", ["xy", "xz"], "xy"),
    trigger = op.outTrigger("trigger"),
    outPointArrays = op.outArray("Point Arrays");

const cgl = op.patch.cgl;
let meshes = [];

op.setPortGroup("Size", [width, height]);
op.setPortGroup("Alignment", [pivotX, pivotY]);

axis.onChange =
    pivotX.onChange =
    pivotY.onChange =
    width.onChange =
    height.onChange =
    nRows.onChange =
    nColumns.onChange =
    doLog.onChange = rebuildDelayed;

rebuild();

render.onTriggered = function ()
{
    for (let i = 0; i < meshes.length; i++) meshes[i].render(cgl.getShader());
    trigger.trigger();
};

let delayRebuild = 0;
function rebuildDelayed()
{
    clearTimeout(delayRebuild);
    delayRebuild = setTimeout(rebuild, 60);
}

function rebuild()
{
    let x = 0;
    let y = 0;

    if (pivotX.get() == "center") x = 0;
    if (pivotX.get() == "right") x = -width.get() / 2;
    if (pivotX.get() == "left") x = +width.get() / 2;

    if (pivotY.get() == "center") y = 0;
    if (pivotY.get() == "top") y = -height.get() / 2;
    if (pivotY.get() == "bottom") y = +height.get() / 2;

    let numRows = parseInt(nRows.get(), 10);
    let numColumns = parseInt(nColumns.get(), 10);

    let stepColumn = width.get() / numColumns;
    let stepRow = height.get() / numRows;

    let c, r;
    meshes.length = 0;

    let vx, vy, vz;
    let verts = [];
    let tc = [];
    let indices = [];
    let count = 0;

    function addMesh()
    {
        let geom = new CGL.Geometry(op.name);
        geom.vertices = verts;
        geom.texCoords = tc;
        geom.verticesIndices = indices;

        let mesh = new CGL.Mesh(cgl, geom, { "glPrimitive": cgl.gl.LINES });
        mesh.setGeom(geom);
        meshes.push(mesh);

        verts.length = 0;
        tc.length = 0;
        indices.length = 0;
        count = 0;
        lvx = null;
    }

    let min = Math.log(1 / numRows);
    let max = Math.log(1);
    // op.log(min,max);

    let lines = [];

    for (r = numRows; r >= 0; r--)
    {
        // op.log(r/numRows);
        var lvx = null, lvy = null, lvz = null;
        let ltx = null, lty = null;
        let log = 0;
        let doLoga = doLog.get();

        let linePoints = [];
        lines.push(linePoints);


        for (c = numColumns; c >= 0; c--)
        {
            vx = c * stepColumn - width.get() / 2 + x;
            if (doLoga)
                vy = (Math.log((r / numRows)) / min) * height.get() - height.get() / 2 + y;
            else
                vy = r * stepRow - height.get() / 2 + y;

            let tx = c / numColumns;
            let ty = 1.0 - r / numRows;
            if (doLoga) ty = (Math.log((r / numRows)) / min);

            vz = 0.0;

            if (axis.get() == "xz")
            {
                vz = vy;
                vy = 0.0;
            }
            if (axis.get() == "xy") vz = 0.0;

            if (lvx !== null)
            {
                verts.push(lvx);
                verts.push(lvy);
                verts.push(lvz);

                linePoints.push(lvx, lvy, lvz);

                verts.push(vx);
                verts.push(vy);
                verts.push(vz);

                tc.push(ltx);
                tc.push(lty);

                tc.push(tx);
                tc.push(ty);

                indices.push(count);
                count++;
                indices.push(count);
                count++;
            }

            if (count > 64000)
            {
                addMesh();
            }

            ltx = tx;
            lty = ty;

            lvx = vx;
            lvy = vy;
            lvz = vz;
        }
    }

    outPointArrays.set(lines);

    addMesh();

    // op.log(meshes.length,' meshes');
}


};

Ops.Gl.Meshes.LinesArray.prototype = new CABLES.Op();
CABLES.OPS["a75265c2-957b-4719-9d03-7bbf00ace364"]={f:Ops.Gl.Meshes.LinesArray,objName:"Ops.Gl.Meshes.LinesArray"};




// **************************************************************
// 
// Ops.String.ParseInt_v2
// 
// **************************************************************

Ops.String.ParseInt_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    str = op.inString("String", 5711),
    outNum = op.outNumber("Number");

str.onChange = function ()
{
    let num = parseInt(str.get());
    if (num != num) num = 0;
    outNum.set(num);
};


};

Ops.String.ParseInt_v2.prototype = new CABLES.Op();
CABLES.OPS["6d208424-daf2-4a2b-874f-daac406c1f66"]={f:Ops.String.ParseInt_v2,objName:"Ops.String.ParseInt_v2"};




// **************************************************************
// 
// Ops.String.StringReplace
// 
// **************************************************************

Ops.String.StringReplace = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inStr = op.inString("String"),
    inSearch = op.inString("Search For", "foo"),
    inRepl = op.inString("Replace", "bar"),
    inWhat = op.inSwitch("Replace What", ["All", "First"], "All"),
    outStr = op.outString("Result");

inRepl.onChange =
inStr.onChange =
inWhat.onChange =
inSearch.onChange = update;

function update()
{
    op.setUiError("exception", null);

    let str = "";
    try
    {
        if (inWhat.get() == "All") str = String(inStr.get()).replace(new RegExp(inSearch.get(), "g"), inRepl.get());
        else str = String(inStr.get()).replace(inSearch.get(), inRepl.get());
    }
    catch (e)
    {
        op.setUiError("exception", "exception " + e.message);
    }

    outStr.set(str);
}


};

Ops.String.StringReplace.prototype = new CABLES.Op();
CABLES.OPS["4a053e7a-6b00-4e71-bd51-90cdb190994c"]={f:Ops.String.StringReplace,objName:"Ops.String.StringReplace"};




// **************************************************************
// 
// Ops.Math.Compare.GreaterThan
// 
// **************************************************************

Ops.Math.Compare.GreaterThan = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValueFloat("number1"),
    number2 = op.inValueFloat("number2"),
    result = op.outBoolNum("result");

op.setUiAttribs({ "mathTitle": true });

number1.onChange = number2.onChange = exec;

function exec()
{
    result.set(number1.get() > number2.get());
}


};

Ops.Math.Compare.GreaterThan.prototype = new CABLES.Op();
CABLES.OPS["b250d606-f7f8-44d3-b099-c29efff2608a"]={f:Ops.Math.Compare.GreaterThan,objName:"Ops.Math.Compare.GreaterThan"};




// **************************************************************
// 
// Ops.Number.GateNumber
// 
// **************************************************************

Ops.Number.GateNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    valueInPort = op.inValue("Value In", 0),
    passThroughPort = op.inValueBool("Pass Through"),
    inIfNot = op.inSwitch("When False", ["keep last number", "custom"], "keep last number"),
    inCustomNot = op.inFloat("Custom Value", 0),
    valueOutPort = op.outNumber("Value Out");

valueInPort.onChange = update;
passThroughPort.onChange = update;

valueInPort.changeAlways =
    valueOutPort.changeAlways = true;

inIfNot.onChange = updateUi;

function updateUi()
{
    inCustomNot.setUiAttribs({ "greyout": inIfNot.get() != "custom" });
    update();
}

function update()
{
    if (passThroughPort.get())
    {
        valueOutPort.set(valueInPort.get());
    }
    else
    {
        if (inIfNot.get() == "custom") valueOutPort.set(inCustomNot.get());
    }
}


};

Ops.Number.GateNumber.prototype = new CABLES.Op();
CABLES.OPS["594105c8-1fdb-4f3c-bbd5-29b9ad6b33e0"]={f:Ops.Number.GateNumber,objName:"Ops.Number.GateNumber"};



window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
