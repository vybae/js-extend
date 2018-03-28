Number.prototype.add = function(num) {
    if (typeof num != "number" && parseFloat(num).toString() == "NaN") throw "argument must be number";
    var a = this.toString(), // 取数字的字符串
        b = num.toString(),
        // 取适配数为10的N次方，N为两个加数的小数位数较大数
        adapterNum = Math.pow(10, Math.max(a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0, b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0));
    return (this.mul(adapterNum) + num.mul(adapterNum)) / adapterNum;
}

Number.prototype.sub = function(num) {
    return this.add(-num);
}

Number.prototype.mul = function(num) {
    if (typeof num != "number" && parseFloat(num).toString() == "NaN") throw "argument must be number";
    var a = this.toString(), // 取数字的字符串
        b = num.toString(),
        // 取适配数为10的N次方，N为两个加数的小数位数之和
        adapterNum = Math.pow(10, (a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0) + (b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0));
    return Number(a.replace(/\./g,"")) * Number(b.replace(/\./g,"")) / adapterNum;
}

Number.prototype.div = function(num) {
    if (typeof num != "number" && parseFloat(num).toString() == "NaN" || num == 0) throw "argument must be number and none-zero";
    var a = this.toString(), // 取数字的字符串
        b = num.toString(),
        // 取适配数为10的N次方，N为两个加数的小数位数之差的绝对值
        sub = (a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0)-(b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0),
        adapterNum = Math.pow(10, Math.abs(sub)),
        // 整数除结果
        r = Number(a.replace(/\./g,"")) / Number(b.replace(/\./g,""));
    return sub > 0 ? r / adapterNum : r * adapterNum;
}
// 重写toFixed，某些浏览器下toFixed四舍五入遇5不进位(比如2.55 toFixed(1) 为2.5)
Number.prototype.toFixed = function(len) {
    if (typeof len != "number" && parseFloat(len).toString() == "NaN" || len < 0) throw "argument must be number and positive";
    if (this.toString().indexOf(".") > -1) {
	// 用正则提取数字的整数、小数、和是否进位依据部分
	return Number(this.toString().replace(new RegExp("(\\d+)\\.(\\d{"+len+"})(\\d?)\\d*"), function(match,pattern1,pattern2,pattern3,index) {
	    return (Number(pattern1+pattern2)+(Number(pattern3)>4?1:0))/Math.pow(10,pattern2.length);
	}));
    } else return this;
}
Object.defineProperties(Number.prototype, {
    "add":{enumerable:false},
    "sub":{enumerable:false},
    "mul":{enumerable:false},
    "div":{enumerable:false},
    "toFixed":{enumerable:false}
});