module.exports = Bool;

function Bool(bool) {
    if (this instanceof Bool) {
        Boolean.call(this,bool);
    }
    else {
        if (x.decode !== undefined) {
            return decodeBool(x);
        }
        else {
            return new Bool(bool);
        }
    }
}

Bool.prototype = Object.create(
    Boolean.prototype,
    {
        toString: {
            value : function () { return Boolean(x).toString(); },
            enumerable : true
        },
        encoding: {
            value : encodingBool,
            enumerable : true
        },
        toJSON: {
            value : function () { return this.toString(); },
            enumerable: true
        },
        isFixed : {
            value: true,
            enumerable: true
        }
    }
);
Bool.prototype.constructor = Bool;
Object.defineProperties(Bool.prototype, {constructor : {enumerable : false}});

function encodingBool() {
    var result = this ? "01" : "00";
    for (var i = 0; i < 31; ++i) {
        result = "00" + result;
    }
    return result;
}

function decodingBool(x) {
    var result = new Bool(x.slice(0,64)[-1] === '1');
    Object.defineProperties(result, {
        decodeTail : {
            value : x.slice(64),
            enumerable : false
        }
    });
    return result;    
}
