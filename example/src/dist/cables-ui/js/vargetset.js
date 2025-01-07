/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/core/constants.js
const CONSTANTS = {
    "ANIM": {
        "EASINGS": [
            "linear",
            "absolute",
            "smoothstep",
            "smootherstep",
            "Cubic In",
            "Cubic Out",
            "Cubic In Out",
            "Expo In",
            "Expo Out",
            "Expo In Out",
            "Sin In",
            "Sin Out",
            "Sin In Out",
            "Quart In",
            "Quart Out",
            "Quart In Out",
            "Quint In",
            "Quint Out",
            "Quint In Out",
            "Back In",
            "Back Out",
            "Back In Out",
            "Elastic In",
            "Elastic Out",
            "Bounce In",
            "Bounce Out",
        ],
        "EASING_LINEAR": 0,
        "EASING_ABSOLUTE": 1,
        "EASING_SMOOTHSTEP": 2,
        "EASING_SMOOTHERSTEP": 3,
        "EASING_CUBICSPLINE": 4,

        "EASING_CUBIC_IN": 5,
        "EASING_CUBIC_OUT": 6,
        "EASING_CUBIC_INOUT": 7,

        "EASING_EXPO_IN": 8,
        "EASING_EXPO_OUT": 9,
        "EASING_EXPO_INOUT": 10,

        "EASING_SIN_IN": 11,
        "EASING_SIN_OUT": 12,
        "EASING_SIN_INOUT": 13,

        "EASING_BACK_IN": 14,
        "EASING_BACK_OUT": 15,
        "EASING_BACK_INOUT": 16,

        "EASING_ELASTIC_IN": 17,
        "EASING_ELASTIC_OUT": 18,

        "EASING_BOUNCE_IN": 19,
        "EASING_BOUNCE_OUT": 21,

        "EASING_QUART_IN": 22,
        "EASING_QUART_OUT": 23,
        "EASING_QUART_INOUT": 24,

        "EASING_QUINT_IN": 25,
        "EASING_QUINT_OUT": 26,
        "EASING_QUINT_INOUT": 27,
    },

    "OP": {
        "OP_PORT_TYPE_VALUE": 0,
        "OP_PORT_TYPE_NUMBER": 0,
        "OP_PORT_TYPE_FUNCTION": 1,
        "OP_PORT_TYPE_TRIGGER": 1,
        "OP_PORT_TYPE_OBJECT": 2,
        "OP_PORT_TYPE_TEXTURE": 2,
        "OP_PORT_TYPE_ARRAY": 3,
        "OP_PORT_TYPE_DYNAMIC": 4,
        "OP_PORT_TYPE_STRING": 5,

        "OP_VERSION_PREFIX": "_v",
    },

    "PORT": {
        "PORT_DIR_IN": 0,
        "PORT_DIR_OUT": 1,
    },

    "PACO": {
        "PACO_CLEAR": 0,
        "PACO_VALUECHANGE": 1,
        "PACO_OP_DELETE": 2,
        "PACO_UNLINK": 3,
        "PACO_LINK": 4,
        "PACO_LOAD": 5,
        "PACO_OP_CREATE": 6,
        "PACO_OP_ENABLE": 7,
        "PACO_OP_DISABLE": 8,
        "PACO_UIATTRIBS": 9,
        "PACO_VARIABLES": 10,
        "PACO_TRIGGERS": 11,
        "PACO_PORT_SETVARIABLE": 12,
        "PACO_PORT_SETANIMATED": 13,
        "PACO_PORT_ANIM_UPDATED": 14,
        "PACO_DESERIALIZE": 15,
        "PACO_OP_RELOAD": 16
    },
};

;// CONCATENATED MODULE: ./src/libs/cables/vargetset.js


const VarSetOpWrapper = class
{
    constructor(op, type, valuePort, varNamePort, triggerPort, nextPort)
    {
        this._valuePort = valuePort;
        this._varNamePort = varNamePort;
        this._op = op;
        this._type = type;
        this._typeId = -1;
        this._triggerPort = triggerPort;
        this._nextPort = nextPort;

        this._btnCreate = op.inTriggerButton("Create new variable");
        this._btnCreate.setUiAttribs({ "hidePort": true });
        this._btnCreate.onTriggered = this._createVar.bind(this);

        this._helper = op.inUiTriggerButtons("", ["Rename"]);
        this._helper.setUiAttribs({ "hidePort": true });
        this._helper.onTriggered = (which) => { if (which == "Rename") CABLES.CMD.PATCH.renameVariable(op.varName.get()); };

        this._op.setPortGroup("Variable", [this._helper, this._varNamePort, this._btnCreate]);

        this._op.on("uiParamPanel", this._updateVarNamesDropdown.bind(this));

        // this._op.patch.addEventListener("variableDeleted", this._updateVarNamesDropdown.bind(this));
        this._op.patch.addEventListener("variablesChanged", this._updateName.bind(this));
        this._op.patch.addEventListener("variableRename", this._renameVar.bind(this));

        this._varNamePort.onChange = this._updateName.bind(this);

        this._isTexture = this._valuePort.uiAttribs.objType === "texture";

        this._valuePort.changeAlways = true;

        if (this._triggerPort)
        {
            this._triggerPort.onTriggered = () =>
            {
                this._setVarValue(true);
            };
        }
        else
        {
            this._valuePort.onChange = this._setVarValue.bind(this);
        }


        this._op.init = () =>
        {
            this._updateName();
            if (!this._triggerPort) this._setVarValue();
            this._updateErrorUi();
        };

        if (type == "array") this._typeId = CONSTANTS.OP.OP_PORT_TYPE_ARRAY;
        else if (type == "object") this._typeId = CONSTANTS.OP.OP_PORT_TYPE_OBJECT;
        else if (type == "string") this._typeId = CONSTANTS.OP.OP_PORT_TYPE_STRING;
        else if (type == "texture") this._typeId = CONSTANTS.OP.OP_PORT_TYPE_TEXTURE;
        else this._typeId = CONSTANTS.OP.OP_PORT_TYPE_VALUE;
    }

    _updateErrorUi()
    {
        if (CABLES.UI)
        {
            if (!this._varNamePort.get()) this._op.setUiError("novarname", "no variable selected");
            else
            {
                if (this._op.hasUiErrors)
                {
                    this._op.setUiError("novarname", null);
                }
            }
        }
    }

    _updateName()
    {
        const varname = this._varNamePort.get();
        this._op.setTitle("var set");
        this._op.setUiAttrib({ "extendTitle": "#" + varname });

        this._updateErrorUi();

        const vari = this._op.patch.getVar(varname);
        if (vari && !vari.type) vari.type = this._type;

        if (!this._op.patch.hasVar(varname) && varname != 0 && !this._triggerPort)
        {
            this._setVarValue(); // this should not be done!!!, its kept because of compatibility anxiety
        }
        if (!this._op.patch.hasVar(varname) && varname != 0 && this._triggerPort)
        {
            if (this._type == "string") this._op.patch.setVarValue(varname, "");
            else if (this._type == "number") this._op.patch.setVarValue(varname, "");
            else this._op.patch.setVarValue(varname, null);
        }

        if (this._op.isCurrentUiOp())
        {
            this._updateVarNamesDropdown();
            this._op.refreshParams();
        }
        this._updateDisplay();
        this._op.patch.emitEvent("opVariableNameChanged", this._op, this._varNamePort.get());
    }

    _createVar()
    {
        CABLES.CMD.PATCH.createVariable(this._op, this._type, () => { this._updateName(); });
    }

    _updateDisplay()
    {
        this._valuePort.setUiAttribs({ "greyout": !this._varNamePort.get() });
    }

    _updateVarNamesDropdown()
    {
        if (CABLES.UI && CABLES.UI.loaded && CABLES.UI.loaded)
        {
            const perf = CABLES.UI.uiProfiler.start("[vars] _updateVarNamesDropdown");

            const varnames = [];
            const vars = this._op.patch.getVars();
            for (const i in vars) if (vars[i].type == this._type && i != "0") varnames.push(i);
            this._varNamePort.uiAttribs.values = varnames;

            perf.finish();
        }
    }

    _renameVar(oldname, newname)
    {
        if (oldname != this._varNamePort.get()) return;
        this._varNamePort.set(newname);
        this._updateName();
    }

    _setVarValue(triggered)
    {
        const name = this._varNamePort.get();

        if (!name) return;

        const v = this._valuePort.get();

        if (this._typeId == CONSTANTS.OP.OP_PORT_TYPE_VALUE || this._typeId == CONSTANTS.OP.OP_PORT_TYPE_STRING)
        {
            this._op.patch.setVarValue(name, v);
        }
        else
        if (this._typeId == CONSTANTS.OP.OP_PORT_TYPE_ARRAY)
        {
            this._arr = [];
            CABLES.copyArray(v, this._arr);
            // this._op.patch.setVarValue(name, null);
            this._op.patch.setVarValue(name, this._arr);
        }
        else
        {
            if (this._typeId == CONSTANTS.OP.OP_PORT_TYPE_OBJECT)
            {
                if (this._isTexture)
                    this._op.patch.setVarValue(name, CGL.Texture.getEmptyTexture(this._op.patch.cgl));
                else
                    this._op.patch.setVarValue(name, null);

                if (v && v.tex && v._cgl && !this._isTexture) this._op.setUiError("texobj", "Dont use object variables for textures, use varSetTexture");
                else this._op.setUiError("texobj", null);
            }
            this._op.patch.setVarValue(name, v);
        }

        if (triggered && this._nextPort) this._nextPort.trigger();
    }
};

const VarGetOpWrapper = class
{
    constructor(op, type, varnamePort, valueOutPort)
    {
        this._op = op;
        this._type = type;
        this._varnamePort = varnamePort;
        this._variable = null;
        this._valueOutPort = valueOutPort;
        this._listenerId = null;

        this._op.on("uiParamPanel", this._updateVarNamesDropdown.bind(this));
        this._op.on("uiErrorChange", this._updateTitle.bind(this));

        this._op.patch.on("variableRename", this._renameVar.bind(this));
        this._op.patch.on("variableDeleted", (oldname) =>
        {
            if (this._op.isCurrentUiOp()) this._op.refreshParams();
        });

        this._varnamePort.onChange = this._changeVar.bind(this);
        this._op.patch.addEventListener("variablesChanged", this._init.bind(this));

        this._op.onDelete = () =>
        {
            if (this._variable && this._listenerId) this._variable.off(this._listenerId);
        };

        this._op.init = () =>
        {
            this._init();
        };
    }

    get variable()
    {
        return this._variable;
    }

    _changeVar()
    {
        if (this._variable && this._listenerId)
        {
            this._variable.off(this._listenerId);
        }
        this._init();
    }

    _renameVar(oldname, newname)
    {
        if (oldname != this._varnamePort.get()) return;
        this._varnamePort.set(newname);
        this._updateVarNamesDropdown();
        this._updateTitle();
        this._listenerId = this._variable.on("change", this._setValueOut.bind(this));
    }

    _updateVarNamesDropdown()
    {
        if (CABLES.UI && CABLES.UI.loaded)
        {
            const varnames = [];
            const vars = this._op.patch.getVars();

            for (const i in vars)
                if (vars[i].type == this._type && i != "0")
                    varnames.push(i);

            this._op.varName.uiAttribs.values = varnames;
        }
    }

    _setValueOut(v)
    {
        if (this._valueOutPort)
            if (this._typeId == CONSTANTS.OP.OP_PORT_TYPE_ARRAY && this._typeId == CONSTANTS.OP.OP_PORT_TYPE_OBJECT)
                this._valueOutPort.setRef(v);
            else
                this._valueOutPort.set(v);
    }

    _updateTitle()
    {
        if (this._variable)
        {
            this._op.setUiError("unknownvar", null);
            this._op.setTitle("var get");
            this._op.setUiAttrib({ "extendTitle": "#" + this._varnamePort.get() });
            if (this._valueOutPort) this._valueOutPort.set(this._variable.getValue());
        }
        else
        {
            this._op.setUiError("unknownvar", "unknown variable! - there is no setVariable with this name (" + this._varnamePort.get() + ")");
            this._op.setUiAttrib({ "extendTitle": "#invalid" });
            if (this._valueOutPort) this._valueOutPort.set(0);
        }
    }

    _init()
    {
        this._updateVarNamesDropdown();

        if (this._variable && this._listenerId) this._variable.off(this._listenerId);
        this._variable = this._op.patch.getVar(this._op.varName.get());
        if (this._variable) this._listenerId = this._variable.on("change", this._setValueOut.bind(this));

        this._updateTitle();

        this._op.patch.emitEvent("opVariableNameChanged", this._op, this._varnamePort.get());
    }
};

CABLES.VarSetOpWrapper = VarSetOpWrapper;
CABLES.VarGetOpWrapper = VarGetOpWrapper;

((this.CABLES = this.CABLES || {}).COREMODULES = this.CABLES.COREMODULES || {}).Vargetset = __webpack_exports__.Cables;
/******/ })()
;