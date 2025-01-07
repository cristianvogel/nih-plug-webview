"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Ui=Ops.Ui || {};
Ops.Anim=Ops.Anim || {};
Ops.Math=Ops.Math || {};
Ops.Array=Ops.Array || {};
Ops.Trigger=Ops.Trigger || {};
Ops.WebAudio=Ops.WebAudio || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Array.PointArray=Ops.Array.PointArray || {};



// **************************************************************
// 
// Ops.Array.PointArray.PointsCube
// 
// **************************************************************

Ops.Array.PointArray.PointsCube = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const numx = op.inValueInt("num x", 5),
    numy = op.inValueInt("num y", 5),
    numz = op.inValueInt("num z", 5),
    mul = op.inValue("mul", 1),
    center = op.inValueBool("center", true),
    outArray = op.outArray("Array out", [], 3),
    idx = op.outNumber("Total points"),
    arrayLengthOut = op.outNumber("Array length");

let newArr = [];
outArray.set(newArr);

numx.onChange =
numy.onChange =
numz.onChange =
mul.onChange =
center.onChange = update;

function update()
{
    newArr.length = 0;

    let subX = 0;
    let subY = 0;
    let subZ = 0;

    if (center.get())
    {
        subX = ((numx.get() - 1) * mul.get()) / 2.0;
        subY = ((numy.get() - 1) * mul.get()) / 2.0;
        subZ = ((numz.get() - 1) * mul.get()) / 2.0;
    }

    let xTemp = 0;
    let yTemp = 0;
    let zTemp = 0;

    let m = mul.get();

    for (var z = 0; z < numz.get(); z++)
    {
        zTemp = (z * m) - subZ;

        for (var y = 0; y < numy.get(); y++)
        {
            yTemp = (y * m) - subY;

            for (var x = 0; x < numx.get(); x++)
            {
                xTemp = (x * m) - subX;

                newArr.push(xTemp);
                newArr.push(yTemp);
                newArr.push(zTemp);
            }
        }
    }
    idx.set(x * y * z);
    outArray.setRef(newArr);
    arrayLengthOut.set(newArr.length);
}

update();


};

Ops.Array.PointArray.PointsCube.prototype = new CABLES.Op();
CABLES.OPS["6030193b-089c-4565-a7b8-d837501ded52"]={f:Ops.Array.PointArray.PointsCube,objName:"Ops.Array.PointArray.PointsCube"};




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
// Ops.Trigger.TriggerOnce
// 
// **************************************************************

Ops.Trigger.TriggerOnce = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    exe = op.inTriggerButton("Exec"),
    reset = op.inTriggerButton("Reset"),
    next = op.outTrigger("Next"),
    outTriggered = op.outBoolNum("Was Triggered");

let triggered = false;

op.toWorkPortsNeedToBeLinked(exe);

reset.onTriggered = function ()
{
    triggered = false;
    outTriggered.set(triggered);
};

exe.onTriggered = function ()
{
    if (triggered) return;

    triggered = true;
    next.trigger();
    outTriggered.set(triggered);
};


};

Ops.Trigger.TriggerOnce.prototype = new CABLES.Op();
CABLES.OPS["cf3544e4-e392-432b-89fd-fcfb5c974388"]={f:Ops.Trigger.TriggerOnce,objName:"Ops.Trigger.TriggerOnce"};




// **************************************************************
// 
// Ops.Array.ArrayUnpack3
// 
// **************************************************************

Ops.Array.ArrayUnpack3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const inArray1 = op.inArray("Array in xyz"),
    outArray1 = op.outArray("Array 1 out"),
    outArray2 = op.outArray("Array 2 out"),
    outArray3 = op.outArray("Array 3 out"),
    outArrayLength = op.outNumber("Array lengths");

let showingError = false;

const arr1 = [];
const arr2 = [];
const arr3 = [];

inArray1.onChange = update;

function update()
{
    let array1 = inArray1.get();

    if (!array1)
    {
        outArray1.set(null);
        return;
    }

    if (array1.length % 3 !== 0)
    {
        if (!showingError)
        {
            op.uiAttr({ "error": "Arrays length not divisible by 3 !" });
            outArrayLength.set(0);
            showingError = true;
        }
        return;
    }

    if (showingError)
    {
        showingError = false;
        op.uiAttr({ "error": null });
    }

    arr1.length = Math.floor(array1.length / 3);
    arr2.length = Math.floor(array1.length / 3);
    arr3.length = Math.floor(array1.length / 3);

    for (let i = 0; i < array1.length / 3; i++)
    {
        arr1[i] = array1[i * 3];
        arr2[i] = array1[i * 3 + 1];
        arr3[i] = array1[i * 3 + 2];
    }

    // outArray1.set(null);
    // outArray2.set(null);
    // outArray3.set(null);
    outArray1.setRef(arr1);
    outArray2.setRef(arr2);
    outArray3.setRef(arr3);
    outArrayLength.set(arr1.length);
}


};

Ops.Array.ArrayUnpack3.prototype = new CABLES.Op();
CABLES.OPS["fa671f66-6957-41e6-ac35-d615b7c29285"]={f:Ops.Array.ArrayUnpack3,objName:"Ops.Array.ArrayUnpack3"};




// **************************************************************
// 
// Ops.Array.ArrayPack3
// 
// **************************************************************

Ops.Array.ArrayPack3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const exe = op.inTrigger("Trigger in"),
    inArr1 = op.inArray("Array 1"),
    inArr2 = op.inArray("Array 2"),
    inArr3 = op.inArray("Array 3"),
    exeOut = op.outTrigger("Trigger out"),
    outArr = op.outArray("Array out", 3),
    outNum = op.outNumber("Num Points"),
    outArrayLength = op.outNumber("Array length");

let showingError = false;

let arr = [];
let emptyArray = [];
let needsCalc = true;

exe.onTriggered = update;

inArr1.onChange = inArr2.onChange = inArr3.onChange = calcLater;

function calcLater()
{
    needsCalc = true;
}

function update()
{
    let array1 = inArr1.get();
    let array2 = inArr2.get();
    let array3 = inArr3.get();

    if (!array1 && !array2 && !array3)
    {
        outArr.set(null);
        outNum.set(0);
        return;
    }
    // only update if array has changed
    if (needsCalc)
    {
        let arrlen = 0;

        if (!array1 || !array2 || !array3)
        {
            if (array1) arrlen = array1.length;
            else if (array2) arrlen = array2.length;
            else if (array3) arrlen = array3.length;

            if (emptyArray.length != arrlen)
                for (let i = 0; i < arrlen; i++) emptyArray[i] = 0;

            if (!array1)array1 = emptyArray;
            if (!array2)array2 = emptyArray;
            if (!array3)array3 = emptyArray;
        }

        if ((array1.length !== array2.length) || (array2.length !== array3.length))
        {
            op.setUiError("arraylen", "Arrays do not have the same length !");
            return;
        }
        op.setUiError("arraylen", null);

        arr.length = array1.length;
        for (let i = 0; i < array1.length; i++)
        {
            arr[i * 3 + 0] = array1[i];
            arr[i * 3 + 1] = array2[i];
            arr[i * 3 + 2] = array3[i];
        }

        needsCalc = false;
        outArr.setRef(arr);
        outNum.set(arr.length / 3);
        outArrayLength.set(arr.length);
    }

    exeOut.trigger();
}


};

Ops.Array.ArrayPack3.prototype = new CABLES.Op();
CABLES.OPS["2bcf32fe-3cbd-48fd-825a-61255bebda9b"]={f:Ops.Array.ArrayPack3,objName:"Ops.Array.ArrayPack3"};




// **************************************************************
// 
// Ops.Trigger.TriggerExtender
// 
// **************************************************************

Ops.Trigger.TriggerExtender = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inTriggerPort = op.inTriggerButton("Execute"),
    outTriggerPort = op.outTrigger("Next");

inTriggerPort.onTriggered = function ()
{
    outTriggerPort.trigger();
};


};

Ops.Trigger.TriggerExtender.prototype = new CABLES.Op();
CABLES.OPS["7ef594f3-4907-47b0-a2d3-9854eda1679d"]={f:Ops.Trigger.TriggerExtender,objName:"Ops.Trigger.TriggerExtender"};




// **************************************************************
// 
// Ops.Array.ArrayMath
// 
// **************************************************************

Ops.Array.ArrayMath = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const inArray_0 = op.inArray("array 0"),
    NumberIn = op.inValueFloat("Number for math", 0.0),
    mathSelect = op.inSwitch("Math function", ["+", "-", "*", "/", "%", "min", "max"], "+"),
    outArray = op.outArray("Array result"),
    outArrayLength = op.outNumber("Array length");

op.toWorkPortsNeedToBeLinked(inArray_0);

let mathFunc;
let showingError = false;
let mathArray = [];

inArray_0.onChange = NumberIn.onChange = update;
mathSelect.onChange = onFilterChange;

onFilterChange();

inArray_0.onLinkChanged = () =>
{
    if (inArray_0) inArray_0.copyLinkedUiAttrib("stride", outArray);
};

function onFilterChange()
{
    let mathSelectValue = mathSelect.get();

    if (mathSelectValue === "+") mathFunc = function (a, b) { return a + b; };
    else if (mathSelectValue === "-") mathFunc = function (a, b) { return a - b; };
    else if (mathSelectValue === "*") mathFunc = function (a, b) { return a * b; };
    else if (mathSelectValue === "/") mathFunc = function (a, b) { return a / b; };
    else if (mathSelectValue === "%") mathFunc = function (a, b) { return a % b; };
    else if (mathSelectValue === "min") mathFunc = function (a, b) { return Math.min(a, b); };
    else if (mathSelectValue === "max") mathFunc = function (a, b) { return Math.max(a, b); };
    update();
    op.setUiAttrib({ "extendTitle": mathSelectValue });
}

function update()
{
    let array0 = inArray_0.get();

    mathArray.length = 0;

    if (!array0)
    {
        outArrayLength.set(0);
        outArray.set(null);
        return;
    }

    let num = NumberIn.get();
    mathArray.length = array0.length;

    let i = 0;

    for (i = 0; i < array0.length; i++)
    {
        mathArray[i] = mathFunc(array0[i], num);
    }

    outArray.setRef(mathArray);
    outArrayLength.set(mathArray.length);
}


};

Ops.Array.ArrayMath.prototype = new CABLES.Op();
CABLES.OPS["c7617717-3114-452f-9625-e4fefd841e88"]={f:Ops.Array.ArrayMath,objName:"Ops.Array.ArrayMath"};




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
// Ops.Gl.MeshInstancer_v4
// 
// **************************************************************

Ops.Gl.MeshInstancer_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"billboard_vert":"\n#ifdef BILLBOARDING\n\n    modelViewMatrix[0][0] = 1.0;\n    modelViewMatrix[0][1] = 0.0;\n    modelViewMatrix[0][2] = 0.0;\n\n    #ifndef BILLBOARDING_CYLINDRIC\n        modelViewMatrix[1][0] = 0.0;\n        modelViewMatrix[1][1] = 1.0;\n        modelViewMatrix[1][2] = 0.0;\n    #endif\n\n    modelViewMatrix[2][0] = 0.0;\n    modelViewMatrix[2][1] = 0.0;\n    modelViewMatrix[2][2] = 1.0;\n\n#endif","instancer_body_frag":"#define INSTANCING\n#ifdef COLORIZE_INSTANCES\n    #ifdef BLEND_MODE_MULTIPLY\n        col.rgb *= frag_instColor.rgb;\n        col.a *= frag_instColor.a;\n    #endif\n\n    #ifdef BLEND_MODE_ADD\n        col.rgb += frag_instColor.rgb;\n        col.a += frag_instColor.a;\n    #endif\n\n    #ifdef BLEND_MODE_NONE\n        col.rgb = frag_instColor.rgb;\n        col.a = frag_instColor.a;\n    #endif\n#endif\n","instancer_body_vert":"\n\n#ifdef HAS_TEXCOORDS\ntexCoord=(texCoord*instTexCoords.zw)+instTexCoords.xy;\n#endif\n\nmMatrix*=instMat;\npos.xyz*=MOD_scale;\n\n#ifdef HAS_COLORS\nfrag_instColor=instColor;\n#endif\n#ifndef HAS_COLORS\nfrag_instColor=vec4(1.0);\n#endif\n\n\nfrag_instIndex=instanceIndex;\n\n","instancer_head_frag":"IN vec4 frag_instColor;\n\n#ifdef WEBGL2\n    flat IN float frag_instIndex;\n#endif\n#ifdef WEBGL1\n    IN float frag_instIndex;\n#endif\n","instancer_head_vert":"\nIN vec4 instColor;\nIN mat4 instMat;\nIN vec4 instTexCoords;\nIN float instanceIndex;\nOUT mat4 instModelMat;\nOUT vec4 frag_instColor;\n\n#ifdef WEBGL2\n    flat OUT float frag_instIndex;\n#endif\n#ifdef WEBGL1\n    OUT float frag_instIndex;\n#endif\n\n\n\n#define INSTANCING\n\n",};
const
    exe = op.inTrigger("exe"),
    geom = op.inObject("geom", null, "geometry"),
    inScale = op.inValue("Scale", 1),
    doLimit = op.inValueBool("Limit Instances", false),
    inLimit = op.inValueInt("Limit", 100),
    inTranslates = op.inArray("positions", 3),
    inScales = op.inArray("Scale Array", 3),
    inRot = op.inArray("Rotations", 3),
    inRotMeth = op.inSwitch("Rotation Type", ["Euler", "Quaternions", "Normals"], "Euler"),

    inBillboarding = op.inSwitch("Billboarding", ["Off", "Spherical", "Cylindrical"], "Off"),

    inBlendMode = op.inSwitch("Material blend mode", ["Multiply", "Add", "Normal"], "Multiply"),
    inColor = op.inArray("Colors", 4),
    inTexCoords = op.inArray("TexCoords", 4),
    outTrigger = op.outTrigger("Trigger Out"),
    outNum = op.outNumber("Num");

op.setPortGroup("Limit Number of Instances", [inLimit, doLimit]);
op.setPortGroup("Parameters", [inScales, inRot, inTranslates, inRotMeth]);
op.toWorkPortsNeedToBeLinked(geom);
op.toWorkPortsNeedToBeLinked(exe);

geom.ignoreValueSerialize = true;

const cgl = op.patch.cgl;
const m = mat4.create();
let
    matrixArray = new Float32Array(1),
    instColorArray = new Float32Array(1),
    instTexcoordArray = new Float32Array(1),
    mesh = null,
    recalc = true,
    num = 0,
    arrayChangedColor = true,
    arrayChangedTexcoords = true,
    arrayChangedTrans = true;

const mod = new CGL.ShaderModifier(cgl, op.name, { "opId": op.id });
mod.addModule({
    "name": "MODULE_VERTEX_POSITION",
    "title": op.name,
    "priority": -2,
    "srcHeadVert": attachments.instancer_head_vert,
    "srcBodyVert": attachments.instancer_body_vert
});

mod.addModule({
    "name": "MODULE_VERTEX_MODELVIEW",
    "title": op.name + "_billboard",
    "srcBodyVert": attachments.billboard_vert
});

mod.addModule({
    "name": "MODULE_COLOR",
    "priority": -2,
    "title": op.name,
    "srcHeadFrag": attachments.instancer_head_frag,
    "srcBodyFrag": attachments.instancer_body_frag,
});

mod.addUniformVert("f", "MOD_scale", inScale);

let needsUpdateDefines = true;

inBlendMode.onChange = () => { needsUpdateDefines = true; };

doLimit.onChange = updateLimit;
exe.onTriggered = doRender;
exe.onLinkChanged = function ()
{
    if (!exe.isLinked()) removeModule();
};

updateLimit();

inRot.onChange =
inScales.onChange =
inTranslates.onChange =
inRotMeth.onChange =
    function ()
    {
        arrayChangedTrans = true;
        recalc = true;
    };

inBillboarding.onChange =
inTexCoords.onChange = function ()
{
    arrayChangedTexcoords = true;
    recalc = true;
    needsUpdateDefines = true;
};

inColor.onChange = function ()
{
    arrayChangedColor = true;
    recalc = true;
    needsUpdateDefines = true;
};

function reset()
{
    arrayChangedColor = true,
    arrayChangedTrans = true;
    recalc = true;
}

function updateDefines()
{
    mod.toggleDefine("BILLBOARDING", inBillboarding.get() != "Off");
    mod.toggleDefine("BILLBOARDING_CYLINDRIC", inBillboarding.get() == "Cylindrical");

    mod.toggleDefine("COLORIZE_INSTANCES", inColor.get());
    mod.toggleDefine("TEXCOORDS_INSTANCES", inTexCoords.get());
    mod.toggleDefine("BLEND_MODE_MULTIPLY", inBlendMode.get() === "Multiply");
    mod.toggleDefine("BLEND_MODE_ADD", inBlendMode.get() === "Add");
    mod.toggleDefine("BLEND_MODE_NONE", inBlendMode.get() === "Normal");
    needsUpdateDefines = false;
}

geom.onChange = function ()
{
    if (mesh)mesh.dispose();
    if (!geom.get())
    {
        mesh = null;
        return;
    }

    mesh = new CGL.Mesh(cgl, geom.get());
    reset();
};

function removeModule()
{

}

function setupArray()
{
    if (!mesh) return;

    let transforms = inTranslates.get();
    if (!transforms) transforms = [0, 0, 0];

    num = Math.floor(transforms.length / 3);

    if (needsUpdateDefines)updateDefines();

    const colArr = inColor.get();
    const tcArr = inTexCoords.get();
    const scales = inScales.get();
    const useQuats = inRotMeth.get() == "Quaternions";
    const useEuler = inRotMeth.get() == "Euler";
    const useNormals = inRotMeth.get() == "Normals";

    let stride = 3;
    if (useQuats)stride = 4;
    inRot.setUiAttribs({ "stride": stride });

    if (scales && scales.length != transforms.length) op.setUiError("lengthScales", "Scales array has wrong length");
    else op.setUiError("lengthScales", null);

    if (matrixArray.length != num * 16) matrixArray = new Float32Array(num * 16);
    if (instColorArray.length != num * 4)
    {
        arrayChangedColor = true;
        instColorArray = new Float32Array(num * 4);
    }
    if (instTexcoordArray.length != num * 4)
    {
        arrayChangedTexcoords = true;
        instTexcoordArray = new Float32Array(num * 4);
    }

    const rotArr = inRot.get();

    for (let i = 0; i < num; i++)
    {
        mat4.identity(m);

        mat4.translate(m, m, [
            transforms[i * 3],
            transforms[i * 3 + 1],
            transforms[i * 3 + 2]
        ]);

        if (rotArr)
        {
            if (useQuats)
            {
                const mq = mat4.create();
                const q = [rotArr[i * 4 + 0], rotArr[i * 4 + 1], rotArr[i * 4 + 2], rotArr[i * 4 + 3]];
                quat.normalize(q, q);
                mat4.fromQuat(mq, q);
                mat4.mul(m, m, mq);
            }
            else
            if (useNormals)
            {
                const n = [rotArr[i * 3 + 0], rotArr[i * 3 + 1], rotArr[i * 3 + 2]];
                const up = [1, 0, 0];
                const v = vec3.create();

                vec3.cross(v, up, n);
                vec3.normalize(v, v);

                const angle = Math.acos(vec3.dot(up, n));
                const q = quat.create();

                quat.setAxisAngle(q, v, angle);
                quat.normalize(q, q);

                const mq = mat4.create();

                mat4.fromQuat(mq, q);
                mat4.mul(m, m, mq);
            }
            if (useEuler)
            {
                mat4.rotateX(m, m, rotArr[i * 3 + 0] * CGL.DEG2RAD);
                mat4.rotateY(m, m, rotArr[i * 3 + 1] * CGL.DEG2RAD);
                mat4.rotateZ(m, m, rotArr[i * 3 + 2] * CGL.DEG2RAD);
            }
        }

        if (arrayChangedColor && colArr)
        {
            instColorArray[i * 4 + 0] = colArr[i * 4 + 0];
            instColorArray[i * 4 + 1] = colArr[i * 4 + 1];
            instColorArray[i * 4 + 2] = colArr[i * 4 + 2];
            instColorArray[i * 4 + 3] = colArr[i * 4 + 3];
        }

        if (arrayChangedTexcoords && tcArr)
        {
            instTexcoordArray[i * 4 + 0] = tcArr[i * 4 + 0];
            instTexcoordArray[i * 4 + 1] = tcArr[i * 4 + 1];
            instTexcoordArray[i * 4 + 2] = tcArr[i * 4 + 2];
            instTexcoordArray[i * 4 + 3] = tcArr[i * 4 + 3];
        }

        if (scales && scales.length > i) mat4.scale(m, m, [scales[i * 3], scales[i * 3 + 1], scales[i * 3 + 2]]);
        else mat4.scale(m, m, [1, 1, 1]);

        for (let a = 0; a < 16; a++) matrixArray[i * 16 + a] = m[a];
    }

    // mesh.numInstances = num;
    mesh.setNumInstances(num);

    if (arrayChangedTrans) mesh.addAttribute("instMat", matrixArray, 16);
    if (arrayChangedColor) mesh.addAttribute("instColor", instColorArray, 4, { "instanced": true });
    if (arrayChangedTexcoords) mesh.addAttribute("instTexCoords", instTexcoordArray, 4, { "instanced": true });

    mod.toggleDefine("HAS_TEXCOORDS", tcArr);
    mod.toggleDefine("HAS_COLORS", colArr);

    arrayChangedColor = false;
    recalc = false;
}

function updateLimit()
{
    inLimit.setUiAttribs({ "greyout": !doLimit.get() });
}

function doRender()
{
    if (!mesh) return;
    if (recalc) setupArray();

    mod.bind();

    if (doLimit.get()) mesh.setNumInstances(Math.min(num, inLimit.get()));
    else mesh.setNumInstances(num);

    outNum.set(mesh.numInstances);

    if (mesh.numInstances > 0) mesh.render(cgl.getShader());

    outTrigger.trigger();

    mod.unbind();
}


};

Ops.Gl.MeshInstancer_v4.prototype = new CABLES.Op();
CABLES.OPS["cb58f461-a0bd-4159-a3cb-5e396198b4e9"]={f:Ops.Gl.MeshInstancer_v4,objName:"Ops.Gl.MeshInstancer_v4"};




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
// Ops.Gl.Meshes.Cube_v2
// 
// **************************************************************

Ops.Gl.Meshes.Cube_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("Render"),
    active = op.inValueBool("Render Mesh", true),
    width = op.inValue("Width", 1),
    len = op.inValue("Length", 1),
    height = op.inValue("Height", 1),
    center = op.inValueBool("Center", true),
    mapping = op.inSwitch("Mapping", ["Side", "Cube +-", "SideWrap"], "Side"),
    mappingBias = op.inValue("Bias", 0),
    inFlipX = op.inValueBool("Flip X", true),
    sideTop = op.inValueBool("Top", true),
    sideBottom = op.inValueBool("Bottom", true),
    sideLeft = op.inValueBool("Left", true),
    sideRight = op.inValueBool("Right", true),
    sideFront = op.inValueBool("Front", true),
    sideBack = op.inValueBool("Back", true),
    trigger = op.outTrigger("Next"),
    geomOut = op.outObject("geometry", null, "geometry");

const cgl = op.patch.cgl;
op.toWorkPortsNeedToBeLinked(render);
op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_FUNCTION);

op.setPortGroup("Mapping", [mapping, mappingBias, inFlipX]);
op.setPortGroup("Geometry", [width, height, len, center]);
op.setPortGroup("Sides", [sideTop, sideBottom, sideLeft, sideRight, sideFront, sideBack]);

let geom = null,
    mesh = null,
    meshvalid = true,
    needsRebuild = true;

mappingBias.onChange =
    inFlipX.onChange =
    sideTop.onChange =
    sideBottom.onChange =
    sideLeft.onChange =
    sideRight.onChange =
    sideFront.onChange =
    sideBack.onChange =
    mapping.onChange =
    width.onChange =
    height.onChange =
    len.onChange =
    center.onChange = buildMeshLater;

function buildMeshLater()
{
    needsRebuild = true;
}

render.onLinkChanged = function ()
{
    if (!render.isLinked()) geomOut.set(null);
    else geomOut.setRef(geom);
};

render.onTriggered = function ()
{
    if (needsRebuild)buildMesh();
    if (active.get() && mesh && meshvalid) mesh.render(cgl.getShader());
    trigger.trigger();
};

op.preRender = function ()
{
    buildMesh();
    if (mesh && cgl)mesh.render(cgl.getShader());
};

function buildMesh()
{
    if (!geom)geom = new CGL.Geometry("cubemesh");
    geom.clear();

    let x = width.get();
    let nx = -1 * width.get();
    let y = height.get();
    let ny = -1 * height.get();
    let z = len.get();
    let nz = -1 * len.get();

    if (!center.get())
    {
        nx = 0;
        ny = 0;
        nz = 0;
    }
    else
    {
        x *= 0.5;
        nx *= 0.5;
        y *= 0.5;
        ny *= 0.5;
        z *= 0.5;
        nz *= 0.5;
    }

    addAttribs(geom, x, y, z, nx, ny, nz);
    if (mapping.get() == "Side") sideMappedCube(geom, 1, 1, 1);
    else if (mapping.get() == "SideWrap") sideMappedCube(geom, x, y, z);
    else cubeMappedCube(geom);

    geom.verticesIndices = [];
    if (sideTop.get()) geom.verticesIndices.push(8, 9, 10, 8, 10, 11); // Top face
    if (sideBottom.get()) geom.verticesIndices.push(12, 13, 14, 12, 14, 15); // Bottom face
    if (sideLeft.get()) geom.verticesIndices.push(20, 21, 22, 20, 22, 23); // Left face
    if (sideRight.get()) geom.verticesIndices.push(16, 17, 18, 16, 18, 19); // Right face
    if (sideBack.get()) geom.verticesIndices.push(4, 5, 6, 4, 6, 7); // Back face
    if (sideFront.get()) geom.verticesIndices.push(0, 1, 2, 0, 2, 3); // Front face

    if (geom.verticesIndices.length === 0) meshvalid = false;
    else meshvalid = true;

    if (mesh)mesh.dispose();
    if (op.patch.cg) mesh = op.patch.cg.createMesh(geom, { "opId": op.id });

    geomOut.setRef(geom);

    needsRebuild = false;
}

op.onDelete = function ()
{
    if (mesh)mesh.dispose();
};

function sideMappedCube(geom, x, y, z)
{
    const bias = mappingBias.get();

    let u1 = 1.0 - bias;
    let u0 = 0.0 + bias;
    if (inFlipX.get())
    {
        [u1, u0] = [u0, u1];
    }

    let v1 = 1.0 - bias;
    let v0 = 0.0 + bias;

    geom.setTexCoords([
        // Front face
        x * u0, y * v1,
        x * u1, y * v1,
        x * u1, y * v0,
        x * u0, y * v0,
        // Back face
        x * u1, y * v1,
        x * u1, y * v0,
        x * u0, y * v0,
        x * u0, y * v1,
        // Top face
        x * u0, z * v0,
        x * u0, z * v1,
        x * u1, z * v1,
        x * u1, z * v0,
        // Bottom face
        x * u1, y * v0,
        x * u0, y * v0,
        x * u0, y * v1,
        x * u1, y * v1,
        // Right face
        z * u1, y * v1,
        z * u1, y * v0,
        z * u0, y * v0,
        z * u0, y * v1,
        // Left face
        z * u0, y * v1,
        z * u1, y * v1,
        z * u1, y * v0,
        z * u0, y * v0,
    ]);
}

function cubeMappedCube(geom, x, y, z, nx, ny, nz)
{
    const sx = 0.25;
    const sy = 1 / 3;
    const bias = mappingBias.get();

    let flipx = 0.0;
    if (inFlipX.get()) flipx = 1.0;

    const tc = [];
    tc.push(
        // Front face   Z+
        flipx + sx + bias, sy * 2 - bias, flipx + sx * 2 - bias, sy * 2 - bias, flipx + sx * 2 - bias, sy + bias, flipx + sx + bias, sy + bias,
        // Back face Z-
        flipx + sx * 4 - bias, sy * 2 - bias, flipx + sx * 4 - bias, sy + bias, flipx + sx * 3 + bias, sy + bias, flipx + sx * 3 + bias, sy * 2 - bias);

    if (inFlipX.get())
        tc.push(
            // Top face
            sx + bias, 0 - bias, sx * 2 - bias, 0 - bias, sx * 2 - bias, sy * 1 + bias, sx + bias, sy * 1 + bias,
            // Bottom face
            sx + bias, sy * 3 + bias, sx + bias, sy * 2 - bias, sx * 2 - bias, sy * 2 - bias, sx * 2 - bias, sy * 3 + bias
        );

    else
        tc.push(
            // Top face
            sx + bias, 0 + bias, sx + bias, sy * 1 - bias, sx * 2 - bias, sy * 1 - bias, sx * 2 - bias, 0 + bias,
            // Bottom face
            sx + bias, sy * 3 - bias, sx * 2 - bias, sy * 3 - bias, sx * 2 - bias, sy * 2 + bias, sx + bias, sy * 2 + bias);

    tc.push(
        // Right face
        flipx + sx * 3 - bias, 1.0 - sy - bias, flipx + sx * 3 - bias, 1.0 - sy * 2 + bias, flipx + sx * 2 + bias, 1.0 - sy * 2 + bias, flipx + sx * 2 + bias, 1.0 - sy - bias,
        // Left face
        flipx + sx * 0 + bias, 1.0 - sy - bias, flipx + sx * 1 - bias, 1.0 - sy - bias, flipx + sx * 1 - bias, 1.0 - sy * 2 + bias, flipx + sx * 0 + bias, 1.0 - sy * 2 + bias);

    geom.setTexCoords(tc);
}

function addAttribs(geom, x, y, z, nx, ny, nz)
{
    geom.vertices = [
        // Front face
        nx, ny, z,
        x, ny, z,
        x, y, z,
        nx, y, z,
        // Back face
        nx, ny, nz,
        nx, y, nz,
        x, y, nz,
        x, ny, nz,
        // Top face
        nx, y, nz,
        nx, y, z,
        x, y, z,
        x, y, nz,
        // Bottom face
        nx, ny, nz,
        x, ny, nz,
        x, ny, z,
        nx, ny, z,
        // Right face
        x, ny, nz,
        x, y, nz,
        x, y, z,
        x, ny, z,
        // zeft face
        nx, ny, nz,
        nx, ny, z,
        nx, y, z,
        nx, y, nz
    ];

    geom.vertexNormals = new Float32Array([
        // Front face
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        // Back face
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        // Top face
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        // Bottom face
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        // Right face
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        // Left face
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ]);
    geom.tangents = new Float32Array([
        // front face
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        // back face
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        // top face
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
        // bottom face
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        // right face
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        // left face
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1
    ]);
    geom.biTangents = new Float32Array([
        // front face
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
        // back face
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        // top face
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        // bottom face
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        // right face
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        // left face
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1
    ]);
}


};

Ops.Gl.Meshes.Cube_v2.prototype = new CABLES.Op();
CABLES.OPS["37b92ba4-cea5-42ae-bf28-a513ca28549c"]={f:Ops.Gl.Meshes.Cube_v2,objName:"Ops.Gl.Meshes.Cube_v2"};




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
// Ops.Array.RandomNumbersArray_v4
// 
// **************************************************************

Ops.Array.RandomNumbersArray_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    numValues = op.inValueInt("Num Values", 100),
    inModeSwitch = op.inSwitch("Mode", ["A", "AB", "ABC", "ABCD"], "A"),
    inSeed = op.inValueFloat("Random Seed ", 0),
    inInteger = op.inBool("Integer", false),
    inClosed = op.inValueBool("Last == First"),
    outValues = op.outArray("Array Out"),
    outTotalPoints = op.outNumber("Chunks Amount"),
    outArrayLength = op.outNumber("Array length");

const letters = ["A", "B", "C", "D"];
const arr = [];

const inArray = letters.map(function (value)
{
    return {
        "min": op.inValueFloat("Min " + value, -1),
        "max": op.inValueFloat("Max " + value, 1),
    };
});

for (let i = 0; i < inArray.length; i += 1)
{
    const portObj = inArray[i];
    const keys = Object.keys(portObj);

    op.setPortGroup("Value Range " + letters[i], keys.map(function (key) { return portObj[key]; }));

    if (i > 0) keys.forEach(function (key) { portObj[key].setUiAttribs({ "greyout": true }); });
}

inModeSwitch.onChange = function ()
{
    const mode = inModeSwitch.get();
    const modes = inModeSwitch.uiAttribs.values;

    outValues.setUiAttribs({ "stride": inModeSwitch.get().length });

    const index = modes.indexOf(mode);

    inArray.forEach(function (portObj, i)
    {
        const keys = Object.keys(portObj);
        keys.forEach(function (key, j)
        {
            if (i <= index) portObj[key].setUiAttribs({ "greyout": false });
            else portObj[key].setUiAttribs({ "greyout": true });
        });
    });
    init();
};

outValues.ignoreValueSerialize = true;

inClosed.onChange =
    numValues.onChange =
    inSeed.onChange =
    inInteger.onChange = init;

const minMaxArray = [];

init();

function init()
{
    const mode = inModeSwitch.get();
    const modes = inModeSwitch.uiAttribs.values;
    const index = modes.indexOf(mode);

    const n = Math.floor(Math.abs(numValues.get()));
    Math.randomSeed = inSeed.get();

    op.setUiAttrib({ "extendTitle": n + "*" + mode.length });

    const dimension = index + 1;
    const length = n * dimension;

    arr.length = length;
    const tupleLength = length / dimension;
    const isInteger = inInteger.get();

    // optimization: we only need to fetch the max min for each component once
    for (let i = 0; i < dimension; i += 1)
    {
        const portObj = inArray[i];
        const max = portObj.max.get();
        const min = portObj.min.get();
        minMaxArray[i] = [min, max];
    }

    for (let j = 0; j < tupleLength; j += 1)
    {
        for (let k = 0; k < dimension; k += 1)
        {
            const min = minMaxArray[k][0];
            const max = minMaxArray[k][1];
            const index = j * dimension + k;

            if (isInteger) arr[index] = Math.floor(Math.seededRandom() * ((max + 1) - min) + min);
            else arr[index] = Math.seededRandom() * (max - min) + min;
        }
    }

    if (inClosed.get() && arr.length > dimension)
    {
        for (let i = 0; i < dimension; i++)
            arr[arr.length - 3 + i] = arr[i];
    }

    outValues.setRef(arr);
    outTotalPoints.set(arr.length / dimension);
    outArrayLength.set(arr.length);
}

// assign change handler
inArray.forEach(function (obj)
{
    Object.keys(obj).forEach(function (key)
    {
        const x = obj[key];
        x.onChange = init;
    });
});


};

Ops.Array.RandomNumbersArray_v4.prototype = new CABLES.Op();
CABLES.OPS["8a9fa2c6-c229-49a9-9dc8-247001539217"]={f:Ops.Array.RandomNumbersArray_v4,objName:"Ops.Array.RandomNumbersArray_v4"};




// **************************************************************
// 
// Ops.Gl.MainLoop_v2
// 
// **************************************************************

Ops.Gl.MainLoop_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    hdpi = op.inFloat("Max Pixel Density (DPR)", 2),
    fpsLimit = op.inValue("FPS Limit", 0),
    reduceFocusFPS = op.inValueBool("Reduce FPS unfocussed", false),
    clear = op.inValueBool("Transparent", false),
    active = op.inValueBool("Active", 1),
    trigger = op.outTrigger("trigger"),
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    outPixel = op.outNumber("Pixel Density");

op.onAnimFrame = render;
hdpi.onChange = updateHdpi;

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

let fsElement = null;
let winhasFocus = true;
let winVisible = true;

window.addEventListener("blur", () => { winhasFocus = false; });
window.addEventListener("focus", () => { winhasFocus = true; });
document.addEventListener("visibilitychange", () => { winVisible = !document.hidden; });

testMultiMainloop();

cgl.mainloopOp = this;

function updateHdpi()
{
    setPixelDensity();

    if (CABLES.UI)
    {
        if (hdpi.get() < 1)
            op.patch.cgl.canvas.style.imageRendering = "pixelated";
    }

    op.patch.cgl.updateSize();
    if (CABLES.UI) gui.setLayout();
}

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

function getFpsLimit()
{
    if (reduceFocusFPS.get())
    {
        if (!winVisible) return 10;
        if (!winhasFocus) return 30;
    }

    return fpsLimit.get();
}

op.onDelete = function ()
{
    cgl.gl.clearColor(0, 0, 0.0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

function setPixelDensity()
{
    if (hdpi.get() != 0) op.patch.cgl.pixelDensity = Math.min(hdpi.get(), window.devicePixelRatio);
    else op.patch.cgl.pixelDensity = window.devicePixelRatio;
}

function render(time)
{
    if (!active.get()) return;
    if (cgl.aborted || cgl.canvas.clientWidth === 0 || cgl.canvas.clientHeight === 0) return;

    op.patch.cg = cgl;

    setPixelDensity();

    // if (hdpi.get())op.patch.cgl.pixelDensity = window.devicePixelRatio;

    const startTime = performance.now();

    op.patch.config.fpsLimit = getFpsLimit();

    if (cgl.canvasWidth == -1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if (cgl.canvasWidth != width.get() || cgl.canvasHeight != height.get())
    {
        width.set(cgl.canvasWidth / 1);
        height.set(cgl.canvasHeight / 1);
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

    if (!clear.get()) cgl.gl.clearColor(0, 0, 0, 1);
    else cgl.gl.clearColor(0, 0, 0, 0);

    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    trigger.trigger();

    if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if (CGL.Texture.previewTexture)
    {
        if (!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer = new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    op.patch.cg = null;

    if (!clear.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if (!cgl.frameStore.phong)cgl.frameStore.phong = {};
    rframes++;

    outPixel.set(op.patch.cgl.pixelDensity);
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

Ops.Gl.MainLoop_v2.prototype = new CABLES.Op();
CABLES.OPS["f1029550-d877-42da-9b1e-63a5163a0350"]={f:Ops.Gl.MainLoop_v2,objName:"Ops.Gl.MainLoop_v2"};




// **************************************************************
// 
// Ops.Gl.Matrix.OrbitControls_v2
// 
// **************************************************************

Ops.Gl.Matrix.OrbitControls_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    minDist = op.inValueFloat("min distance", 1),
    maxDist = op.inValueFloat("max distance", 999999),

    minRotY = op.inValue("min rot y", 0),
    maxRotY = op.inValue("max rot y", 0),

    initialRadius = op.inValue("initial radius", 2),
    initialAxis = op.inValueSlider("initial axis y", 0.5),
    initialX = op.inValueSlider("initial axis x", 0.25),

    smoothness = op.inValueSlider("Smoothness", 1.0),
    speedX = op.inValue("Speed X", 1),
    speedY = op.inValue("Speed Y", 1),

    active = op.inValueBool("Active", true),

    allowPanning = op.inValueBool("Allow Panning", true),
    allowZooming = op.inValueBool("Allow Zooming", true),
    allowRotation = op.inValueBool("Allow Rotation", true),
    restricted = op.inValueBool("restricted", true),
    inIdentity = op.inBool("Identity", true),
    inReset = op.inTriggerButton("Reset"),

    trigger = op.outTrigger("trigger"),
    outRadius = op.outNumber("radius"),
    outXDeg = op.outNumber("Rot X"),
    outYDeg = op.outNumber("Rot Y");
    // outCoords = op.outArray("Eye/Target Pos");

op.setPortGroup("Initial Values", [initialAxis, initialX, initialRadius]);
op.setPortGroup("Interaction", [smoothness, speedX, speedY]);
op.setPortGroup("Boundaries", [minRotY, maxRotY, minDist, maxDist]);

const halfCircle = Math.PI;
const fullCircle = Math.PI * 2;

const
    vUp = vec3.create(),
    vCenter = vec3.create(),
    viewMatrix = mat4.create(),
    tempViewMatrix = mat4.create(),
    vOffset = vec3.create(),
    finalEyeAbs = vec3.create(),
    tempEye = vec3.create(),
    finalEye = vec3.create(),
    tempCenter = vec3.create(),
    finalCenter = vec3.create();

let eye = vec3.create(),
    mouseDown = false,
    radius = 5,
    lastMouseX = 0, lastMouseY = 0,
    percX = 0, percY = 0,
    px = 0,
    py = 0,
    divisor = 1,
    element = null,
    initializing = true,
    eyeTargetCoord = [0, 0, 0, 0, 0, 0],
    lastPy = 0;

op.onDelete = unbind;
smoothness.onChange = updateSmoothness;
initialRadius.onChange =
    inReset.onTriggered = reset;

eye = circlePos(0);
vec3.set(vCenter, 0, 0, 0);
vec3.set(vUp, 0, 1, 0);
updateSmoothness();
// reset();

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
    divisor = smoothness.get() * 10 + 1;
}

function ip(val, goal)
{
    if (initializing) return goal;
    return val + (goal - val) / divisor;
}

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

    // eyeTargetCoord[0] = finalEye[0];
    // eyeTargetCoord[1] = finalEye[1];
    // eyeTargetCoord[2] = finalEye[2];
    // eyeTargetCoord[3] = finalCenter[0];
    // eyeTargetCoord[4] = finalCenter[1];
    // eyeTargetCoord[5] = finalCenter[2];
    // outCoords.setRef(eyeTargetCoord);

    const empty = vec3.create();

    if (inIdentity.get()) mat4.identity(cgl.vMatrix);

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
    if (radius < minDist.get()) radius = minDist.get();
    if (radius > maxDist.get()) radius = maxDist.get();

    outRadius.set(radius);

    let i = 0, degInRad = 0;

    degInRad = 360 * perc / 2 * CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad) * radius,
        Math.sin(degInRad) * radius,
        0);
    return vec;
}

function circlePos(perc)
{
    if (radius < minDist.get())radius = minDist.get();
    if (radius > maxDist.get())radius = maxDist.get();

    outRadius.set(radius);

    let i = 0, degInRad = 0;
    const vec = vec3.create();
    degInRad = 360 * perc / 2 * CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad) * radius,
        Math.sin(degInRad) * radius,
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
        vOffset[2] += movementX * 0.01;
        vOffset[1] += movementY * 0.01;
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

    try { element.releasePointerCapture(e.pointerId); }
    catch (e) {}
}

function lockChange()
{
    const el = op.patch.cg.canvas;

    if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
        document.addEventListener("mousemove", onmousemove, false);
}

function onMouseEnter(e)
{
}

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


};

Ops.Gl.Matrix.OrbitControls_v2.prototype = new CABLES.Op();
CABLES.OPS["efd09072-3dff-4be8-97b9-d8222ed967db"]={f:Ops.Gl.Matrix.OrbitControls_v2,objName:"Ops.Gl.Matrix.OrbitControls_v2"};




// **************************************************************
// 
// Ops.Array.RotateArray
// 
// **************************************************************

Ops.Array.RotateArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const inArray = op.inArray("Array in");
const count = op.inValueInt("Rotate amount", 0);
const outArray = op.outArray("ArrayOut");

let newArr = [];
outArray.set(newArr);

count.onChange =
inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let rotateIndex = -count.get();

    newArr = rotate(inArray.get(), rotateIndex, 0);
    outArray.set(null);
    outArray.set(newArr);
};

// https://gist.github.com/aubergene/7ecfe624199e68f60258
function rotate(array, n, guard)
{
    let head, tail;
    n = (n === null) || guard ? 1 : n;
    n %= array.length;
    tail = array.slice(n) || [];

    if (!tail || !tail.concat) return [];

    head = array.slice(0, n) || [];
    return tail.concat(head);
}


};

Ops.Array.RotateArray.prototype = new CABLES.Op();
CABLES.OPS["e435d07b-8545-4469-befb-868510adcb76"]={f:Ops.Array.RotateArray,objName:"Ops.Array.RotateArray"};




// **************************************************************
// 
// Ops.Array.HSBtoRGBArray
// 
// **************************************************************

Ops.Array.HSBtoRGBArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
function HSBtoRGB(hue, saturation, lightness)
{
    // based on algorithm from http://en.wikipedia.org/wiki/HSL_and_HSV#Converting_to_RGB
    const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
    let huePrime = hue * 6; // / 60;
    let secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));

    huePrime = Math.floor(huePrime) || 0;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (huePrime === 0)
    {
        red = chroma;
        green = secondComponent;
        blue = 0;
    }
    else if (huePrime === 1)
    {
        red = secondComponent;
        green = chroma;
        blue = 0;
    }
    else if (huePrime === 2)
    {
        red = 0;
        green = chroma;
        blue = secondComponent;
    }
    else if (huePrime === 3)
    {
        red = 0;
        green = secondComponent;
        blue = chroma;
    }
    else if (huePrime === 4)
    {
        red = secondComponent;
        green = 0;
        blue = chroma;
    }
    else if (huePrime >= 5)
    {
        red = chroma;
        green = 0;
        blue = secondComponent;
    }

    const lightnessAdjustment = (lightness - (chroma / 2));

    red += lightnessAdjustment;
    green += lightnessAdjustment;
    blue += lightnessAdjustment;

    return [red, green, blue];
}

const inTrigger = op.inTrigger("Trigger Input");
const inHue = op.inArray("In Hue Array");
const inSat = op.inArray("In Saturation Array");
const inBright = op.inArray("In Brightness Array");
const inAlpha = op.inArray("In Alpha Array");

const outTrigger = op.outTrigger("Trigger Output");
const outArray = op.outArray("Result Array");
const outLength = op.outNumber("Array Length", 0);
const outTupleLength = op.outNumber("RGBA Tuple Length", 0);

let newArr = [];
const emptyArr = [];
outArray.set(newArr);
outLength.set(newArr.length);
outTupleLength.set(newArr.length / 4);

outArray.ignoreValueSerialize = true;
inAlpha.ignoreValueSerialize = true;
inBright.ignoreValueSerialize = true;
inSat.ignoreValueSerialize = true;
inHue.ignoreValueSerialize = true;

let shouldRecalculate = true;

inTrigger.onTriggered = handleTrigger;
inHue.onChange = inSat.onChange = inBright.onChange = inAlpha.onChange = function () { shouldRecalculate = true; };

function handleTrigger()
{
    let arrH = inHue.get();
    let arrS = inSat.get();
    let arrB = inBright.get();
    let arrA = inAlpha.get();

    if (!arrH && !arrS && !arrB && !arrA)
    {
        outArray.set(null);
        outLength.set(0);
        outTupleLength.set(0);
        return;
    }

    let length = 0;

    if (shouldRecalculate)
    {
        if ([arrH, arrS, arrB, arrA].some(function (array) { return !array; }))
        {
            if (arrH) length = arrH.length;
            else if (arrS) length = arrS.length;
            else if (arrB) length = arrB.length;
            else if (arrA) length = arrA.length;

            emptyArr.length = length;
            for (let i = 0; i < length; i += 1) emptyArr[i] = 0;

            if (!arrH) arrH = emptyArr.map(function (val) { return 0; });
            if (!arrS) arrS = emptyArr.map(function (val) { return 1; });
            if (!arrB) arrB = emptyArr.map(function (val) { return 0.5; });
            if (!arrA) arrA = emptyArr.map(function (val) { return 1; });
        }
        else
        {
            length = arrH.length;
        }

        const areSameLength = [arrH, arrS, arrB, arrA].every(function (val, i, arr) { return val.length === length; });

        if (!areSameLength)
        {
            // op.log([arrH, arrS, arrB, arrA].map(a => a.length), length);
            op.setUiError("arrlen", "Arrays don't have the same length!");
        }
        else
        {
            op.setUiError("arrlen", null);
        }

        newArr.length = length * 4;

        for (let i = 0; i < newArr.length / 4; i += 1)
        {
            const hsbArray = HSBtoRGB(arrH[i], arrS[i], arrB[i]);
            newArr[i * 4 + 0] = hsbArray[0];
            newArr[i * 4 + 1] = hsbArray[1];
            newArr[i * 4 + 2] = hsbArray[2];
            newArr[i * 4 + 3] = arrA[i];
        }

        shouldRecalculate = false;
        outArray.set(null);
        outArray.set(newArr);
        outLength.set(newArr.length);
        outTupleLength.set(newArr.length / 4);
    }
    outTrigger.trigger();
}


};

Ops.Array.HSBtoRGBArray.prototype = new CABLES.Op();
CABLES.OPS["0f552671-7431-4031-97e3-211f2cf9f111"]={f:Ops.Array.HSBtoRGBArray,objName:"Ops.Array.HSBtoRGBArray"};




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
// Ops.WebAudio.ClockSequencer
// 
// **************************************************************

Ops.WebAudio.ClockSequencer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"worker_js":"let timerIDs = [];\nlet timerID = null;\nconst LOOKAHEAD_IN_MS = 25.;\nonmessage = (e) => {\n    if (e.data === \"start\") {\n        timerID = setInterval(() => postMessage(\"tick\"), LOOKAHEAD_IN_MS);\n        return;\n    }\n\n    if (e.data === \"stop\") {\n        clearInterval(timerID);\n        timerID = null;\n        console.log(\"stopped\");\n    }\n};\n\nonerror = (e) => {\n    console.log(\"worker error\", e);\n}\n",};
const audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

const inBPM = op.inInt("BPM", 100);
const inStart = op.inTriggerButton("Start");
const inStop = op.inTriggerButton("Stop");
const inReset = op.inTriggerButton("Reset");

const outTriggers = [];
for (let i = 0; i < 7 * 3; i += 1)
{
    const noteValue = Math.pow(2, i % 7);
    let string = "1/" + noteValue;
    if (i > 6 && i < 14)
    {
        string = "1/" + noteValue + " Triplet";
    }
    else if (i > 13)
    {
        string = "1/" + noteValue + " Dotted";
    }
    outTriggers[i] = op.outTrigger(string + " Note Trigger");
}

const outRunning = op.outBool("Sequencer Running");
const outBPM = op.outNumber("BPM Out");
const outStart = op.outTrigger("Start Out");
const outStop = op.outTrigger("Stop Out");
const outReset = op.outTrigger("Reset Out");

const MIN_BPM = 20;

const NOTE_QUEUE = [];
const LOOKAHEAD_IN_MS = 25.0;
const SCHEDULEAHEAD_IN_S = 0.1;

const MULTIPLIERS = [
    4, 2, 1, 1 / 2, 1 / 4, 1 / 8, 1 / 16,
    8 / 3, 4 / 3, 2 / 3, 1 / 3, 1 / 6, 1 / 12, 1 / 24, // triplet
    6, 3, 3 / 2, 3 / 4, 3 / 8, 3 / 16, 3 / 32 // dotted
];

const MODULO_PER_NOTE = MULTIPLIERS.map((val) => Math.floor(val * 48 / 2));
const TICK_INDEX = 7 * 2 - 1; // 1/64 triplet fastest note
const MAX_ENUMERATOR = 288;
let NOTES_IN_S = [];
let QUARTER_NOTE_S = 60 / inBPM.get();
NOTES_IN_S = MULTIPLIERS.map((multiplier) => multiplier * QUARTER_NOTE_S);
let TICK_S = NOTES_IN_S[TICK_INDEX] / 2;

outBPM.set(inBPM.get());

let resetTickCount = false;
let changeWhileRunning = false;
inBPM.onChange = updateBpm;

let worker = null;
let isPlaying = false;
let currentNote = 0;
let nextNoteTime = null;
let tickCount = 0;
let workerRunning = false;
let waitForSchedule = false;
updateBpm();

function updateBpm()
{
    outBPM.set(inBPM.get());

    if (workerRunning)
    {
        changeWhileRunning = true;
        return;
    }
    QUARTER_NOTE_S = 60 / inBPM.get();
    NOTES_IN_S = MULTIPLIERS.map((multiplier) => multiplier * QUARTER_NOTE_S);
    TICK_S = NOTES_IN_S[TICK_INDEX];
}

function nextNote()
{
    nextNoteTime += TICK_S;
    tickCount = (tickCount + 1) % MAX_ENUMERATOR;
}

function scheduleNote()
{
    if (waitForSchedule)
    { // code block to swallow initial hickup when starting the sequencer
        let compareValue = 8;
        if (inBPM.get() > 140) compareValue = 12;
        if (inBPM.get() > 160) compareValue = 20;
        if (tickCount === compareValue)
        { // half of highest value
            resetTickCount = true;
            waitForSchedule = false;
        }
        else
        {
            return;
        }
    }

    if (resetTickCount)
    {
        tickCount = 0;
        resetTickCount = false;
    }
    for (let i = 0, len = MODULO_PER_NOTE.length; i < len; i += 1)
    {
        if (tickCount % MODULO_PER_NOTE[i] === 0) outTriggers[i].trigger();
    }
}
function startScheduling()
{
    if (changeWhileRunning)
    {
        QUARTER_NOTE_S = 60 / inBPM.get();
        NOTES_IN_S = MULTIPLIERS.map((multiplier) => multiplier * QUARTER_NOTE_S);
        TICK_S = NOTES_IN_S[TICK_INDEX];
        changeWhileRunning = false;
    }
    while (nextNoteTime < audioCtx.currentTime + SCHEDULEAHEAD_IN_S)
    {
        scheduleNote();
        nextNote();
    }
}

inStart.onTriggered = () =>
{
    if (workerRunning) return;

    if (!worker)
    {
        const blob = new Blob([attachments.worker_js], { "type": "text/javascript" });
        const fileURL = URL.createObjectURL(blob);

        worker = new Worker(fileURL, { "name": "ClockSequencer with op-id: " + op.id });
        worker.addEventListener("message", (e) =>
        {
            if (e.data === "tick") startScheduling();
            if (e.data === "stopped") workerRunning = false;
        },
        false);

        nextNoteTime = audioCtx.currentTime;
        /* dummy buffer source for time */
        const audioBuffer = audioCtx.createBufferSource();
        audioBuffer.start(0);
        workerRunning = true;
        tickCount = 0;
        worker.postMessage("start");
        waitForSchedule = true;
        outRunning.set(workerRunning);
    }

    outStart.trigger();
};

inStop.onTriggered = () =>
{
    if (worker)
    {
        worker.postMessage("stop");
        worker.terminate();
        worker = null;
        workerRunning = false;
        outRunning.set(workerRunning);
    }

    outStop.trigger();
};

inReset.onTriggered = () =>
{
    resetTickCount = true;
    outReset.trigger();
};

op.onDelete = () =>
{
    if (!inStart.isLinked())
    {
        if (worker)
        {
            worker.postMessage("stop");
            worker.terminate();
            worker = null;
            workerRunning = false;
        }
    }
};
inStart.onLinkChanged = () =>
{
    if (!inStart.isLinked())
    {
        if (worker)
        {
            worker.postMessage("stop");
            worker.terminate();
            worker = null;
            workerRunning = false;
            outRunning.set(workerRunning);
        }
    }
};


};

Ops.WebAudio.ClockSequencer.prototype = new CABLES.Op();
CABLES.OPS["7994c33f-d4ca-455b-af72-83dcbf5ae83f"]={f:Ops.WebAudio.ClockSequencer,objName:"Ops.WebAudio.ClockSequencer"};




// **************************************************************
// 
// Ops.Array.ArrayReverse
// 
// **************************************************************

Ops.Array.ArrayReverse = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inArr = op.inArray("Input"),
    inActive = op.inBool("Active", true),
    outArr = op.outArray("Result");

inActive.onChange =
inArr.onChange = function ()
{
    let arr = inArr.get();
    if (arr)
    {
        let arrCopy = arr.slice();
        if (inActive.get())arrCopy = arrCopy.reverse();
        outArr.setRef(arrCopy);
    }
};


};

Ops.Array.ArrayReverse.prototype = new CABLES.Op();
CABLES.OPS["88d8662f-2c01-42e6-943d-4d3cf90657b0"]={f:Ops.Array.ArrayReverse,objName:"Ops.Array.ArrayReverse"};




// **************************************************************
// 
// Ops.Array.ArrayMax
// 
// **************************************************************

Ops.Array.ArrayMax = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const inArray = op.inArray("Array In");
const inValue = op.inValue("Value", 1.0);
const outArray = op.outArray("Array Out");

let newArr = [];
outArray.set(newArr);
op.toWorkPortsNeedToBeLinked(inArray);

inValue.onChange = inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let inMax = inValue.get();

    if (newArr.length != arr.length)newArr.length = arr.length;

    let i = 0;
    for (i = 0; i < arr.length; i++)
    {
        newArr[i] = Math.max(arr[i], inMax);
    }
    outArray.setRef(newArr);
};


};

Ops.Array.ArrayMax.prototype = new CABLES.Op();
CABLES.OPS["3bf1ead6-e8d2-43dd-a631-93f7a15fc270"]={f:Ops.Array.ArrayMax,objName:"Ops.Array.ArrayMax"};




// **************************************************************
// 
// Ops.Ui.VizNumber
// 
// **************************************************************

Ops.Ui.VizNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const inNum = op.inFloat("Number", 0);
const outNum = op.outNumber("Result");

op.setUiAttrib({ "widthOnlyGrow": true });

inNum.onChange = update;

update();

function update()
{
    let n = inNum.get();
    if (op.patch.isEditorMode())
    {
        let str = "";
        if (n === null)str = "null";
        else if (n === undefined)str = "undefined";
        else
        {
            str = "" + Math.round(n * 10000) / 10000;

            if (str[0] != "-")str = " " + str;
        }

        op.setUiAttribs({ "extendTitle": str });
    }

    outNum.set(n);
}


};

Ops.Ui.VizNumber.prototype = new CABLES.Op();
CABLES.OPS["2b60d12d-2884-4ad0-bda4-0caeb6882f5c"]={f:Ops.Ui.VizNumber,objName:"Ops.Ui.VizNumber"};




// **************************************************************
// 
// Ops.Gl.InteractiveRectangle_v2
// 
// **************************************************************

Ops.Gl.InteractiveRectangle_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("Trigger in"),
    trigger = op.outTrigger("Trigger out"),
    width = op.inValue("Width", 1),
    height = op.inValue("Height", 1),
    inId = op.inString("ID"),
    classPort = op.inString("Class"),
    pivotX = op.inValueSelect("Pivot x", ["center", "left", "right"]),
    pivotY = op.inValueSelect("Pivot y", ["center", "top", "bottom"]),
    axis = op.inValueSelect("Axis", ["xy", "xz"]),
    isInteractive = op.inValueBool("Is Interactive", true),
    renderRect = op.inValueBool("Render Rectangle", true),
    divVisible = op.inValueBool("Show Boundings", true),
    cursorPort = op.inValueSelect("Cursor", ["auto", "crosshair", "pointer", "Hand", "move", "n-resize", "ne-resize", "e-resize", "se-resize", "s-resize", "sw-resize", "w-resize", "nw-resize", "text", "wait", "help", "none"], "pointer"),
    active = op.inValueBool("Render", true);

const geomOut = op.outObject("geometry");
geomOut.ignoreValueSerialize = true;

const
    mouseOver = op.outBoolNum("Pointer Hover", false),
    mouseDown = op.outBoolNum("Pointer Down", false),
    outX = op.outNumber("Pointer X"),
    outY = op.outNumber("Pointer Y"),
    outTop = op.outNumber("Top"),
    outLeft = op.outNumber("Left"),
    outRight = op.outNumber("Right"),
    outBottom = op.outNumber("Bottom"),
    mouseClick = op.outTrigger("Left Click");

const elementPort = op.outObject("Dom Element");

active.setUiAttribs({ "title": "Active" });

const cgl = op.patch.cgl;
axis.set("xy");
pivotX.set("center");
pivotY.set("center");

const geom = new CGL.Geometry(op.name);
let mesh = null;
let div = null;
const m = mat4.create();
const trans = mat4.create();
const pos = vec3.create();
const divAlign = vec3.create();
const divAlignSize = vec3.create();

axis.onChange = rebuild;
pivotX.onChange = rebuild;
pivotY.onChange = rebuild;
width.onChange = rebuild;
height.onChange = rebuild;
cursorPort.onChange = updateCursor;
rebuild();

const modelMatrix = mat4.create();
const identViewMatrix = mat4.create();
const zeroVec3 = vec3.create();

render.onTriggered = function ()
{
    if (!div)
    {
        setUpDiv();
        addListeners();
        updateDivVisibility();
        updateIsInteractive();
    }
    updateDivSize();

    if (active.get() && renderRect.get() && mesh) mesh.render(cgl.getShader());

    trigger.trigger();
};

function rebuild()
{
    let w = width.get();
    let h = height.get();
    let x = 0;
    let y = 0;

    if (typeof w == "string")w = parseFloat(w);
    if (typeof h == "string")h = parseFloat(h);

    if (pivotX.get() == "center")
    {
        x = 0;
        divAlign[0] = -w / 2;
    }
    if (pivotX.get() == "right")
    {
        x = -w / 2;
    }
    if (pivotX.get() == "left")
    {
        x = w / 2;
    }

    if (pivotY.get() == "center")
    {
        y = 0;
        divAlign[1] = -h / 2;
    }
    if (pivotY.get() == "top") y = -h / 2;
    if (pivotY.get() == "bottom") y = +h / 2;

    const verts = [];
    const tc = [];
    const norms = [];
    const indices = [];

    const numRows = 1;
    const numColumns = 1;

    const stepColumn = w / numColumns;
    const stepRow = h / numRows;

    let c, r;

    for (r = 0; r <= numRows; r++)
    {
        for (c = 0; c <= numColumns; c++)
        {
            verts.push(c * stepColumn - width.get() / 2 + x);
            if (axis.get() == "xz") verts.push(0.0);
            verts.push(r * stepRow - height.get() / 2 + y);
            if (axis.get() == "xy") verts.push(0.0);

            tc.push(c / numColumns);
            tc.push(1.0 - r / numRows);

            if (axis.get() == "xz")
            {
                norms.push(0);
                norms.push(1);
                norms.push(0);
            }

            if (axis.get() == "xy")
            {
                norms.push(0);
                norms.push(0);
                norms.push(-1);
            }
        }
    }

    for (c = 0; c < numColumns; c++)
    {
        for (r = 0; r < numRows; r++)
        {
            const ind = c + (numColumns + 1) * r;
            const v1 = ind;
            const v2 = ind + 1;
            const v3 = ind + numColumns + 1;
            const v4 = ind + 1 + numColumns + 1;

            indices.push(v1);
            indices.push(v3);
            indices.push(v2);

            indices.push(v2);
            indices.push(v3);
            indices.push(v4);
        }
    }

    geom.clear();
    geom.vertices = verts;
    geom.texCoords = tc;
    geom.verticesIndices = indices;
    geom.vertexNormals = norms;

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);

    geomOut.set(null);
    geomOut.set(geom);
}

let divX = 0;
let divY = 0;
let divWidth = 0;
let divHeight = 0;

const mMatrix = mat4.create();
divVisible.onChange = updateDivVisibility;
inId.onChange = updateId;
classPort.onChange = updateClassNames;

function updateDivVisibility()
{
    if (div)
    {
        if (divVisible.get()) div.style.border = "1px solid red";
        else div.style.border = "none";
    }
}

function updateCursor()
{
    if (div)
    {
        div.style.cursor = cursorPort.get();
    }
}

function updateId()
{
    if (div)
    {
        div.setAttribute("id", inId.get());
    }
}

function updateDivSize()
{
    // var vp=cgl.getViewPort();

    mat4.multiply(mMatrix, cgl.vMatrix, cgl.mMatrix);
    vec3.transformMat4(pos, divAlign, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    const top = cgl.canvas.styleMarginTop || 0;
    const left = cgl.canvas.styleMarginLeft || 0;

    const x1 = (trans[0] * cgl.canvasWidth / 2) + cgl.canvasWidth / 2 + left;
    const y1 = (trans[1] * cgl.canvasHeight / 2) + cgl.canvasHeight / 2 + top;

    divAlignSize[0] = divAlign[0] + width.get();
    divAlignSize[1] = divAlign[1];

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    const x2 = ((trans[0] * cgl.canvasWidth / 2) + cgl.canvasWidth / 2) + left;
    const y2 = ((trans[1] * cgl.canvasHeight / 2) + cgl.canvasHeight / 2 + top);

    divAlignSize[0] = divAlign[0];
    divAlignSize[1] = divAlign[1] + height.get();

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    const x3 = ((trans[0] * cgl.canvasWidth / 2) + cgl.canvasWidth / 2) + left;
    const y3 = ((trans[1] * cgl.canvasHeight / 2) + cgl.canvasHeight / 2 + top);

    divAlignSize[0] = divAlign[0] + width.get();
    divAlignSize[1] = divAlign[1] + height.get();

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    const x4 = ((trans[0] * cgl.canvasWidth / 2) + cgl.canvasWidth / 2) + left;
    const y4 = ((trans[1] * cgl.canvasHeight / 2) + cgl.canvasHeight / 2 + top);

    divX = Math.min(x1, x2, x3, x4);
    divY = Math.min(cgl.canvasHeight - y1, cgl.canvasHeight - y2, cgl.canvasHeight - y3, cgl.canvasHeight - y4);

    const xb = Math.max(x1, x2, x3, x4);
    const yb = Math.max(cgl.canvasHeight - y1, cgl.canvasHeight - y2, cgl.canvasHeight - y3, cgl.canvasHeight - y4);

    outTop.set(divY);
    outLeft.set(divX);
    outRight.set(xb);
    outBottom.set(yb);

    divWidth = Math.abs(xb - divX);
    divHeight = Math.abs(yb - divY);

    divX /= op.patch.cgl.pixelDensity;
    divY /= op.patch.cgl.pixelDensity;
    divWidth /= op.patch.cgl.pixelDensity;
    divHeight /= op.patch.cgl.pixelDensity;

    // div.style.left=divX+'px';
    // div.style.top=divY+'px';
    // div.style.width=divWidth+'px';
    // div.style.height=divHeight+'px';

    const divXpx = divX + "px";
    const divYpx = divY + "px";
    const divWidthPx = divWidth + "px";
    const divHeightPx = divHeight + "px";
    if (divXpx != div.style.left) div.style.left = divXpx;
    if (divYpx != div.style.top) div.style.top = divYpx;
    if (div.style.width != divWidthPx) div.style.width = divWidthPx;
    if (div.style.height != divHeightPx) div.style.height = divHeightPx;
}

function updateClassNames()
{
    if (div)
    {
        div.className = classPort.get();
    }
}

op.onDelete = function ()
{
    if (div)div.remove();
};

function setUpDiv()
{
    if (!div)
    {
        div = document.createElement("div");
        div.dataset.op = op.id;
        div.oncontextmenu = function (e)
        {
            e.preventDefault();
        };

        div.style.padding = "0px";
        div.style.position = "absolute";
        div.style["box-sizing"] = "border-box";
        div.style.border = "1px solid red";
        // div.style['border-left']="1px solid blue";
        // div.style['border-top']="1px solid green";
        div.style["z-index"] = "500";

        div.style["-webkit-user-select"] = "none";
        div.style["user-select"] = "none";
        div.style["-webkit-tap-highlight-color"] = "rgba(0,0,0,0)";
        div.style["-webkit-touch-callout"] = "none";

        const canvas = op.patch.cgl.canvas.parentElement;
        canvas.appendChild(div);
        updateCursor();
        updateIsInteractive();
        updateId();
        updateClassNames();
    }
    updateDivSize();
    elementPort.set(div);
}

let listenerElement = null;

function onMouseMove(e)
{
    const offsetX = -width.get() / 2;
    const offsetY = -height.get() / 2;

    outX.set(Math.max(0.0, Math.min(1.0, e.offsetX / divWidth)));
    outY.set(Math.max(0.0, Math.min(1.0, 1.0 - e.offsetY / divHeight)));
}

function onMouseLeave(e)
{
    mouseDown.set(false);
    mouseOver.set(false);
}

function onMouseEnter(e)
{
    mouseOver.set(true);
}

function onMouseDown(e)
{
    mouseDown.set(true);
}

function onMouseUp(e)
{
    mouseDown.set(false);
}

function onmouseclick(e)
{
    mouseClick.trigger();
}

function onTouchMove(e)
{
    const targetEle = document.elementFromPoint(e.targetTouches[0].pageX, e.targetTouches[0].pageY);

    if (targetEle == div)
    {
        mouseOver.set(true);
        if (e.touches && e.touches.length > 0)
        {
            const rect = div.getBoundingClientRect(); // e.target
            const x = e.targetTouches[0].pageX - rect.left;
            const y = e.targetTouches[0].pageY - rect.top;

            const touch = e.touches[0];

            outX.set(Math.max(0.0, Math.min(1.0, x / divWidth)));
            outY.set(Math.max(0.0, Math.min(1.0, 1.0 - y / divHeight)));

            onMouseMove(touch);
        }
    }
    else
    {
        mouseOver.set(false);
    }
}

active.onChange = updateActiveRender;
function updateActiveRender()
{
    if (active.get())
    {
        addListeners();
        if (div) div.style.display = "block";
    }
    else
    {
        removeListeners();
        if (div) div.style.display = "none";
    }
}

isInteractive.onChange = updateIsInteractive;
function updateIsInteractive()
{
    if (isInteractive.get())
    {
        addListeners();
        if (div)div.style["pointer-events"] = "initial";
    }
    else
    {
        removeListeners();
        mouseDown.set(false);
        mouseOver.set(false);
        if (div)div.style["pointer-events"] = "none";
    }
}

function removeListeners()
{
    if (listenerElement)
    {
        document.removeEventListener("touchmove", onTouchMove);
        listenerElement.removeEventListener("touchend", onMouseUp);
        listenerElement.removeEventListener("touchstart", onMouseDown);

        listenerElement.removeEventListener("click", onmouseclick);
        listenerElement.removeEventListener("mousemove", onMouseMove);
        listenerElement.removeEventListener("mouseleave", onMouseLeave);
        listenerElement.removeEventListener("mousedown", onMouseDown);
        listenerElement.removeEventListener("mouseup", onMouseUp);
        listenerElement.removeEventListener("mouseenter", onMouseEnter);
        // listenerElement.removeEventListener('contextmenu', onClickRight);
        listenerElement = null;
    }
}

function addListeners()
{
    if (listenerElement)removeListeners();

    listenerElement = div;

    if (listenerElement)
    {
        document.addEventListener("touchmove", onTouchMove);
        listenerElement.addEventListener("touchend", onMouseUp);
        listenerElement.addEventListener("touchstart", onMouseDown);

        listenerElement.addEventListener("click", onmouseclick);
        listenerElement.addEventListener("mousemove", onMouseMove);
        listenerElement.addEventListener("mouseleave", onMouseLeave);
        listenerElement.addEventListener("mousedown", onMouseDown);
        listenerElement.addEventListener("mouseup", onMouseUp);
        listenerElement.addEventListener("mouseenter", onMouseEnter);
        // listenerElement.addEventListener('contextmenu', onClickRight);
    }
}


};

Ops.Gl.InteractiveRectangle_v2.prototype = new CABLES.Op();
CABLES.OPS["334728ca-60a2-4a42-a059-d9b5f3fe4d32"]={f:Ops.Gl.InteractiveRectangle_v2,objName:"Ops.Gl.InteractiveRectangle_v2"};




// **************************************************************
// 
// Ops.Gl.RenderGeometry_v2
// 
// **************************************************************

Ops.Gl.RenderGeometry_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    geometry = op.inObject("Geometry", null, "geometry"),
    inActive = op.inBool("Render Mesh", true),

    inVertNums = op.inBool("Add Vertex Numbers", true),
    trigger = op.outTrigger("trigger");

op.toWorkPortsNeedToBeLinked(geometry, render);

geometry.ignoreValueSerialize = true;

let mesh = null;
let needsUpdate = true;

geometry.onLinkChanged =
inVertNums.onChange =
    geometry.onChange = () => { needsUpdate = true; };

render.onTriggered = function ()
{
    if (needsUpdate) update();
    if (mesh && inActive.get()) mesh.render(op.patch.cgl.getShader());
    trigger.trigger();
};

function update()
{
    needsUpdate = false;
    const geom = geometry.get();
    if (geom && geom.isGeometry)
    {
        if (mesh)
        {
            mesh.dispose();
            mesh = null;
        }
        if (!mesh)
        {
            mesh = new CGL.Mesh(op.patch.cgl, geom);
            mesh.addVertexNumbers = inVertNums.get();
            mesh.setGeom(geom);
        }
    }
    else
    {
        mesh = null;
    }
}


};

Ops.Gl.RenderGeometry_v2.prototype = new CABLES.Op();
CABLES.OPS["0a9bdb39-8250-460e-8d99-50fe6825d956"]={f:Ops.Gl.RenderGeometry_v2,objName:"Ops.Gl.RenderGeometry_v2"};




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



window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
