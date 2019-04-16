/**
 * Created by zhou_ on 2018-02-06.
 */
var floatCalUtil = function() {
    var util = {};
    /**
     * 拆解参数的整数部分和小数部分
     * @param floatNumber
     * @returns {{nonRadixPointValue: number, negative: boolean, intPart: string, floatPart: string, float: number, int: number, digit: number}}
     */
    util.parseNumberBody = function (floatNumber) {
        var number = Number(floatNumber);
        if (typeof number != "number" || parseFloat(number).toString() == "NaN")
            throw "argument must be number";
        if (number < Number.MIN_SAFE_INTEGER || number > Number.MAX_SAFE_INTEGER)
            throw "argument must be between -9007199254740991 and 9007199254740991";

        var s = /^(-?\d+)(\.\d+)?$/.exec(number),
            n = Number(s[1]),
            fp = s[2]==undefined?"0":s[2],
            fs = fp.substr(1);
        var ret = {
            value: number,
            intPart: s[1],
            floatPart: fs,
            int: n,
            float: Number(number>=0?fp:"-"+fp),
            floatToInt: Number(fs==""?"0":fs),
            digit: fs.length,
            negative: number > 0,
            nonRadixPointValue: Number(s[0].replace(/\./, ""))
        };
        return ret;
    };

    /**
     * 加法函数，用来得到精确的加法结果
     * 说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
     * @param arg1
     * @param arg2
     * @returns {number} arg1加上arg2的精确结果
     */
    util.add = function (arg1, arg2) {
        var a = util.parseNumberBody(arg1),
            b = util.parseNumberBody(arg2),
            fl = Math.max(a.digit, b.digit),
            aba = Math.abs(a.value),
            abb = Math.abs(b.value),
            symbolBit = aba > abb ? a.negative : b.negative, // 符号位
            floatNegBit = a.float + b.float > 0, // 浮点正负位
            borrowBit = false, // 浮点借位
            fa = a.floatToInt * Math.pow(10, fl - a.digit),
            fb = b.floatToInt * Math.pow(10, fl - b.digit),
            f = a.negative == b.negative ? fa + fb : fa < fb && aba > abb
                        ? (borrowBit = true, Math.pow(10, fl) + fa - fb) : fa > fb && aba < abb
                        ? (borrowBit = true, Math.pow(10, fl) - fa + fb) : fa != 0 && fb != 0
                        ? Math.abs(fa - fb) : Math.max(fa, fb),
            fs = f.toString(),
            overflowBit = a.negative == b.negative && fs.length > fl && f != 0, // 浮点溢出位
            ft = Array(fl - fs.length + 1).join("0") + fs;
        var result = (symbolBit?"":"-")+(Math.abs(a.int + b.int + (borrowBit || overflowBit ? (floatNegBit?1:-1) : 0))).toString() + "." + (overflowBit ? ft.substr(1) : ft);
        result = Number(result); //.replace(/^-0(.0+)?$/, "0"))
        if (result < Number.MIN_SAFE_INTEGER || result > Number.MAX_SAFE_INTEGER) {
            throw "result is not precise";
        }
        return result;
    };

    /**
     * 减法函数，用来得到精确的加法结果
     * 说明：javascript的减法结果会有误差，在两个浮点数相减的时候会比较明显。这个函数返回较为精确的加法结果。
     * @param arg1
     * @param arg2
     * @returns {number} arg1减去arg2的精确结果
     */
    util.sub = function (arg1, arg2) {
        return util.add(arg1, -arg2);
    };

    /**
     * 乘法函数，用来得到精确的乘法结果
     * 说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。
     * @param arg1
     * @param arg2
     * @returns {number} arg1乘以arg2的精确结果
     */
    util.mul = function (arg1, arg2) {
        var a = util.parseNumberBody(arg1),
            b = util.parseNumberBody(arg2),
            // 取适配数为10的N次方，N为两个加数的小数位数之和
            adapterNum = Math.pow(10, a.digit + b.digit);
        var result = a.nonRadixPointValue * b.nonRadixPointValue / adapterNum;
        if (result < Number.MIN_SAFE_INTEGER || result > Number.MAX_SAFE_INTEGER) {
            throw "result is not precise";
        }
        return result;
    };

    /**
     *  除法函数，用来得到精确的除法结果
     *  javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。
     * @param arg1
     * @param arg2
     * @returns {number} arg1除以arg2的精确结果
     */
    util.div = function (arg1, arg2) {
        var a = util.parseNumberBody(arg1);
        if (typeof arg2 != "number" || parseFloat(arg2).toString() == "NaN" || arg2 == 0)
            throw "argument must be number and none-zero";
        var b = util.parseNumberBody(arg2),
            // 取适配数为10的N次方，N为除数小数位数减去被除数小数位之差
            adapterNum = Math.pow(10, b.digit - a.digit);
        var result = util.mul(a.nonRadixPointValue / b.nonRadixPointValue, adapterNum);
        if (result < Number.MIN_SAFE_INTEGER || result > Number.MAX_SAFE_INTEGER) {
            throw "result is not precise";
        }
        return result;
    };

    /**
     * 四舍五入
     * 重写toFixed，浏览器之间遇5进位判断混乱，部分浏览器下toFixed遇5不进位(比如2.55 toFixed(1) 为2.5)，部分遇5进位
     * @param floatNumber 被格式化的浮点数
     * @param retainDigits 保留小数的位数，参数默认值为0，必须为正整数或不传
     * @param meet5carry 是否遇5进位的逻辑，参数默认值为true，必须为布尔值或不传
     * @returns {number}
     */
    util.toFixed = function(floatNumber, retainDigits, meet5carry) {
        var number = Number(floatNumber);
        if (typeof number != "number" || parseFloat(number).toString() == "NaN")
            throw "argument must be number";
        if ((typeof retainDigits != "number" || !/^(?!0)\d+$/.test(retainDigits) || parseFloat(retainDigits).toString() == "NaN") && undefined!==retainDigits)
            throw "first argument (retainDigits) must be a positive integer or not passed in";
        if (!(number > Number.MIN_SAFE_INTEGER && number < Number.MAX_SAFE_INTEGER))
            throw "first argument must be between -9007199254740991 and 9007199254740991";
        if (typeof meet5carry != "boolean" && undefined !== meet5carry)
            throw "second argument (meet5carry) must be boolean or not passed in";

        retainDigits = undefined===retainDigits ? 0 : retainDigits;
        meet5carry = undefined===meet5carry ? true : meet5carry; // 默认遇5进位
        if (number.toString().indexOf(".") > -1) {
            // 用正则提取数字的整数、保留小数、和是否进位依据
            return Number(number.toString().replace(new RegExp("(\\d+)\\.(\\d{" + retainDigits + "})(\\d?)\\d*"), function(match,pattern1,pattern2,pattern3,index) {
                return (Number(pattern1+pattern2) + (Number(pattern3)>4&&(meet5carry||Number(pattern3)>5) ? 1 : 0)) / Math.pow(10,pattern2.length);
            }));
        } else return number;
    };

    return util;
}();

Number.prototype.add = function (arg) {
    return floatCalUtil.add(this, arg);
};
Number.prototype.sub = function (arg) {
    return floatCalUtil.sub(this, arg);
};
Number.prototype.mul = function (arg) {
    return floatCalUtil.mul(this, arg);
};
Number.prototype.div = function (arg) {
    return floatCalUtil.div(this, arg);
};
Number.prototype.toFixed = function (retainDigits, meet5carry) {
    return floatCalUtil.toFixed(this, retainDigits, meet5carry);
};

// 隐藏不必要的展示属性，不被for枚举
Object.defineProperties(Number.prototype, {
    "add":{enumerable:false},
    "sub":{enumerable:false},
    "mul":{enumerable:false},
    "div":{enumerable:false},
    "toFixed":{enumerable:false}
});
