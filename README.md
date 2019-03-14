JavaScript扩展util
=

javascript精度问题修改
-
通过为原型prototype扩展方法，解决js浮点运算时的精度偏差

### 文件
float-cal-util.js

javascript链式触发器
-
动态监听json对象，为json对象提供事件的链式触发功能，当值改变时依次执行json对象关联的所有对象的执行规则

### 文件
link-trigger.js

demo
-

### 例1
##### float-cal-util.js 说明
    add(num): 加函数，参数为Number类型
    minus(num): 减函数，参数为Number类型
    multiply(num): 乘函数，参数为Number类型
    divide(num): 除函数，参数为不为0的Number类型
    toFixed(retainDigits, meet5carry): 小数去尾函数，第一个参数为小数保留位数，必须是正整数或不传，第二个参数为遇5是否进位的逻辑，必须是布尔值或不传
##### 在部分浏览器中存在如下精度偏差现象
    0.1 + 0.2 != 0.3 // true
    0.3 - 0.2 != 0.1 // true
    0.699 * 100 != 69.9 // true
    9.9 / 3 != 3.3 // true
    (2.55).toFixed(1) // 2.5
##### 代码：
    (0.1).add(0.2) != 0.3 // false
    (0.3).minus(0.2) != 0.1 // false
    (0.699).multiply(100) != 69.9 // false
    (9.9).divide(3) != 3.3 // false
    (2.55).toFixed() // 3
    (2.55).toFixed(1) // 2.6
    (2.55).toFixed(1, false) // 2.5

### 例2
##### 要达到效果sum 会根据a和b的和自动变化，sum = a + b
##### 代码：
    var test1 = linkTrigger.init({a:1,b:2,sum:3,sum2:4},
      // property为触发节点名称
      // relatedProps为本节点所关联的触发节点，参数用关联节点名称的字符串，多个关联节点用字符串数组即可
      // rule为被触发的执行规则，可用字符串或函数，函数为参数时需要注意内部引用外部变量作用域的问题
      [{property:"a",relatedProps:"sum"},
      {property:"b",relatedProps:"sum"},
      // 字符串的回调方式
      {property:"sum",rule:"parent.sum = parent.a.add(parent.b);console.log('test1.sum='+parent.sum.value);"},
      // 函数的回调方式
      {property:"sum2",rule:function(parent, root) {parent.sum2 = parent.a.add(parent.b);
      console.log('test1.sum2='+parent.sum2.value);}}
    ]);

test1.a = 3;  //改变test.a的值<br>
控制台输出结果:  test1.sum=5<br>
（注意，之所以没有输出sum2，是因为a和b节点并没有和sum2节点关联上，需要显示的在第二个参数指定，<br>
  比如想要在初始化后在改变a节点的值时就能同时触发sum1和sum2的执行规则的话，传入["sum","sum2"]即可<br>
）<br>
<br>
// 改变关联节点会触发执行规则，由于当时需求需要，所以是触发所有关联节点的执行规则<br>
// 各位可以自行更改为只触发新增的节点，在PropertyListenerProxy中对名为__linkElements的属性进行判断、特殊处理即可<br>
test1.a.addLinkElement(test1.sum2)<br>
控制台输出结果:   test1.sum=5<br>
                test1.sum2=5<br>
// 删除关联节点后，被删除节点不再触发规则，遗留的关联节点依旧会触发执行规则
test1.a.delLinkElement(test1.sum)
控制台输出结果:  test1.sum2=5
 
### 例3
##### 在例1的基础上引入递归关系
    数据结构:
    {
      args: {
        a:1,b:1,c:3,d:1
      },
      factor1:2,
      factor2:1,
      result:4
    }
##### factor1 会根据a和b的和自动变化，factor1=a+b，
##### factor2 会根据c和d的差自动变化，factor2=c-d，
##### result  会根据factor1为底数、factor2为指数的指数运算结果自动变化  result = Math.pow(factor1, factor2)
##### 代码：
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
test2.args.a = 2  // 改变test.a的值<br>
控制台输出结果:  test2.result=9<br>
// 删除factor1的关联节点<br>
test2.factor1.delLinkElement(test2.result)<br>
test2.args.a = 3<br>
控制台没有输出打印，原因： factor1和result的关联关系已经不存在了，所以无法触发result的执行规则<br>
test2.args.c = 4<br>
控制台输出结果:  test2.result=64   注意了，为什么是result是64，虽然上一句js语句没有触发结果，但是a和factor1的关系还在，所以factor1的值是变成了4的<br>
<br>
当时写这个js时比较仓促，可能还有诸多问题，各位若是发现还望指出缺陷，如有需要github的权限可以联系我 
##### 邮箱miss24@qq.com，QQ1783386996
