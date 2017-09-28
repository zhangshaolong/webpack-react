/**
 * 对数据进行深度拷贝
 * @param {*} source 数据源
 * @return {*} 数据源的拷贝
 */
const deepCopy = (source) => {
    let deepSource;
    let constructor = source.constructor;
    (function recursive(source, result, idx) {
        let constructor = source && source.constructor,
            obj,
            key,
            i,
            len,
            isTop = result === undefined;
        if (constructor === Object) {
            obj = (isTop ? deepSource = {} : result[idx] = {});
            for (key in source) {
                recursive(source[key], obj, key);
            }
        } else if (constructor === Array) {
            i = 0, len = source.length;
            obj = (isTop ? deepSource = [] : result[idx] = []);
            while (i < len) {
                recursive(source[i], obj, i++);
            }
        } else if (constructor === Function) {
            try {
                result[idx] = new Function('return ' + source.toString())();
            } catch (e) {
                result[idx] = source;
            }
        } else if (typeof source === 'object') {
            result[idx] = new constructor(source);
        } else {
            result[idx] = source;
        }
    })(source);
    return deepSource;
};

/**
 * 对值的格式化处理，比如123456 -> 123,456
 * @param {string} val 需要格式化的值
 * @param {string} ch 用ch设置的字符填充到对应的位置，默认为‘,’
 * @param {integer} len 每隔len间隔做填充处理，默认为3
 * @return {string} 格式化的字符串
 */
const format = (val, ch, len) => {
    ch = ch || ',';
    len = len || 3;
    return ('' + val).replace(RegExp('(\\d{1,' + len + '})(?=(\\d{' + len + '})+(?:$|\\.))', 'g'), '$1' + ch);
};

/**
 * @param data  json格式的数据，必填
 * @param codeStyle 是否高亮显示
 * @param space 默认使用的缩进空白
 * @param indents 当前行需要的缩进（内部参数，调用者不要设置）
 */
 const formatJSON = (data, codeStyle, space, indents) => {
    if (null == data) {
        return '' + data;
    }
    space = space != null ? space : '    ';
    indents = indents || '';
    var constructor = data.constructor;
    if (constructor === String) {
        return codeStyle ? '<span class="json-string-value">"' + data + '"</span>' : '"' + data + '"';
    } else if (constructor === Number || constructor === Boolean) {
        return codeStyle ? '<span class="json-number-value">' + data + '</span>' : data;
    } else if (constructor === Array) {
        var astr = codeStyle ? '<span class="json-array-tag">[</span>\n' : '[\n';
        for (var i = 0, len = data.length; i < len - 1; i++) {
            astr += indents + space + formatJSON(data[i], codeStyle, space, indents + space) + ',\n';
        }
        astr += indents + space + formatJSON(data[len - 1], codeStyle, space, indents + space) + '\n';
        return astr + indents + (codeStyle ? '<span class="json-array-tag">]</span>' : ']');
    } else if (constructor === Object) {
        var ostr = codeStyle ? '<span class="json-object-tag">{</span>\n' : '{\n';
        var isEmpty = true;
        for (var key in data) {
            isEmpty = false;
            ostr += indents + space + (codeStyle ? '<span class="json-object-key">' + '"' + key + '"' + '</span>' : '"' + key + '"') + ': ' + formatJSON(data[key], codeStyle, space, indents + space) + ',\n';
        }
        if (!isEmpty) {
            ostr = ostr.slice(0, -2);
        }
        return ostr + '\n' + indents + (codeStyle ? '<span class="json-object-tag">}</span>' : '}');
    }
};

const duration = (timestamp) => {

    if (!timestamp) return '';

    var totalSeconds = parseInt(timestamp / 1000);

    var seconds = totalSeconds % 60;

    var totalMinutes = parseInt(totalSeconds / 60);

    var minutes = totalMinutes % 60;

    var totalHours = parseInt(totalMinutes / 60);

    var hours = totalHours % 24;

    var totalDays = parseInt(totalHours / 24);

    var text = '';
    if (totalDays) {
        text += totalDays + '天';
    }
    if (hours) {
        text += hours + '小时';
    }
    if (minutes) {
        text += minutes + '分钟';
    }
    if (seconds) {
        text += seconds + '秒';
    }

    return text;
};

// 提供对一些高频调用的函数进行优化，降低js调用频率，排除不必要的干扰因素
const bindFun = function () {

    /**
     * 判断是否是注册滚动事件的元素触发的滚动事件
     * element 被监听滚动的元素
     * event 滚动事件的事件对象
     */
    let isElementSelf = (element, event) => {
        return element === event.target || (element === window && event.target === document);
    };

    /**
     * 清除队列中未执行的任务，终止这些不满足条件的调用
     */
    let clearTimerQueue = (timerQueue) => {
        // 保证最后一个会被调用到
        while (timerQueue.length) {
            clearTimeout(timerQueue.shift());
        }
    };

    /**
     * element 被监听滚动的元素 必需
     * type    事件类型
     * handler 滚动时，调用的函数   必需
     * timeInterval 每隔timeInterval，最多执行一次handler的函数调用，此字段设置为非负数数字时有效
     * watchAll 是否触发其他元素的滚动条事件
     */
    return (element, type, handler, timeInterval, watchAll) => {
        let invokeTimerQueue = [];
        let fun = null;
        if (isNaN(timeInterval) || timeInterval < 0) {
            if (watchAll) {
                fun = handler;
            } else {
                fun = (event) => {
                    if (isElementSelf(element, event)) {
                        handler.call(element, event);
                    }
                };
            }
        } else {
            if (watchAll) {
                fun = (event) => {
                    clearTimerQueue(invokeTimerQueue);
                    invokeTimerQueue.push(
                        setTimeout(() => {
                            handler.call(element, event);
                        }, timeInterval)
                    );
                };
            } else {
                fun = (event) => {
                    clearTimerQueue(invokeTimerQueue);
                    invokeTimerQueue.push(
                        setTimeout(() => {
                            if (isElementSelf(element, event)) {
                                handler.call(element, event)
                            }
                        }, timeInterval)
                    );
                };
            }
        }
        element.addEventListener(type, fun, false);

        return () => {
            element.removeEventListener(type, fun, false);
        };
    };
}()

const utils = {
    deepCopy: deepCopy,
    format: format,
    formatJSON: formatJSON,
    duration: duration,
    bindFun: bindFun
};

export {utils as default, deepCopy, format, formatJSON, duration, bindFun}