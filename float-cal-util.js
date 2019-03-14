// 加法
Number.prototype.add = function(num) {
    if (typeof num != "number" && parseFloat(num).toString() == "NaN") throw "argument must be number";
    var a = this.toString(), // 取数字的字符串
        b = num.toString(),
        // 取适配数为10的N次方，N为两个加数的小数位数较大数
        adapterNum = Math.pow(10, Math.max(a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0, b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0));
    return (this.multiply(adapterNum) + num.multiply(adapterNum)) / adapterNum;
}

// 减法
Number.prototype.minus = function(num) {
    return this.add(-num);
}

// 乘法
Number.prototype.multiply = function(num) {
    if (typeof num != "number" && parseFloat(num).toString() == "NaN") throw "argument must be number";
    var a = this.toString(), // 取数字的字符串
        b = num.toString(),
        // 取适配数为10的N次方，N为两个加数的小数位数之和
        adapterNum = Math.pow(10, (a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0) + (b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0));
    return Number(a.replace(/\./g,"")) * Number(b.replace(/\./g,"")) / adapterNum;
}

// 除法
Number.prototype.divide = function(num) {
    if (typeof num != "number" && parseFloat(num).toString() == "NaN" || num == 0) throw "argument must be number and none-zero";
    var a = this.toString(), // 取数字的字符串
        b = num.toString(),
        // 取适配数为10的N次方，N为两个加数的小数位数之差的绝对值
        sub = (a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0) - (b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0),
        adapterNum = Math.pow(10, Math.abs(sub)),
        // 整数除结果
        r = Number(a.replace(/\./g,"")) / Number(b.replace(/\./g,""));
    return sub>0 ? r / adapterNum : r * adapterNum;
}

// 四舍五入
// 重写toFixed，浏览器之间遇5进位判断混乱，部分浏览器下toFixed遇5不进位(比如2.55 toFixed(1) 为2.5)，部分遇5进位
// retainDigits:  保留小数的位数
// meet5carry:  是否遇5进位，参数默认值为true，逻辑为遇5进位
Number.prototype.toFixed = function(retainDigits, meet5carry) {
    if (typeof retainDigits != "number" && parseFloat(retainDigits).toString() == "NaN" || retainDigits < 0) throw "first argument (retainDigits) must be number and positive";
    if (typeof meet5carry != "boolean" && undefined !== meet5carry) throw "second argument (meet5carry) must be boolean or not passed in";
    meet5carry = undefined===meet5carry ? true : meet5carry; // 默认遇5进位
    if (this.toString().indexOf(".") > -1) {
        // 用正则提取数字的整数、小数、和是否进位依据部分
        return Number(this.toString().replace(new RegExp("(\\d+)\\.(\\d{" + retainDigits + "})(\\d?)\\d*"), function(match,pattern1,pattern2,pattern3,index) {
            return (Number(pattern1+pattern2) + (Number(pattern3)>4&&(meet5carry||Number(pattern3)>5) ? 1 : 0)) / Math.pow(10,pattern2.length);
        }));
    } else return this;
}

// 隐藏不必要的展示属性，不被for枚举
Object.defineProperties(Number.prototype, {
    "add":{enumerable:false},
    "minus":{enumerable:false},
    "multiply":{enumerable:false},
    "divide":{enumerable:false},
    "toFixed":{enumerable:false}
});