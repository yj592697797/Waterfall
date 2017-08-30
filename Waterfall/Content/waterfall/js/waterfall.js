; (function (window, $) {
    var WaterFall = function (ele, opt) {
        this.$element = $(ele);
        this.defaults = {
            'column': 6,                                //列数
            'startRows': 10,                            //初次加载的行数
            'loadRows': 2,                              //懒加载的行数
            'waterClass': 'water',                      //水柱的css
            'space': 5,                                 //水柱的间隔
            'flowing': function (arg1, arg2) { },       //加载中执行 arg1,水柱的jquery对象  arg2,一条数据
            'flowed': function(arg) { },                //加载后执行 arg,本次加载的数量
            'loadOnce': false,                           //true:从服务器获取所有数据后，每次只加载一部分；false:每次都需要从服务器获取需要加载的数据
            'url': '',                                  //请求数据的url
            'aType': 'GET',                             //请求数据的方式 GET  POST
            'triggerY': 200,
            'customerParams': {}                        //请求数据时的用户自定义参数
        };
        this.options = $.extend({}, this.defaults, opt);
        this.lastRowWaters = [];
        this.data = [];
        this.hasLoadData = false;
        this.remoteParams = {
            index: 0,
            total: this.options.loadRows * this.options.column,
            loadOnce: this.options.loadOnce
        };
    };

    function throttle(method, context, time) {
        var arts = Array.prototype.slice.apply(arguments, [3]);
        clearTimeout(method.tId);
        method.tId = setTimeout(function () {
            method.apply(context, arts);
        }, time);
    }

    function scrollEvent(waterf) {
        var scrollTop = $(this).scrollTop() + waterf.options.triggerY;
        var scrollHeight = $(document).height();
        var windowHeight = $(this).height();
        if (scrollTop + windowHeight >= scrollHeight) {
            waterf.flow();
        }
    };

    WaterFall.prototype = {
        create: function () {
            var waterfall = this,
                options = waterfall.options;

            waterfall.waterWidth = (waterfall.$element.width() - options.space * (options.column - 1)) / options.column;//每一个水柱的宽度
            waterfall.flow(options.startRows);
            waterfall._bindEvent();

            return waterfall;
        },
        flow: function (rows) {
            var waterfall = this,
                options = waterfall.options,
                callback = waterfall._flowing;

            if (options.loadOnce && waterfall.hasLoadData) {
                callback.apply(waterfall, arguments);
            } else {
                var params = $.extend({}, waterfall.remoteParams, options.customerParams);
                if (!rows) rows = options.loadRows;
                params.total = rows * options.column;
                waterfall._getData(params, callback, arguments[0]);
                waterfall.hasLoadData = true;
            }
        },
        _getData: function (params, callback) {
            var waterfall = this,
                options = waterfall.options,
                args = Array.prototype.slice.apply(arguments, [2]);
            
            $.ajax({ url: options.url, type: options.aType, async: true, dataType: 'json',
                data: params,
                success: function (data, textStatus, jqXHR) {
                    waterfall.data = data;
                    if (typeof callback == 'function') {
                        callback.apply(waterfall, args);
                    }
                }
            });
        },
        _getInsertPosition: function () {
            var waterfall = this,
                options = waterfall.options,
                flag = true,
                top = 0,
                left = 0,
                minIndex = 0;

            if (waterfall.lastRowWaters.length < options.column) {
                top = 0;
                minIndex = waterfall.lastRowWaters.length;
                flag = false;
            }
            if (flag) {
                var $first = $(waterfall.lastRowWaters[0]);
                top = $first.position().top + $first.height();
                minIndex = 0;
                waterfall.lastRowWaters.forEach(function (water, index) {
                    var $water = $(water);
                    var thisTop = $water.position().top + $water.height();
                    if (thisTop < top) {
                        top = thisTop;
                        minIndex = index;
                    }
                });
                top = top + options.space;
            }
            left = (waterfall.waterWidth + options.space) * minIndex;
            return {
                top: top,
                left: left,
                index: minIndex
            };
        },
        _resize: function () {
            var waterfall = this,
                options = waterfall.options,
                $first = $(waterfall.lastRowWaters[0]),
                height = $first.position().top + $first.height();

            waterfall.lastRowWaters.forEach(function (water, index) {
                var $water = $(water);
                var thisTop = $water.position().top + $water.height();
                if (thisTop > height) {
                    height = thisTop;
                }
            });
            waterfall.$element.height(height);
        },
        _flowing: function (rows) {
            var waterfall = this,
                options = waterfall.options,
                $waters = waterfall.$element.find('.' + options.waterClass),
                planLoadCount = 0,
                loadCount = 0;

            if (!rows) rows = options.loadRows;
            planLoadCount = rows * options.column;

            for (var i = 0; i < planLoadCount; i++) {
                if (!Array.isArray(waterfall.data) || waterfall.data.length <= 0) return false;
                var waterData = waterfall.data.shift();
                if (!waterData) break;
                var insertPos = waterfall._getInsertPosition();
                var $insert = $('<div>');
                $insert
                    .addClass(options.waterClass)
                    .css('width', waterfall.waterWidth)
                    .css('top', insertPos.top)
                    .css('left', insertPos.left);
                if (typeof options.flowing == 'function') {
                    options.flowing.call(waterfall, $insert, waterData);
                }
                waterfall.lastRowWaters[insertPos.index] = $insert;
                waterfall.$element.append($insert);
                loadCount++;
                waterfall.remoteParams.index++;
            }

            waterfall._flowed(loadCount);
            return waterfall;
        },
        _flowed: function (loadCount) {
            var waterfall = this,
                options = waterfall.options;

            waterfall._resize();
            if (typeof options.flowed == 'function') {
                options.flowed.call(waterfall, loadCount);
            }
        },
        _bindEvent: function () {
            var waterfall = this;
            $(window).scroll(function () {
                throttle(scrollEvent, window, 50, waterfall);
            });
        }
    };
    $.fn.waterfall = function (options) {
        var waterf = new WaterFall(this, options);

        return waterf;
    }
})(window, jQuery);