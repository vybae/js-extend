/**
 * version 1.5
 * javascript链式触发器
 * 动态监听json对象，为json对象提供事件的链式触发功能，当值改变时依次执行json对象关联的所有对象的执行规则
 * v1.0 根据指定计算规则动态改变存在链式关系的数据值
 * v1.1 新增支持递归关系
 * v1.2 新增常用函数类库, 优化调用方式
 * v1.3 新增支持动态更改触发事件, 修正获取匹配规则的方式, 改为引用型比较
 *      新增支持动态追加和删除关联节点
 *      新增字符串化json对象的函数stringify, 由于LinkExecVal并不按默认属性输出, 而是直接输出值, 故不使用JSON.stringify
 * v1.4 兼容ie9-11
 *      新增执行规则的调用函数体定义方式, 可直接传入函数(需注意函数内引用外部变量作用域的问题,若对此不熟悉, 建议还是用字符串的方式调用)
 *      优化代码可读性
 * v1.5 简化节点的属性规则的声明，改为json格式，调整了代码结构
 * ******************************
 * 注意：不要取与LinkExecVal类型包含的字段重名 (value,__linkElements,__rule,__root,__parent,setRule,setLinkElements,exec,add,sub,mul,div)
 * 内置变量：root 为根节点 parent为父节点
 *
 * 例1  ----
 * 要达到效果sum 会根据a和b的和自动变化，sum = a + b
 * 代码：
    var test1 = linkTrigger.init({a:1,b:2,sum:3,sum2:4}, 
    // property为触发节点名称
    // relatedProps为本节点所关联的触发节点，参数用关联节点名称的字符串，多个关联节点用字符串数组即可
    // rule为被触发的执行规则，可用字符串或函数，函数为参数时需要注意内部引用外部变量作用域的问题
    [{property:"a",relatedProps:"sum"},
    {property:"b",relatedProps:"sum"},
    // 字符串的回调方式
    {property:"sum",rule:"parent.sum = parent.a.add(parent.b);console.log('test1.sum='+parent.sum.value);"},
    // 函数的回调方式
    {property:"sum2",rule:function(parent, root) {parent.sum2 = parent.a.add(parent.b);console.log('test1.sum2='+parent.sum2.value);}}
    ]);
   test1.a = 3  //改变test.a的值
 * 控制台输出结果:  test1.sum=5
 * （注意，之所以没有输出sum2，是因为a和b节点并没有和sum2节点关联上，需要显示的在第二个参数指定，
 *   比如想要在初始化后在改变a节点的值时就能同时触发sum1和sum2的执行规则的话，传入["sum","sum2"]即可
 *  ）
   // 改变关联节点会触发执行规则，由于当时需求需要，所以是触发所有关联节点的执行规则
   // 各位可以自行更改为只触发新增的节点，在PropertyListenerProxy中对名为__linkElements的属性进行判断、特殊处理即可
   test1.a.addLinkElement(test1.sum2)
 * 控制台输出结果:   test1.sum=5
 *              test1.sum2=5
   // 删除关联节点后，被删除节点不再触发规则，遗留的关联节点依旧会触发执行规则
   test1.a.delLinkElement(test1.sum)
 * 控制台输出结果:  test1.sum2=5
 *
 * 例2  ----
 * 在例1的基础上引入递归关系，要达到效果
 *     数据结构 {
 *        args: {
 *          a:1,b:1,c:3,d:1
 *        },
 *        factor1:2,factor2:1,result:4
 *     }
 *      factor1 会根据a和b的和自动变化，factor1=a+b，
 *      factor2 会根据c和d的差自动变化，factor2=c-d，
 *      result  会根据factor1为底数、factor2为指数的指数运算结果自动变化  result = Math.pow(factor1, factor2)
 *  代码：
    var test2 = linkTrigger.init({
         args: {
          a:1,b:1,c:3,d:1
        },
        factor1:2,factor2:2,result:4
     }, [
    {property:"args.a",relatedProps:"factor1"},
    {property:"args.b",relatedProps:"factor1"},
    {property:"factor1",relatedProps:"result",rule:function(parent,root){parent.factor1=parent.args.a.add(parent.args.b);}},
    {property:"args.c",relatedProps:"factor2"},
    {property:"args.d",relatedProps:"factor2"},
    {property:"factor2",relatedProps:"result",rule:"parent.factor2=parent.args.c.sub(parent.args.d);"},
    {property:"result",rule:function(parent,root){parent.result = Math.pow(parent.factor1.value,parent.factor2.value);
    console.log('test2.result='+parent.result.value);}}
    ]);
   test2.args.a = 2  // 改变test.a的值
 * 控制台输出结果:  test2.result=9
   // 删除factor1的关联节点
   test2.factor1.delLinkElement(test2.result)
   test2.args.a = 3
 * 控制台没有输出打印，原因： factor1和result的关联关系已经不存在了，所以无法触发result的执行规则
   test2.args.c = 4
 * 控制台输出结果:  test2.result=64   注意了，为什么是result是64，虽然上一句js语句没有触发结果，但是a和factor1的关系还在，所以factor1的值是变成了4的
 *
 * 当时写这个js时比较仓促，可能还有诸多问题，各位若是发现还望指出缺陷，如有需要github的权限可以联系我，
 * 邮箱miss24@qq.com，QQ1783386996
 */
function LinkTrigger() {
    // 初始化
    // obj 初始化的json对象
    // rules 关联规则
    this.init = function (obj, rules) {
        var arr = [];
        if (rules instanceof Array && rules.length > 0) {
            for (var i=0; i<rules.length; i++) {
                var r = rules[i];
                arr.push({__property:r.property,__relatedProps:r.relatedProps instanceof Array?r.relatedProps:!!r.relatedProps?[r.relatedProps]:[],__rule:r.rule});
            }
        }
        return __constructor(obj, arr);
    };
    // 动态追加
    // info -----data  数据
    //        |--root  根节点
    //        |--map   LinkExecVal值所在父节点的属性路径
    // rules 关联规则
    // 例: var lc = new LinkTrigger();
    //     var obj = lc.init({a:{a1:1,a2:1}, b:[{b0:0}]},rules:[xxx]);
    // 追加 {aa3:3}到 obj.a.a3下, lc.appendLinkObject({data:{aa3:2},root:obj,map:"a.a3"},rules:[xxx])
    // 追加 {b1:1}到 obj.b数组内, lc.appendLinkObject({data:{b1:1},root:obj,map:"b.1"},rules:[xxx])
    this.appendLinkObject = function(info, rules) {
        if (!!info) {
            var map = info.map.split(".");
            var arr = [];
            if (rules instanceof Array && rules.length > 0) {
                for (var i=0; i<rules.length; i++) {
                    var r = rules[i];
                    arr.push({__property:r.property,__relatedProps:r.relatedProps instanceof Array?r.relatedProps:!!r.relatedProps?[r.relatedProps]:[],__rule:r.rule});
                }
            }
            __constructor(info.data, rules, {root:info.root,map:map});
        }
    };
    // 字符串化json对象
    this.stringify = function (object) {
        if (!object) return '';
        if (object.__source__ instanceof LinkExecVal) {
            return object.__source__.toString();
        }
        var obj = object.__source__ instanceof Array ? object.__source__ : object;
        var result='', that=this;
        var keys = getObjectKeys(obj);
        var isarray = obj instanceof Array;
        result+=(isarray?'[':'{');
        keys.forEach(function(k,index){
            if (isarray && k=="length") return;
            result += (isarray||undefined === obj[k]?'':'"'+k+'":')
                +(undefined === obj[k] ? ''
                        : null == obj[k] ? 'null'
                        : typeof obj[k] == 'object' ? that.stringify(obj[k])
                        : typeof obj[k] == 'number' ? obj[k]
                        : '"'+obj[k].toString()+'"')
                +',';
        });
        result = result.replace(/,$/,'')+(isarray?']':'}');
        return result;
    };

    // 构造函数, 供初始化和动态追加对象使用
    function __constructor (object, rules, forceInfo) {
        rules = rules || [];
        var initialized = false;

        // 获取字段的执行规则
        function getValRule (parent, compare, key) {
            var res = rules.filter(function(i) {
                // 如果触发规则的绑定属性与指定属性相同, 且是同一引用
                var arr = i.__property.split(".");
                if (arr.length > 1) {
                    var secEnd = getEndElement(forceInfo?forceInfo.root:object, arr, 2);
                    return arr[0]==key && secEnd === parent && getEndElement(secEnd, arr) === compare;
                } else {
                    return arr[0]==key && (forceInfo?forceInfo.root:object)===parent && getEndElement(forceInfo?forceInfo.root:object, arr) === compare;
                }
            });
            if (res && res.length == 1) {
                return res[0];
            } else return null;
        }

        // 获取LinkExecVal的监听对象
        function getLinkExecValListener(linkv) {
            return setPropListener(linkv, function (source, key, value, proxy) {
                if (source instanceof LinkExecVal && initialized) {
                    if (key == "value" || key == "__linkElements") {
                        source.__linkElements.forEach(function(item) {
                            if (item && item.__source__ instanceof LinkExecVal) item.exec();
                        });
                    } else if (key == "__rule"){
                        source.exec();
                    }
                }
            })
        }

        // 设置执行规则和关联对象
        function setRuleAndLinkElements(parent, child, key) {
            var m = getValRule(parent, child, key);
            if (!!m && !!child) {
                child.__root = forceInfo?forceInfo.root:object;
                child.__parent = parent;
                child.setRule(m.__rule);
                child.setLinkElements(m.__relatedProps.map(function(i) {
                    return getEndElement(child.__root,i.split("."));
                }));
            }
        }

        // 动态追加对象的代码逻辑
        var forceParent = !!forceInfo ? getEndElement(forceInfo.root, forceInfo.map, 2) : null;
        // 如果存在显式设置的父节点
        if (!!forceParent && forceInfo.map.length == 1) {
            // 如果显式设置的父节点是数组类型, 且字段正好是追加在数组末端
            if (forceParent.__source__ instanceof Array && /^\d+$/.test(forceInfo.map[0])) {
                // 显式设置的父节点追加该节点
                forceParent.push(object, Number(forceInfo.map[0]));
            } else { // 默认添加该字段到显式设置的父节点上
                forceParent[forceInfo.map[0]] = object;
            }
            // 如果追加的对象是数字类型且有对应的执行规则, 添加对象根路径的监听
            if (typeof object == "number" && !!getValRule(forceParent, object, forceInfo.map[0])) {
                object = getLinkExecValListener(new LinkExecVal(object,forceParent));
                forceParent[forceInfo.map[0]] = object;
                setRuleAndLinkElements(forceParent, object, forceInfo.map[0]);
            }
        }

        // 递归遍历对象的内部, 将有执行规则的对象添加监听
        object = recurseJson (object, function(target, keys, depth) {
            keys.forEach(function(k){
                if (typeof target[k] == "string") return;
                if (!!getValRule(target, target[k], k)) {
                    target[k] = getLinkExecValListener(new LinkExecVal(target[k],target));
                }
            });
            // 将对象用代理封装起来, 更改值时可以触发事件
            return setPropListener(target);

        });

        if (!!forceParent) {
            // 将存在监听的对象赋值给显式设置的父节点
            forceParent[forceInfo.map[0]] = object;
        }

        // 递归遍历对象内部, 设置执行规则和关联对象
        var proxy = recurseJson (object, function(target,keys,depth){

            keys.forEach(function(k){
                setRuleAndLinkElements(target, target[k], k);
            });

        });
        initialized = true;
        return proxy;
    }
    //递归遍历json对象
    // target 遍历的对象
    // callback 回调函数, 若callback有返回值, 则会作为函数的返回值, 若callback无返回值, 则函数返回值是对象本身
    // filterKeys 过滤的键列表
    // depth 深度, 无需设置, 供判断当前深度使用
    function recurseJson  (target, callback, filterKeys, depth) {
        filterKeys = filterKeys || [], depth = depth || 0;
        if (!target || typeof target == "string") return target;
        var keys = getObjectKeys(target).filter(function(k){return filterKeys.indexOf(k)<0;});
        if (keys.length > 0) {
            keys.forEach(function(k) {
                target[k] = recurseJson(target[k], callback, filterKeys, depth+1);
            });
            if (typeof callback == "function") {
                var result = callback(target, keys, depth);
                if (!!result) return result;
            }
        }
        return target;
    }
    // 设置对象属性监听
    function setPropListener (target,event) {
        return new PropertyListenerProxy(target?target:{}, {
            set: function(source, key, value, proxy) {
                if (source[key] && source[key].__source__ instanceof LinkExecVal) {
                    if (value instanceof LinkExecVal || (value && value.__source__ instanceof LinkExecVal)) {
                        source[key].value = value.value;
                    } else {
                        if (source[key].value != value) source[key].value = value;
                    }
                } else {
                    if (source[key] != value) source[key] = value;
                }
                if (typeof event == "function") event(source, key, value, proxy);
                return source;
            }
        });
    }
    // 递归获得引用链末的对象
    // lastIndex 倒数第几个节点, 默认最后一个
    function getEndElement (object, map, lastIndex) {
        lastIndex = lastIndex || 1;
        if (!object || map.length < lastIndex) {
            return null;
        } else if (map.length == lastIndex) {
            return object[map.shift()];
        } else {
            return getEndElement(object[map.shift()], map, lastIndex);
        }
    }
    //获取对象的键集合
    function getObjectKeys(obj) {
        var arr = [];
        if (!!obj) {
            for (var k in obj) {
                arr.push(k);
            }
        }
        return arr;
    }
    //属性监听代理
    function PropertyListenerProxy(object, proxyInfo) {
        var that = this;
        this.__proto__ = object;
        Object.defineProperty(this, "__source__", {
            value: object,
            enumerable:false,
            configurable:true,
            writable: true
        });

        var keys = [];
        if (!!object) {
            for (var k in object) {
                keys.push(k);
            }
        }
        var keys2 = ["value","__linkElements","__rule","__root","__parent","setRule","setLinkElements","addLinkElement",
            "delLinkElement","exec","add","sub","mul","div","toFixed","toString"];

        keys.concat(keys2).forEach(function(property) {
            Object.defineProperty(that, property, {
                set: function(value) {
                    if (!!proxyInfo && typeof proxyInfo.set == "function") {
                        proxyInfo.set(that.__source__, property, value, that);
                    }
                },
                get: function() {
                    return that.__source__[property];
                },
                enumerable: keys2.indexOf(property)>-1?false:true,
                configurable:true
            });
        });

        this.remove = function(index) {
            if (this.__source__ instanceof Array) {
                this.__source__.splice(index, 1);
                delete this[this.__source__.length];
            }
        }
        this.push = function(ele, index) {
            if (this.__source__ instanceof Array) {
                var originLen = this.__source__.length
                index = index || originLen;
                this.__source__.splice(index, 0, ele);
                !function(property) {
                    Object.defineProperty(that, property, {
                        set: function(value) {
                            if (!!proxyInfo && typeof proxyInfo.set == "function") {
                                proxyInfo.set(that.__source__, property, value, that);
                            }
                        },
                        get: function() {
                            return that.__source__[property];
                        },
                        enumerable:true,
                        configurable:true
                    });
                }(originLen);
            }
        }
        this.forEach = function(callback) {
            if (this.__source__ instanceof Array) {
                this.__source__.forEach(callback);
            }
        }
        Object.defineProperties(this, {
            "__proto__": {
                enumerable:false,
                configurable:true,
                writable: true
            },
            "remove": {
                enumerable:false
            },
            "push": {
                enumerable:false
            },
            "forEach": {
                enumerable:false
            }
        });
    }

    /**
     * 链式执行触发值
     * @param value 值
     * @param parent 父对象
     */
    function LinkExecVal (value, parent) {
        if (typeof value != "number") {
            throw "value必须为Number类型";
        }

        this.value=value;
        this.__linkElements=[];
        this.__rule="";
        this.__root = null;
        this.__parent = parent;
        this.setRule = function(rule){this.__rule = rule;};
        this.setLinkElements = function(ele) {if (ele instanceof Array){this.__linkElements = ele;}};
        this.addLinkElement = function(ele) {this.__linkElements.push(ele);this.__linkElements=this.__linkElements;};
        this.delLinkElement = function(ele) {var i=this.__linkElements.indexOf(ele);if(i>-1) {this.__linkElements.splice(i,1);}this.__linkElements=this.__linkElements;};
        this.exec = function() {
            if (typeof this.__rule =="function") {
                this.__rule(this.__parent, this.__root);
            } else if (typeof this.__rule == "string") {
                new Function("parent","root",this.__rule)(this.__parent, this.__root);
            }
        };

        // 常用计算函数
        this.add = function(that) { // 加
            var num = that instanceof LinkExecVal ? that.value : that;
            if (typeof num != "number" && parseFloat(num).toString() == "NaN") throw "argument must be number";
            var a = this.value.toString(), // 取数字的字符串
                b = num.toString(),
                // 取适配数为10的N次方，N为两个加数的小数位数较大数
                aflen = a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0,
                bflen = b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0;
            return ( aflen > bflen ? Number(a.replace(/\./g,""))+Number(b.replace(/\./g,""))*Math.pow(10,aflen-bflen)
                : Number(a.replace(/\./g,""))*Math.pow(10,bflen-aflen)+Number(b.replace(/\./g,"")) )/Math.pow(10, Math.max(aflen, bflen));
        };
        this.sub = function(that) { // 减
            var num = that instanceof LinkExecVal ? that.value : that;
            return this.add(-num);
        };
        this.mul = function(that) { // 乘
            var num = that instanceof LinkExecVal ? that.value : that;
            if (typeof num != "number" && parseFloat(num).toString() == "NaN") throw "argument must be number";
            var a = this.value.toString(), // 取数字的字符串
                b = num.toString(),
                // 取适配数为10的N次方，N为两个加数的小数位数之和
                adapterNum = Math.pow(10, (a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0) + (b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0));
            return Number(a.replace(/\./g,"")) * Number(b.replace(/\./g,"")) / adapterNum;
        };
        this.div = function(that) { // 除
            var num = that instanceof LinkExecVal ? that.value : that;
            if (typeof num != "number" && parseFloat(num).toString() == "NaN" || num == 0) throw "argument must be number and none-zero";
            var a = this.value.toString(), // 取数字的字符串
                b = num.toString(),
                // 取适配数为10的N次方，N为两个加数的小数位数之差的绝对值
                sub = (a.indexOf(".")>0 ? a.length - a.indexOf(".") - 1 : 0)-(b.indexOf(".")>0 ? b.length - b.indexOf(".") - 1 : 0),
                adapterNum = Math.pow(10, Math.abs(sub)),
                // 整数除结果
                r = Number(a.replace(/\./g,"")) / Number(b.replace(/\./g,""));
            return sub > 0 ? r / adapterNum : r * adapterNum;
        };
        this.toFixed = function(retainDigits,meet5carry) {
            if ((typeof retainDigits != "number" || !/^(?!0)\d+$/.test(retainDigits) || parseFloat(retainDigits).toString() == "NaN") && undefined!==retainDigits) throw "first argument (retainDigits) must be a positive integer or not passed in";
            if (typeof meet5carry != "boolean" && undefined !== meet5carry) throw "second argument (meet5carry) must be boolean or not passed in";
            retainDigits = undefined===retainDigits ? 0 : retainDigits;
            meet5carry = undefined===meet5carry ? true : meet5carry; // 默认遇5进位
            if (this.toString().indexOf(".") > -1) {
                // 用正则提取数字的整数、保留小数、和是否进位依据
                return Number(this.toString().replace(new RegExp("(\\d+)\\.(\\d{" + retainDigits + "})(\\d?)\\d*"), function(match,pattern1,pattern2,pattern3,index) {
                    return (Number(pattern1+pattern2) + (Number(pattern3)>4&&(meet5carry||Number(pattern3)>5) ? 1 : 0)) / Math.pow(10,pattern2.length);
                }));
            } else return this;
        }
        Object.defineProperties(this, {
            "value": {
                enumerable:false,
                configurable:true,
                writable: true
            },
            "__linkElements": {
                enumerable:false,
                configurable:true,
                writable: true
            }, "__rule": {
                enumerable:false,
                configurable:true,
                writable: true
            }, "__root": {
                enumerable:false,
                configurable:true,
                writable: true
            }, "__parent": {
                enumerable:false,
                configurable:true,
                writable: true
            },
            "setRule": {
                enumerable:false
            }, "setLinkElements": {
                enumerable:false
            }, "addLinkElement": {
                enumerable:false
            }, "delLinkElement": {
                enumerable:false
            }, "exec": {
                enumerable:false
            }, "add": {
                enumerable:false
            }, "sub": {
                enumerable:false
            }, "mul": {
                enumerable:false
            }, "div": {
                enumerable:false
            }, "toFixed": {
                enumerable:false
            }, "toString": {
                enumerable:false
            }
        });
    }
}

window.linkTrigger = new LinkTrigger();