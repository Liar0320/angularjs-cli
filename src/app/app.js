/*
 * @Author: liar
 * @Date: 2018-08-31 09:21:03
 * @Last Modified by: lich
 * @Last Modified time: 2019-06-26 15:45:20
 * @TODO:
 * IE兼容性  暂时 ie9 http请求无法发送
 * svg对ie的兼容  流程图     弃用
 * 表单验证的控制 ng-model 和 form 指令  ----done  (ahForm ahSubmit) 10.25      ---待完善
 * 时间控制 ----done ----曾显太慢
 * fileInput控件 封装   ----done
 * code码统一处理      ----done
 * 时间选择 直接绑定ng-model  可以采用 uibdate  ----done
 * $http重新封装  现在重复代码 太多
 * $stateParams 能否在浏览器刷新时 冲 缓存中获取  ----done
 * $locationChangeStart 解决模态框回退 ----done
 */

(function (angular) {
    'use strict';
    var app = angular.module('myApp', [
        'ngAnimate',
        'frame',
        'login',
        'ui.router',
        'ui.bootstrap',
        // 'validation',
        // 'validation.rule',
        'directiveModel',
        // 'd3tree',
        'angularBootstrapNavTree',
        'ui.select',
        'me-lazyload',
        // 'ngSanitize',  //富文本框
        // 'textAngular'   //富文本框
        'wangEditor',
        'zTree_v3' //zTree_v3 树
        // 'lich-mock'
    ]);
    // 启动函数
    app.run(['$rootScope', '$state', '$stateParams','$window','routerHelp', 'routerConfig','routerExternal', 'sessionFactory', 'APIMODULE',
        function ($rootScope, $state,$stateParams, $window,routerHelp, routerConfig, routerExternal,sessionFactory, APIMODULE) {
            var firstLoad = true;
            sessionFactory.set('pjId', APIMODULE.pjId);
            $rootScope.app = {
                name: '海事局',
                pjId: APIMODULE.pjId,
                userConfig: {
                    USERNAME: '',
                    USER_ID: '',
                    deptName: '',
                    HSJG_DM: '',
                    hsjgName: '',
                    DEPT_ID: '',
                    DEPT_NAME: '',
                    DUTY_NAME: '',
                    SEX: '',
                    WORKING_YEARS: '',
                    WORK_TIME: '',
                    AUTH_LEVEL: '',
                    DUTY_LEVEL: '',
                    DUTY_ID:'',
                    DUTY_NAME_NEW: '',
                    IDCARD:'',
                    birthday:'',
                    LOGINNAME:'',
                    PWD:'',
                    level:''
                },
                userPower: null,
                menuList: [],
                state: {
                    id: '',
                    url: ''
                },
                timeCtrl: {
                    min: new Date()
                },
                roleList:null,
                token: '',
                hasRolePower:function (ROLE_ID) {
                    if(!this.roleList) return false;
                    return !!this.roleList.filter(function (item) {
                        return item.ROLE_ID  === ROLE_ID;
                    }).length; 
                },
                hasUserPower:function (id) {
                    return !!this.userPower[id];
                }
            };

            reload();

            $rootScope.app.loginOut = function () {
                sessionFactory.clear();
                $state.go('login');
            };
            $rootScope.app.goBack = function () {
                $window.history.go(-1);
            };

            routerHelp(routerConfig, $state);
            routerHelp(routerExternal, $state);
            

            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                var state = $state.get(toState.name);
                $rootScope.app.state.url = state.url;
                //在第一一次加载时 获取session中的params 作为跳转参数
                if(firstLoad){
                    angular.extend(toParams,sessionFactory.getObject('stateParams',toParams));
                    firstLoad = false;
                }
                sessionFactory.setObject('stateParams',toParams);
                setTitle(toState.title);
            });

            // $rootScope.$on('$stateChangeSuccess', function () {
            //     if(firstLoad){
            //         $stateParams = sessionFactory.getObject('stateParams');
            //         firstLoad = false;
            //     }
            // });

            // 当页面有产生模态框时 回退按钮拦截路由变换 并且清除模态框
            $rootScope.$on('$locationChangeStart', function (e) {
                var isModalRemove = false;

                var modalWindow = angular.element('div[uib-modal-window]') || [];
                if (modalWindow.length) {
                    var scope =  modalWindow.scope();
                    if(angular.isFunction(scope.$resolve.$anothterClose) ){
                        scope.$resolve.$anothterClose();
                    }else{
                        scope.$dismiss();
                    }
                    isModalRemove = true;
                }
                if (isModalRemove) e.preventDefault();
            });

            // 设置页面标题
            function setTitle (title) {
                document.title = title;
                if (navigator.userAgent.indexOf('MicroMessenger') > 0) {
                    // hack在微信等webview中无法修改document.title的情况
                    var body = document.body;

                    var iframe = document.createElement('iframe');
                    iframe.src = '/null.html';
                    iframe.style.display = 'none';
                    iframe.onload = function () {
                        setTimeout(function () {
                            body.removeChild(iframe);
                        }, 0);
                    };
                    body.appendChild(iframe);
                }
            }
            // 页面刷新 保留数据
            function reload () {
                var userConfig = sessionFactory.get('userConfig');
                if (userConfig) {
                    $.setObjByObj($rootScope.app.userConfig, JSON.parse(userConfig));
                }
                var userPower = sessionFactory.get('userPower');
                if (userPower) {
                    $rootScope.app.userPower = JSON.parse(userPower);
                }
                var token = sessionFactory.get('token');
                if (token) {
                    $rootScope.app.token = token;
                }

                var menuList = sessionFactory.getObject('menuList');
                if (menuList) {
                    $rootScope.app.menuList = menuList;
                }

                var roleList = sessionFactory.getObject('roleList');
                if (roleList) {
                    $rootScope.app.roleList = roleList;
                }

                $rootScope.app.userConfig.DUTY_NAME = $.isNIL($rootScope.app.userConfig.DUTY_NAME_NEW) ? '' : ($rootScope.app.userConfig.DUTY_NAME_NEW);
                $rootScope.app.userConfig.SEX = $.isNIL($rootScope.app.userConfig.SEX) ? '' : ($rootScope.app.userConfig.SEX * 1);
            }
        }
    ]);

    /** =========================================================
    * 页面重定向
     ========================================================= */
    app.config(['$locationProvider', '$urlRouterProvider', '$qProvider', function ($locationProvider, $urlRouterProvider, $qProvider) {
        $locationProvider.hashPrefix('');
        $urlRouterProvider.when('', 'login'); // 当url为空
        $urlRouterProvider.otherwise('frame/home'); // 当url无法识别
        // $qProvider.errorOnUnhandledRejections(false);// 隐藏Possibly unhandled rejection报错
    }]);

    /** =========================================================
    * angular报错不阻止
     ========================================================= */
    app.config(['$qProvider', function ($qProvider) {
        $qProvider.errorOnUnhandledRejections(true);
    }]);

    /** =========================================================
    * 创建路由生成服务
     ========================================================= */
    app.provider('routerHelp', ['$stateProvider', function ($stateProvider) {
        var createRouter = function (params, $state) {
            if (!params) return;
            params.forEach(function (element) {
                if ($state && $state.get(element.name)) {
                    return console.warn(element.name + '已经注册过路由');
                }
                var conf = {
                    title: element.title,
                    id: element.id,
                    pid: element.pid,
                    url: element.url,
                    templateUrl: element.templateUrl || '',
                    controller: element.controller || '',
                    controllerAs: element.controllerAs || 'vm',
                    abstract: element.abstract || false
                };
                if (element.params) {
                    conf.params = element.params;
                }
                $stateProvider.state(element.name, conf);
            });
        };
        this.createRouter = createRouter;
        this.$get = function () {
            return createRouter;
        };
    }]);

    /** =========================================================
    * 封装cookies存储器
     ========================================================= */
    app.service('cookies', ['$document', function ($document) {
        var document = $document[0];
        this.set = function (c_name, value, expireDays) {
            var exdate = new Date();
            expireDays = expireDays || 365;
            exdate.setDate(exdate.getDate() + expireDays);
            //  document.cookie = c_name + '=' + value + ((expireDays == null) ? '' : ';expires=' + exdate.toGMTString());
            document.cookie = c_name + '=' + value + (expireDays == null ? '' : ';expires=' + exdate.toGMTString());
        };
        /**
         * 读取cookies
         */
        this.get = function (c_name) {
            var cookie = document.cookie;
            if (cookie.length > 0) {
                var _reg = new RegExp(c_name + '=[^;]+');
                var cookieCsz = cookie.match(_reg);
                if (cookieCsz) {
                    return cookieCsz[0].split('=')[1];
                }
                return undefined;
            }
        };
        this.clear = function () {
            document.cookie = '';
        };
    }]);

    /** =========================================================
    * 封装session存储器
     ========================================================= */
    app.service('sessionFactory', ['$window', function ($window) {
        this.set = function (key, value) {
            $window.sessionStorage[key] = value;
        };
        this.get = function (key, defaultValue) {
            return $window.sessionStorage[key] || defaultValue;
        };
        this.remove = function (key) {
            return $window.sessionStorage.removeItem(key) ;
        };
        this.setObject = function (key, value) {
            $window.sessionStorage[key] = JSON.stringify(value);
        };
        this.getObject = function (key) {
            return JSON.parse($window.sessionStorage[key] || '{}');
        };
        this.clear = function () {
            $window.sessionStorage.clear();
        };
    }]);

    /** =========================================================
     * 封装localStorage存储器作为历史记录查询
     ========================================================= */
    app.service('storageHistory', ['$window', function ($window) {

        var tempList = JSON.parse($window.localStorage["searchHistory"] || '[]');
        this.size=tempList.length;

        this.setObject = function (value) {
            var valueIndex=tempList.indexOf(value);
            if(valueIndex>=0){
                tempList.splice(valueIndex,1);
            }
            tempList.unshift(value);
            if(tempList.length>100){
                tempList.splice(100,1);
            }
            this.size=tempList.length;
            $window.localStorage["searchHistory"] = JSON.stringify(tempList);
        };
        this.delete = function (index) {
            tempList.splice(index,1);
            this.size=tempList.length;
            $window.localStorage["searchHistory"] = JSON.stringify(tempList);
        };
        this.getObject = function (parmas,num) {
            var filterData="";
            if(parmas === undefined){
                filterData=tempList;
            }else{
                filterData=tempList.filter(function (item) {
                    return String(item).includes(parmas);
                });
            }

            this.size=filterData.length;
            return filterData.slice(0,num||10);
        };
        this.removeItem = function () {
            tempList.splice(0,tempList.length);
            $window.localStorage.removeItem("searchHistory");
        };
    }]);
    /** =========================================================
    * 封装$http请求
     ========================================================= */
    app.service('SIGN', ['$http', '$q', '$state', '$window', 'APIMODULE', 'sessionFactory', 'ajaxAnimation', function ($http, $q, $state, $window, APIMODULE, sessionFactory, ajaxAnimation) {
        var URL_MATCH = /^((ht|f)tps?):\/\/([\w\-]+(\.[\w\-]+)*\/)*[\w\-]+(\.[\w\-]+)*\/?(\?([\w\-\.,@?^=%&:\/~\+#]*)+)?/;
        var _LOGIN_API_ROOT = APIMODULE._LOGIN_API_ROOT;
        var _SYS_API_ROOT = APIMODULE._SYS_API_ROOT;
        var _FILE_API_ROOT = APIMODULE._FILE_API_ROOT;
        var pjid = sessionFactory.get('pjId');
        var userId;
        // var pjid = $rootScope.app.pjId;
        // var userId = $rootScope.app.userConfig.USER_ID;

        /**
         * post请求
         * @param {*} url 地址
         * @param {*} params 参数
         * @param {*} config 配置
         * @param {*} reject 失败的函数
         */
        function get (url, params, isNodata, config, reject) {
            var defer = $q.defer();
            // if(params){
            //     params.timestamp = new Date().getTime();
            // }else{
            //     params = {
            //         timestamp : new Date().getTime()
            //     };
            // }
            config = config || {};
            if(url != 'http://198.16.1.61:8079/home/countAll'){
                if (config.animate !== false ) {
                    ajaxAnimation.start();
                }
            }
            $http({
                method: 'get',
                url: url,
                params: params,
                headers:{
                    Pragma:"no-cache"
                }
            }).then(function (response) {
                if(url != 'http://198.16.1.61:8079/home/countAll'){
                    if (config.animate !== false ) {
                        ajaxAnimation.end();
                    }
                }
                var res = response.data;
                if (isNodata === true) return defer.resolve(res, response.status, response.headers, response.config);
                if (res.code === 1) {
                    defer.resolve(res.data, response.status, response.headers, response.config);
                } else if (res.code === 100) {
                    layer.msg('登录过期,请重新登录');
                    return $state.go('login');
                } else {
                    layer.msg(res.errMsg);
                    defer.promise = null;
                    defer = null;
                }
                // angular.isFunction(resolve) ? resolve(response.data, response.status, response.headers, response.config) : console.warn('ajaxService callback is not function');
            }).catch(function (response) {
                ajaxAnimation.end();
                var res = response.data;
                if (res.code === 0) {
                    throw (res.errMsg);
                }
                console.error('请求出错', response);
                defer.promise = null;
                defer = null;
                // angular.isFunction(reject) ? reject(response, status, headers, config) : console.warn('ajaxService callback is not function');
            });
            return defer.promise;
        }
        /**
         * post请求
         * @param {*} url 地址
         * @param {*} params 参数
         * @param {*} contentType 消息主体编码格式
         * @param {*} isNodata 是否自动判断code码
         * @param {*} cache 缓存
         * @param {*} resolve 回调函数
         * @param {*} reject 失败的函数
         */
        function post (url, params, contentType, isNodata, cache, resolve, reject) {
            var defer = $q.defer();
            ajaxAnimation.start();
            var conf = {
                method: 'post',
                url: url,
                data: processData(params),
                cache: cache===true?true:false
                // timeout: 30000
            };

            if(angular.isObject(cache)){
                angular.extend(conf,cache);
            }
            // formdata: "1"
            if (contentType) {
                conf.headers = {};
                switch (contentType) {
                case 'json': conf.headers['Content-Type'] = 'application/json'; conf.data = JSON.stringify(params);
                    break;
                default:
                    break;
                }
            }
            $http(conf).then(function (response) {
                ajaxAnimation.end();
                var res = response.data;
                if (isNodata === true) return defer.resolve(res, response.status, response.headers, response.config);
                if (res.code === 1) {
                    defer.resolve(res.data, response.status, response.headers, response.config);
                } else if (res.code === 100) {
                    layer.msg('登录过期,请重新登录');
                    return $state.go('login');
                } else {
                    layer.msg(res.errMsg);
                    defer.promise = null;
                    defer = null;
                }
                //  angular.isFunction(resolve) ? resolve(response.data, status, headers, config) : console.warn('ajaxService callback is not function');
            }).catch(function (response, status, headers, config) {
                ajaxAnimation.end();
                var res = response.data;
                if (res.code === 0) {
                    throw (res.errMsg);
                }
                console.error('请求出错', response);
                defer.promise = null;
                defer = null;
                //   angular.isFunction(reject) ? reject(response.data, status, headers, config) : console.error(response);
                // defer.reject(response.data, status, headers, config);
            });
            return defer.promise;
        }

        function put (url, params, resolve, reject) {
            var defer = $q.defer();
            ajaxAnimation.start();
            $http({
                method: 'put',
                url: url,
                params: params
            }).then(function (response) {
                ajaxAnimation.end();
                var res = response.data;
                if (res.code === 1) {
                    defer.resolve(res.data, response.status, response.headers, response.config);
                } else if (res.code === 100) {
                    layer.msg('登录过期,请重新登录');
                    return $state.go('login');
                } else {
                    layer.msg(res.errMsg);
                    defer.promise = null;
                    defer = null;
                }
                // angular.isFunction(resolve) ? resolve(response.data, response.status, response.headers, response.config) : console.warn('ajaxService callback is not function');
            }).catch(function (response) {
                ajaxAnimation.end();
                var res = response.data;
                if (res.code === 0) {
                    throw (res.errMsg);
                }
                console.error('请求出错', response);
                defer.promise = null;
                defer = null;
                // angular.isFunction(reject) ? reject(response, status, headers, config) : console.warn('ajaxService callback is not function');
            });
            return defer.promise;
        }

        /**
         * 上传文件 组装二进制传输方式
         * @param {*} url   地址
         * @param {*} file_data 文件
         * @param {*} pjid 项目id
         * @param {*} userId 用户名id
         */
        function upLoadFile (url, file_data, pjid, userId) {
            var msg = limitFile(file_data,500);
            if(msg){
                return layer.msg(msg) ;
            }
            var defer = $q.defer();
            ajaxAnimation.start();
            var form_data = new window.FormData();
            for (var i = 0; i < file_data.length; i++) {
                form_data.append('file', file_data[i]); // ++++++++++
            }
            // form_data.append('file', file_data);
            form_data.append('systemId', pjid);
            form_data.append('userId', userId);

            
            $http({
                method: 'post',
                url: url,
                data: form_data,
                processData: false, // 注意：让jQuery不要处理数据
                timeout:1000*60*60,
                headers: {
                    'Content-Type': undefined,
                    'Access-Control-Allow-Origin': '*'
                    // 'token': sessionFactory.get('token') || ''
                },
                transformRequest: angular.identity
            }).then(function (response) {
                ajaxAnimation.end();
                var res = response.data;
                if (res.code === 1) {
                    defer.resolve(res.data, response.status, response.headers, response.config);
                } else if (res.code === 100) {
                    layer.msg('登录过期,请重新登录');
                    return $state.go('login');
                } else {
                    layer.msg(res.errMsg);
                }
            }).catch(function (response) {
                ajaxAnimation.end();
                var res = response.data;
                if (res.code === 0) {
                    throw (res.errMsg);
                }
                console.error('请求出错', response);
                defer.promise = null;
                defer = null;
            });

            /**
             * 限制大小
             * @param {*} files 
             * @param {*} max 
             */
            function limitFile(files,max) {
                var limitType = ['.bat','.exe','.py','.javascript'];
                
                var obj = {
                    size:0,
                    isType:false
                };
                for (var i = 0; i < files.length; i++) {
                    var element = files[i];
                    obj.size = obj.size + element.size;
                    if(obj.isType == false){
                        obj.isType =  limitType.includes(element.name.substr(element.name.lastIndexOf('.'),element.name.length));
                    }
                }

                // var obj = files.reduce(function (prev,current) {
                //     prev.size = prev.size +current.size;
                //     if(prev.isType == false){
                //         prev.isType =  limitType.includes(current.name.substr(current.name.lastIndexOf('.'),current.name.length));
                //     }
                //     return prev;
                // },);


                var mb = (obj.size/1024/1024);
        
                var msg = '';
                if(obj.isType){
                    msg = "特殊时期，无法上传该类型文件";
                }

                if(mb>max){
                    msg = '上传文件不能大于500mb';
                }

                return msg;
            }

            return defer.promise;
        }

        /**
         *文件下载接口
         * @param {*} url
         * @param {{uuidName:String,fileName:String}} cszd
         */
        function downLoadFile (url, cszd) {
            // var url = 'download/?filename=aaa.txt';
            var defer = $q.defer();
            ajaxAnimation.start();
            var fileName = cszd.fileName;
            var uuidName = cszd.uuidName;
            url += '?uuidName=' + uuidName;
            var xhr = new $window.XMLHttpRequest();
            xhr.open('GET', url, true); // 也可以使用POST方式，根据接口
            xhr.responseType = 'blob'; // 返回类型blob
            // 定义请求完成的处理函数，请求前也可以增加加载框/禁用下载按钮逻辑
            xhr.onload = function () {
                ajaxAnimation.end();
                // 请求完成
                if (this.status === 200) {
                    // 返回200
                    var content = this.response;

                    // var elink = document.createElement('a');
                    // elink.download = fileName;
                    // elink.style.display = 'none';
                    // var blob = new Blob([content]);
                    // elink.href = URL.createObjectURL(blob);
                    // document.body.appendChild(elink);
                    // elink.click();
                    // document.body.removeChild(elink);
                    if (!fileName) fileName = new Date().format('yyyy年MM月dd日');
                    var oldFileName = fileNameFromHeader(xhr.getResponseHeader('Content-Disposition'));
                    if (oldFileName != null) {
                        if (fileName.lastIndexOf('.') <= 1) {
                            fileName = fileName + oldFileName.substring(oldFileName.lastIndexOf('.'));
                        } else {
                            fileName = fileName.substring(0, fileName.lastIndexOf('.')) + oldFileName.substring(oldFileName.lastIndexOf('.'));
                        }
                    }
                    try {
                        saveAs(content, fileName);
                    } catch (error) {
                        var reader = new $window.FileReader();
                        reader.readAsDataURL(content); // 转换为base64，可以直接放入a表情href
                        reader.onload = function (e) {
                        // 转换完成，创建一个a标签用于下载
                            var a = document.createElement('a');
                            a.download = fileName;
                            a.href = e.target.result;
                            $('body').append(a); // 修复firefox中无法触发click
                            a.click();
                            $(a).remove();
                            defer.resolve(true);
                        };
                    }
                } else {
                    console.error('下载文件出错');
                    defer.promise = null;
                    defer = null;
                }
            };
            // 发送ajax请求

            xhr.send();
            return defer.promise;
        }

        // 获得文件名
        function fileNameFromHeader (disposition) {
            var result = null;
            if (disposition && /filename=.*/ig.test(disposition)) {
                result = disposition.match(/filename=.*/ig);
                return decodeURI(result[0].split('=')[1]);
            }
            return null;
        }

        function processData (data) {
            if (data === null && data === {}) return {};
            var processData = {};
            if (angular.isObject(data)) {
                angular.forEach(data, function (value, key) {
                    var obj = {};
                    if (!angular.isString(value)) {
                        obj[key] = JSON.stringify(value);
                    } else {
                        obj[key] = value;
                    }
                    angular.extend(processData, obj);
                });
            }
            return processData;
        }
        /**
         * token过期认证
         */
        function tokenPassed () {
            var token = sessionFactory.get('token');
            var tokentimespan = sessionFactory.get('tokentimespan');
            var timestamp = parseInt(Date.parse(new Date()) / 1000);
            var flag = Boolean(token && tokentimespan > timestamp);
            if (flag === false) {
                var modals = angular.element('.modal');
                for (var i = 0; i < modals.length; i++) {
                    var item = modals[i];
                    $(item).scope().$close();
                }
                modals = null;
                item = null;

                sessionFactory.clear();
                $state.go('login');
            }
            return flag;
        }

        // /**
        //  * [setToken 设置token]
        //  */
        // function setToken (token) {
        //     var tokentimespan = parseInt(Date.parse(new Date()) / 1000) + 36000; // token有效期
        //     sessionFactory.set('tokentimespan', tokentimespan);
        //     sessionFactory.set('token', token);
        // }

        this.post = function (url, params, contentType, isNodata, cache, resolve, reject) {
            if (!tokenPassed()) {
                return layer.msg('请求失败：token丢失或者token过期');
                // return $q.reject('请求失败：token丢失或者token过期');
            }
            var ajaxurl = URL_MATCH.test(url) ? url : (_SYS_API_ROOT + url);
            return post(ajaxurl, params, contentType, isNodata, cache, resolve, reject);
        };

        this.get = function (url, params, isNodata, resolve, reject, cache) {
            if (!tokenPassed() && url != '/validateCode/validate') {
                return layer.msg('请求失败：token丢失或者token过期');
                // return $q.reject('请求失败：token丢失或者token过期');
            }
            // ??????????????/
            if (isNodata === true) {
                var ajaxurl = URL_MATCH.test(url) ? url : (_LOGIN_API_ROOT + url);
            } else {
                ajaxurl = URL_MATCH.test(url) ? url : (_SYS_API_ROOT + url);
            }
            return get(ajaxurl, params, isNodata, resolve, reject, cache);
        };

        this.put = function (url, params, resolve, reject, cache) {
            if (!tokenPassed()) {
                return layer.msg('请求失败：token丢失或者token过期');
                // return $q.reject('请求失败：token丢失或者token过期');
            }
            var ajaxurl = URL_MATCH.test(url) ? url : (_SYS_API_ROOT + url);
            return put(ajaxurl, params, resolve, reject, cache);
        };

        this.login = function (url, params, contentType, isNodata) {
            return post(_LOGIN_API_ROOT + url, params, contentType, isNodata);
        };

        this.upLoadFile = function (url, file_data) {
            if (!tokenPassed()) {
                return layer.msg('请求失败：token丢失或者token过期');
                // return $q.reject('请求失败：token丢失或者token过期');
            }
            if (!file_data || file_data.length === 0) return $q.resolve({ code: 1, data: [] });
            if (!userId) {
                userId = JSON.parse(sessionFactory.get('userConfig')).USER_ID;
            }
            return upLoadFile(_FILE_API_ROOT + url, file_data, pjid, userId);
        };

        this.downLoadFile = function (url, file_data) {
            if (!tokenPassed()) {
                return layer.msg('请求失败：token丢失或者token过期');
                // return $q.reject('请求失败：token丢失或者token过期');
            }
            return downLoadFile(_FILE_API_ROOT + url, file_data);
        };
    }]);

    /** =========================================================
    * 拦截$http请求
     ========================================================= */
    app.factory('httpInterceptor', ['$injector', '$q', 'sessionFactory', function ($injector, $q, sessionFactory) {
        /**
         * 开发过程 关于前后台的交互  这边http拦截  在请求的时候加上如果存在token则加上token
         * 在接收response时 后台返回error关于token不存在，则我这边提示重新登录。
         * 登录成功后恢复原来的跳转页面重新进入控制器
         */
        return {
            request: function (config) {
                var token = sessionFactory.get('token');
                // var tokentimespan = sessionFactory.get('tokentimespan');
                // var timestamp = parseInt(Date.parse(new Date()) / 1000);
                // if (!token || tokentimespan < timestamp) {
                //     var state = $injector.get('$state');
                //     layer.msg('登录过期,请重新登录');
                //     return state.go('login');
                // }

                // if (token) config.headers['Authorization'] = token;
                if (token) config.headers['token'] = token;
                config.timeout = config.timeout||15000;
                config.headers["Cache-control"] = "no-cache"; 
                // config.headers["Pragma"] = "no-cache";
                // console.log("发送成功", config);
                return config;
            },
            requestError: function (err) {
                console.log('发送失败', err);
                return $q.reject(err);
            },
            response: function (res) {
                // console.log("请求成功", res);
                if (res.data.code === 100) {
                    // var state = $injector.get('$state');
                    // state.go('login');
                }
                return $q.resolve(res);
            },
            responseError: function (err) {
                // console.log('请求失败', err);
                // var state = $injector.get('$state');
                // state.go('login');
                // layer.msg("服务器异常,请重试");
                layer.msg("网络连接异常,请重试");
                return $q.reject(err);
            },
        };
    }]);

    /** =========================================================
    * 配置$http服务加入http拦截器 加入默认编码格式 application/x-www-form-urlencoded
     ========================================================= */
    app.config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('httpInterceptor');
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
        $httpProvider.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
        // $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
        var param = function param (obj) {
            var query = '';

            var name;

            var value;

            var fullSubName;

            var subName;

            var subValue;

            var innerObj;

            var i;
            for (name in obj) {
                value = obj[name];
                if (value instanceof Array) {
                    for (i = 0; i < value.length; ++i) {
                        subValue = value[i];
                        fullSubName = name + '[' + i + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                } else if (value instanceof Object) {
                    for (subName in value) {
                        subValue = value[subName];
                        fullSubName = name + '[' + subName + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                } else if (value !== undefined && value !== null) {
                    query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
                }
            }
            return query.length ? query.substr(0, query.length - 1) : query;
        };
        $httpProvider.defaults.transformRequest = [function (data) {
            return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
        }];
    }]);

    /** =========================================================
    * 创建加载动画方法
     ========================================================= */
    app.factory('ajaxAnimation', ['$document', function ($document) {
        var animateF = null;
        var count = 0;
        function start () {
            count++;
            if (animateF) return;
            animateF = angular.element(template());
            angular.element('body').append(animateF);
        }
        function end () {
            count--;
            if (!animateF || count !== 0) return;
            animateF.remove();
            animateF = null;
        }
        function template () {
            var str = '<div style="position: fixed; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99999999;top:0;left:0" id="lich-loading" >';
            str += '<div class="sk-circle" style="width: 60px;height: 60px;position: relative;top: 40%;">';
            str += '    <div class="sk-circle1 sk-child"></div>';
            str += '    <div class="sk-circle2 sk-child"></div>';
            str += '    <div class="sk-circle3 sk-child"></div>';
            str += '    <div class="sk-circle4 sk-child"></div>';
            str += '    <div class="sk-circle5 sk-child"></div>';
            str += '    <div class="sk-circle6 sk-child"></div>';
            str += '    <div class="sk-circle7 sk-child"></div>';
            str += '    <div class="sk-circle8 sk-child"></div>';
            str += '    <div class="sk-circle9 sk-child"></div>';
            str += '    <div class="sk-circle10 sk-child"></div>';
            str += '    <div class="sk-circle11 sk-child"></div>';
            str += '    <div class="sk-circle12 sk-child"></div>';
            str += '</div></div>';
            return str;
        }
        return {
            start: start,
            end: end
        };
    }]);

    /** =========================================================
    * 使用get方式请求导出 ， window.open打开窗口
    * example :     ahExport.openUrl("SystemDoc/exportSystemDocCheckList",vm.page);
     ========================================================= */
    app.service('ah.export.excel', ['$window','APIMODULE','ah.export.utils', function ($window,APIMODULE,utils) {
        var token = null;
        this.openUrl = function (url,params) {
            if(!token) params.token = utils.getToken();
            window.open(utils.packUrlParams(APIMODULE._SYS_API_ROOT+ url , params),"_blank");
        };
    }]);

    app.service('ah.export.pdf', ['$window','ah.export.utils','APIMODULE',function ($window,utils,APIMODULE) {
        var token = null;
        // if(!token) 
        this.openUrl = function (url,id,params) {
            token = utils.getToken();
            if(params == undefined) params = {}; 
            params.id = id;
            params.token = token;
            window.open(utils.packUrlParams(APIMODULE._SYS_API_ROOT+ url , params),"_blank");
        };
    }]);

    app.service('ah.export.word', ['$window','ah.export.utils','APIMODULE',function ($window,utils,APIMODULE) {
        var token = null;
        // if(!token)
        this.openUrl = function (url,id,params) {
            token = utils.getToken();
            if(params == undefined) params = {}; 
            params.id = id;
            params.token = token;
            window.open(utils.packUrlParams(APIMODULE._SYS_API_ROOT+ url , params),"_blank");
        };
    }]);

    app.service('ah.export.utils',["$rootScope",function ($rootScope) {
        this.packUrlParams = function (url,params) {
            var data = params ? ( "?" + param(params)) : "";
            return url + data;
        };

        this.getToken = function () {
            return $rootScope.app.token;
        };

        function param (obj) {
            var query = '';
    
            var name;
    
            var value;
    
            var fullSubName;
    
            var subName;
    
            var subValue;
    
            var innerObj;
    
            var i;
            for (name in obj) {
                value = obj[name];
                if (value instanceof Array) {
                    for (i = 0; i < value.length; ++i) {
                        subValue = value[i];
                        fullSubName = name + '[' + i + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                } else if (value instanceof Object) {
                    for (subName in value) {
                        subValue = value[subName];
                        fullSubName = name + '[' + subName + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                } else if (value !== undefined && value !== null) {
                    query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
                }
            }
            return query.length ? query.substr(0, query.length - 1) : query;
        }
    }]);


    app.factory('ah.export',['ah.export.excel','ah.export.pdf','ah.export.word',function(excel,pdf,word){
        return function (type) {
            var utils = null;
            switch (type) {
            case "excel":  utils =  excel ;break;
            case "pdf":  utils =  pdf ;break;
            case "word":  utils =  word ;break;
            default: throw("无定义的方法");
            }
            return utils;
        };
    }]);

    app.directive("adDirective",[function () {
        return {
            scope:true,
            template:
                   "<div class='ad ' ng-if='vm.isShow'>"  +
                   "   <div class='ad__bg'>" + 
                    "<div class='adContaint'>"+
                   '  <button type="button" class="btn btn-link  pull-right adContaint__removeBtn" ng-click="vm.isShow = false"><i class="icon-remove-circle"></i></button> '+
                    "       <div class='adContaint__bg'>" + 
                    "        <div class='adContaint__text'> {{vm.text}}</div>" +
                    " <div class='adContaint__bottomBtn'><input type='checkbox' id='adDirective' ng-model='vm.isChecked' ng-change='vm.change()' /><label for='adDirective'></label>不再提示</div>" +
                    "<div>"+
                   "     </div>" +
                   "   </div>" +
                   "   </div>" 
            ,
            controllerAs:"vm",
            controller:function(){
                var vm = this;
                var isSHow = localStorage.getItem("adIsShow");
                vm.isShow =  isSHow ? (isSHow == "true"): true;
                vm.text = "请大家及时进行试运行过程中系统的使用，有任何问题可以及时在左边菜单栏中进行及时反馈";
                vm.change = function () {
                    localStorage.setItem("adIsShow",!vm.isChecked);
                };
            }
        };
    }]);

    app.service('$encryption',['$window',function ($window) {
        this.MD5= function (sMessage) {
            function RotateLeft(lvalue, iShiftBits) {
                return (lvalue<<iShiftBits) | (lvalue>>>(32-iShiftBits));
            }
            function AddUnsigned(lX,lY) {
                var lX4,lY4,lX8,lY8,lResult;
                lX8 = (lX & 0x80000000);
                lY8 = (lY & 0x80000000);
                lX4 = (lX & 0x40000000);
                lY4 = (lY & 0x40000000);
                lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
                if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
                if (lX4 | lY4) {
                    if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                    else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }else return (lResult ^ lX8 ^ lY8);
            }

            function F(x,y,z) { return (x & y) | ((~x) & z); }

            function G(x,y,z) { return (x & z) | (y & (~z)); }

            function H(x,y,z) { return (x ^ y ^ z); }

            function I(x,y,z) { return (y ^ (x | (~z))); }

            function FF(a,b,c,d,x,s,ac) {
                a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
                return AddUnsigned(RotateLeft(a, s), b);
            }
            function GG(a,b,c,d,x,s,ac) {
                a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
                return AddUnsigned(RotateLeft(a, s), b);
            }
            function HH(a,b,c,d,x,s,ac) {
                a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
                return AddUnsigned(RotateLeft(a, s), b);
            }
            function II(a,b,c,d,x,s,ac) {
                a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
                return AddUnsigned(RotateLeft(a, s), b);
            }
            function ConvertToWordArray(sMessage) {
                var lWordCount;
                var lMessageLength = sMessage.length;
                var lNumberOfWords_temp1=lMessageLength + 8;
                var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
                var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
                var lWordArray=Array(lNumberOfWords-1);
                var lBytePosition = 0;
                var lByteCount = 0;
                while ( lByteCount < lMessageLength ) {
                    lWordCount = (lByteCount-(lByteCount % 4))/4;
                    lBytePosition = (lByteCount % 4)*8;
                    lWordArray[lWordCount] = (lWordArray[lWordCount] | (sMessage.charCodeAt(lByteCount)<<lBytePosition));
                    lByteCount++;
                }
                lWordCount = (lByteCount-(lByteCount % 4))/4;
                lBytePosition = (lByteCount % 4)*8;
                lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
                lWordArray[lNumberOfWords-2] = lMessageLength<<3;
                lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
                return lWordArray;
            }
            function WordToHex(lvalue) {
                var WordToHexvalue="",WordToHexvalue_temp="",lByte,lCount;
                for (lCount = 0;lCount<=3;lCount++) {
                    lByte = (lvalue>>>(lCount*8)) & 255;
                    WordToHexvalue_temp = "0" + lByte.toString(16);
                    WordToHexvalue = WordToHexvalue + WordToHexvalue_temp.substr(WordToHexvalue_temp.length-2,2);
                }
                return WordToHexvalue;
            }

            var x=Array();
            var k,AA,BB,CC,DD,a,b,c,d;
            var S11=7, S12=12, S13=17, S14=22;
            var S21=5, S22=9 , S23=14, S24=20;
            var S31=4, S32=11, S33=16, S34=23;
            var S41=6, S42=10, S43=15, S44=21;
            // Steps 1 and 2. Append padding bits and length and convert to words
            x = ConvertToWordArray(sMessage);
            // Step 3. Initialise
            a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
            // Step 4. Process the message in 16-word blocks
            for (k=0;k<x.length;k+=16) {
                AA=a; BB=b; CC=c; DD=d;
                a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
                d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
                c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
                b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
                a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
                d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
                c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
                b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
                a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
                d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
                c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
                b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
                a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
                d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
                c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
                b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
                a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
                d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
                c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
                b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
                a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
                d=GG(d,a,b,c,x[k+10],S22,0x2441453);
                c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
                b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
                a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
                d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
                c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
                b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
                a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
                d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
                c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
                b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
                a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
                d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
                c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
                b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
                a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
                d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
                c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
                b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
                a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
                d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
                c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
                b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
                a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
                d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
                c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
                b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
                a=II(a,b,c,d,x[k+0], S41,0xF4292244);
                d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
                c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
                b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
                a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
                d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
                c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
                b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
                a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
                d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
                c=II(c,d,a,b,x[k+6], S43,0xA3014314);
                b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
                a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
                d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
                c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
                b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
                a=AddUnsigned(a,AA); b=AddUnsigned(b,BB); c=AddUnsigned(c,CC); d=AddUnsigned(d,DD);
            }
            // Step 5. Output the 128 bit digest
            var temp= WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
            return temp.toLowerCase();
        };
    }]);

    /**
     * 权限控制
     * 1.根据部门
     * 2.根据角色
     * 3.根据菜单
     * 4.根据职级
     */
    app.service("msaPower.factory",['msaPower.service',function (msaPowerService) {
        
        return function (current) {
            var result = {};
            if(current.deptId){
                result.isDept = msaPowerService.passDept(current.deptId);
            }
            if(current.roleName){
                result.isRole = msaPowerService.passRole(current.roleName);
            }
            if(current.powerId){
                result.isPower = msaPowerService.passPower(current.powerId);
            }

            result.isPass =  !!(result.isDept || result.isRole || result.isPower);
            return result;
        };
    }]);
    app.service("msaPower.service",['$rootScope','SIGN',function ($rootScope,SIGN) {
        var DEPTID = $rootScope.app.userConfig.DEPT_ID;
        var ROLELIST = $rootScope.app.roleList;
        var USERPOWER = $rootScope.app.userPower;
        // var DEPTNAMELIST = null;
        // SIGN.get("/notice/selectDeptList").then(function(res) {
        //     DEPTNAMELIST = res.reduce(function (prev,item) {
        //         prev[item.deptName] = prev[item.deptId];
        //         return prev;
        //     },{});
        // });

        var ROLENAMELIST = {
            "局领导": "TLCVmm580bUF6f",
            "部门长": "TLCVmy186wgwPJ",
            "体系管理员": "TMLKGB269yc2US",
            "用款事项管理员": "TMUU3F868usqTW",
            "默认角色": "UBJP8u63nU1nX",
            "办公室主任": "UDLPRr692aZzc5",
            "公文管理员": "TMLKGB269yc2US1",
            "固定资产技术管理部门-经办人": "UEDKCU312lS19k",
            "人教管理员": "UEKU7t979IbHMF",
            "财务管理员": "UEKUkn3227aTva",
            "车辆管理员": "UESVCz422ZzrPL",
            "车辆维修管理员": "UESVDx690RRVLl",
            "低值易耗品管理员": "UESVFZ708ZWMJQ",
            "信息化设备管理员": "UESVGH9NIkpC",
            "设备设施维修管理员（后勤）": "UESVJ6332HFyDF",
            "办公用品、床上用品管理员": "UESVNs637Jew4r",
            "用餐登记": "UESVQB250QkVke",
            "履约团队管理员": "UESVWD776P9SjV",
            "业务廉政报告": "UESVY8213tCq2h",
            "会议管理员": "UESV3P393DAmZA",
            "先进典型管理员": "UESV4i525oOJtJ",
            "局办公室": "UESV9r8813UmxY",
            "党工部管理员": "UESVf4876kdams",
            "党委管理员": "UESVjX328faDte",
            "工作督办管理员": "UESVl626X7COP",
            "测试角色": "UESWMp650TujGV",
            "办公室分管局领导": "UFKP5m166PvDzG",
            "“不诚信行为”纪检部门管理员": "UFWJca1947ur6k",
            "部门领导": "TLCVmy186wgwld",
            "局长": "TLCVmy186jz",
            "设备购置需求管理员": "TM5PP1656Dh8Ca",
            "系统管理员": "UESWR6281Rw8ZM"
        };

        this.passDept = function (deptId) {
            return DEPTID === deptId ;
        };
        this.passRole = function (roleName) {
            var roleId = ROLENAMELIST[roleName];
            return !!ROLELIST.find(function (item) {
                return item.ROLE_ID  === roleId;
            });
        };
        this.passPower = function (pwoerId) {
            return !!USERPOWER[pwoerId];
        };
    }]);

    // //配置富文本框
    // app.config(['$provide',function($provide) {
    //     $provide.decorator('taOptions', ['$delegate', function(taOptions) {
    //         taOptions.toolbar = [
    //             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
    //             ['bold', 'italics', 'underline', 'ol',  'undo', 'clear'],
    //             ['justifyLeft','justifyCenter','justifyRight', 'justifyFull'],
    //             [ 'insertLink', 'wordcount', 'charcount'],
    //             // ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
    //             // ['bold', 'italics', 'underline', 'ol', 'redo', 'undo', 'clear'],
    //             // ['justifyLeft','justifyCenter','justifyRight', 'justifyFull'],
    //             // ['html', 'insertImage', 'insertLink', 'wordcount', 'charcount'],
    //         ];
          
    //         return taOptions;}]);
    // }]);


   

})(angular);

(()=>{
    console.log(1);
})();