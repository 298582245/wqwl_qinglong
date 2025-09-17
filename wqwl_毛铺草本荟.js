/**
 * 脚本：wqwl_毛铺草本荟.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序毛铺草本荟
 * 环境变量：wqwl_mpcbh，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的authorization，格式例如：authorization#备注1（authorization去掉Bearer ）
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 0 * * * 一天一次即可
 */

const axios = require('axios');
const fs = require('fs');

const city = process.env["wq_mp_diqu"] || "上海市";//不知道影不影响中奖，觉得影响自己改成自己的就行

//代理链接
let proxy = process.env["wqwl_daili"] || '';

//是否用代理，默认使用（填了代理链接）
let isProxy = process.env["wqwl_useProxy"] || true;

//并发数，默认3
let bfs = process.env["wqwl_bfs"] || 3;

// 是否通知
let isNotify = true;

//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_mpcbh';

//脚本名称
const name = '微信小程序毛铺草本荟'

!(async function () {
    let wqwlkj;

    const filePath = 'wqwl_require.js';
    const url = 'https://raw.githubusercontent.com/298582245/wqwl_qinglong/refs/heads/main/wqwl_require.js';

    if (fs.existsSync(filePath)) {
        console.log('✅wqwl_require.js已存在，无需重新下载，如有报错请重新下载覆盖\n');
        wqwlkj = require('./wqwl_require');
    } else {
        console.log('正在下载wqwl_require.js，请稍等...\n');
        console.log(`如果下载过慢，可以手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本`)
        console.log('地址：' + url);
        try {
            const res = await axios.get(url);
            fs.writeFileSync(filePath, res.data);
            console.log('✅下载完成，准备开始运行脚本\n');
            wqwlkj = require('./wqwl_require');
        } catch (e) {
            console.log('❌下载失败，请手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本\n');
            console.log('地址：' + url);
            return; // 下载失败，不再继续执行
        }
    }

    // 确保 require 成功后才继续执行
    try {
        wqwlkj.disclaimer();


        let notify;
        if (isNotify) {
            try {
                notify = require('./sendNotify');
                console.log('✅加载发送通知模块成功');
            } catch (e) {
                console.log('❌加载发送通知模块失败');
                notify = null
            }
        }



        class Task {
            constructor(ck) {
                this.index = index++;
                this.baseURL = 'https://mpb.jingjiu.com/proxy-he/api'
                this.ck = ck

                this.maxRetries = 3; // 最大重试次数
                this.retryDelay = 3; // 重试延迟(秒)

                //活动列表
                this.activityConfig = {
                    lab: {
                        startUrl: '/BlzLonglActivity/caobenshiyanshiUserDrawGet',
                        endUrl: '/BlzLonglActivity/caobenshiyanshiUserDraws',
                        mainUrl: '/BlzLonglActivity/caobenshiyanshiUserMains',
                        name: '实验室'
                    },
                    herb: {
                        startUrl: '/BlzLonglActivity/shicaoxunyuanUserDrawGet',
                        endUrl: '/BlzLonglActivity/shicaoxunyuanUserDraws',
                        mainUrl: '/BlzLonglActivity/shicaoxunyuanUserMains',
                        name: '分药材'
                    }
                    // 添加新活动只需在这里新增配置即可
                };
            }

            async init(ck) {
                const ckData = ck.split('#')
                if (ckData.length < 1) {
                    return this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 1) {
                    this.remark = ckData[0].slice(0, 8);
                }
                else {
                    this.remark = ckData[1];
                }
                this.auth = ckData[0];
                if (proxy && isProxy) {
                    this.proxy = await wqwlkj.getProxy(this.index, proxy)
                    //console.log(`使用代理：${this.proxy}`)
                    this.sendMessage(`✅使用代理：${this.proxy}`)
                }
                else {
                    this.proxy = ''
                    this.sendMessage(`⚠不使用代理`)
                }
            }
            // 签到
            async sign() {
                try {
                    if (!(this.auth))
                        return '授权过期'
                    const data = { date: this.getToday() }
                    const headers = this.getAppSign(data, ['date'])
                    const options = {
                        url: `${this.baseURL}/FlanSignInDaily/adds`,
                        headers: headers,
                        method: 'POST',
                        data: data
                    }
                    //console.log(options)
                    const result = await this.request(options, 0)
                    // console.log(JSON.stringify(result))
                    if (result.code !== 0)
                        return this.sendMessage(result.message)
                    if (result.data.point_today && result.data.point_tomorrow)
                        return this.sendMessage(`✅签到成功，获得${result.data.point_today}积分，明天将获得${result.data.point_tomorrow}积分`, true)
                } catch (e) {
                    throw new Error(`❌签到接口请求失败，${e.message}`)
                }
            }

            //谁是5冕之王
            async wumianStart() {
                try {
                    if (!(this.auth))
                        return;

                    const data = { "activity_code": "", "city": city };//地区自己改吧
                    const headers = this.getAppSign(data, ['activity_code', 'city']);
                    const options = {
                        url: `${this.baseURL}/BlzLongcaobenActivity/wumianUserMains`,
                        headers: headers,
                        method: 'POST',
                        data: data
                    };

                    const result = await this.request(options, 0);
                    // console.log(JSON.stringify(result))
                    if (result?.code !== 0)
                        return this.sendMessage(`谁是5冕之王获取次数失败，原因：${result.message}`);

                    if (result?.data?.today_play_num_can) {
                        this.sendMessage(`谁是5冕之王剩余次数：${result?.data?.today_play_num_can}`);
                    }
                    if (result?.data?.today_play_num_can > 0 && result?.data?.activity?.activity_id) {
                        this.sendMessage(`开始谁是5冕之王...`)
                        const data2 = { "activity_id": result?.data?.activity?.activity_id };
                        const headers2 = this.getAppSign(data, ['activity_id']);
                        const options2 = {
                            url: `${this.baseURL}/BlzLongcaobenActivity/wumianUserMains`,
                            headers: headers2,
                            method: 'POST',
                            data: data2
                        };

                        const result2 = await this.request(options2, 0);
                        if (result2?.code !== 0)
                            return this.sendMessage(`谁是5冕之王获取信息失败，原因：${result2.message}`);
                        const data3 = { "activity_id": result?.data?.activity?.activity_id, 'play_time_start': Math.floor(Date.now() / 1000) };
                        const headers3 = this.getAppSign(data, ['activity_id', 'play_time_start']);
                        const options3 = {
                            url: `${this.baseURL}/BlzLongcaobenActivity/wumianUserDrawGet`,
                            headers: headers3,
                            method: 'POST',
                            data: data3
                        };

                        const result3 = await this.request(options3, 0);
                        if (result3?.code !== 0)
                            return this.sendMessage(`谁是5冕之王开始失败，原因：${result3.message}`);
                        await wqwlkj.sleep(wqwlkj.getRandom(30, 40))
                        if (result3?.data?.user_record_id) {
                            this.sendMessage(`获取到游戏记录id：${result3?.data?.user_record_id}`)
                            const data4 = { "user_record_id": result3?.data?.user_record_id, 'play_time_finish': Math.floor(Date.now() / 1000) };
                            const headers4 = this.getAppSign(data, ['user_record_id', 'play_time_finish']);
                            const options4 = {
                                url: `${this.baseURL}/BlzLongcaobenActivity/wumianUserDraws`,
                                headers: headers4,
                                method: 'POST',
                                data: data4
                            };

                            const result4 = await this.request(options4, 0);
                            if (result4?.code !== 0)
                                return this.sendMessage(`谁是5冕之王结束失败，原因：${result4.message}`);
                            this.sendMessage(`✅谁是5冕之王成功，获得${result4?.data?.award?.AwardName || result4?.data?.awardLocal?.title || '未识别'}`, true);

                        }
                        else {
                            this.sendMessage(`❌谁是5冕之王user_record_id获取失败`)
                        }

                    }
                    else {
                        this.sendMessage(`❌谁是5冕之王activity_code获取失败`)
                    }
                } catch (e) {
                    throw new Error(`❌谁是5冕之王请求接口失败，${e.message}`);
                }
            }

            //周五专属
            async memberdayStart() {
                if (!this.isAfterFriday8AM())
                    return this.sendMessage(`⚠️非周五8:00-22:00时间段，不执行`)
                try {
                    if (!(this.auth))
                        return;

                    const data = {};
                    const headers = this.getAppSign(data, []);
                    const options = {
                        url: `${this.baseURL}/BlzWeekActivity/memberdayUserMains`,
                        headers: headers,
                        method: 'POST',
                        data: data
                    };

                    const result = await this.request(options, 0);
                    if (result.code !== 0)
                        return this.sendMessage(result.message);

                    if (result.data.is_draw) {
                        this.sendMessage(`周五俱乐部剩余次数：${result.data.is_draw}`);
                    }
                    if (result.data.draw_ticket && result.data.is_draw > 0) {
                        this.sendMessage(`开始周五俱乐部...`)
                        await wqwlkj.sleep(wqwlkj.getRandom(10, 20))
                        const data = { draw_ticket: result.data.draw_ticket }
                        const headers = this.getAppSign(data, ['draw_ticket']);
                        const options = {
                            url: `${this.baseURL}/BlzWeekActivity/memberdayUserDraws`,
                            headers: headers,
                            method: 'POST',
                            data: data
                        };

                        const result2 = await this.request(options, 0);
                        if (result.code !== 0)
                            return this.sendMessage(result.message)
                        this.sendMessage(`✅周五俱乐部成功，获得${result2?.data?.AwardName || result2?.data?.awardLocal?.title || '未识别'}`, true);
                    }
                    else {
                        this.sendMessage(`周五俱乐部获取ticket失败`)
                    }
                } catch (e) {
                    throw new Error(`❌周五俱乐部请求接口失败，${e.message}`);
                }
            }
            isAfterFriday8AM(date = new Date()) {
                if (date.getDay() !== 5) {
                    return false;
                }

                const hours = date.getHours();
                const minutes = date.getMinutes();
                const totalMinutes = hours * 60 + minutes;

                // 8:00 = 480分钟, 22:00 = 1320分钟
                return totalMinutes >= 480 && totalMinutes <= 1320;
            }
            // 通用次数查询函数
            async commonUserMains(activityType) {
                try {
                    if (!(this.auth))
                        return;

                    if (!this.activityConfig[activityType]) {
                        throw new Error(`未知的活动类型: ${activityType}`);
                    }

                    const data = {};
                    const headers = this.getAppSign(data, []);
                    const options = {
                        url: `${this.baseURL}${this.activityConfig[activityType].mainUrl}`,
                        headers: headers,
                        method: 'POST',
                        data: data
                    };

                    const result = await this.request(options, 0);
                    if (result.code !== 0)
                        return this.sendMessage(result.message);

                    if (result.data.today_play_num_can) {
                        this.sendMessage(`${this.activityConfig[activityType].name}剩余次数：${result.data.today_play_num_can}`);
                    }
                    return result.data.today_play_num_can;
                } catch (e) {
                    throw new Error(`❌${this.activityConfig[activityType]?.name || activityType}次数请求接口失败，${e.message}`);
                }
            }


            // 通用开始函数
            async commonDrawGet(activityType) {
                try {
                    if (!(this.auth))
                        return;

                    if (!this.activityConfig[activityType]) {
                        throw new Error(`未知的活动类型: ${activityType}`);
                    }

                    const data = {
                        "play_time_start": Math.round(Date.now() / 1000),
                        "use_type": "free"
                    };

                    const headers = this.getAppSign(data, ['play_time_start', 'use_type']);
                    const options = {
                        url: `${this.baseURL}${this.activityConfig[activityType].startUrl}`,
                        headers: headers,
                        method: 'POST',
                        data: data
                    };

                    const result = await this.request(options, 0);
                    if (result.code !== 0)
                        return this.sendMessage(result.message);
                    if (result.data.user_record_id)
                        return result.data.user_record_id;
                } catch (e) {
                    throw new Error(`❌${this.activityConfig[activityType]?.name || activityType}请求接口失败，${e.message}`);
                }
            }

            // 通用结束函数
            async commonDraws(activityType, userRecordId) {
                try {
                    if (!(this.auth))
                        return;

                    if (!this.activityConfig[activityType]) {
                        throw new Error(`未知的活动类型: ${activityType}`);
                    }

                    const data = {
                        "play_time_finish": Math.round(Date.now() / 1000),
                        "user_record_id": userRecordId
                    };

                    const headers = this.getAppSign(data, ['play_time_finish', 'user_record_id']);
                    const options = {
                        url: `${this.baseURL}${this.activityConfig[activityType].endUrl}`,
                        headers: headers,
                        method: 'POST',
                        data: data
                    };

                    const result = await this.request(options, 0);
                    if (result.code !== 0)
                        return this.sendMessage(result.message);

                    this.sendMessage(`✅${this.activityConfig[activityType].name}成功，获得${result.data.title || result.data.awardLocal.title || '识别失败了'}`, true);
                } catch (e) {
                    throw new Error(`❌请求${this.activityConfig[activityType]?.name || activityType}结束接口失败，${e.message}`);
                }
            }
            //观看视频
            async taskViewVideoView() {
                try {
                    if (!(this.auth))
                        return
                    const data = {
                        "video_id": "video-117"
                    }
                    const headers = this.getAppSign(data, [])
                    const options = {
                        url: `${this.baseURL}/BlzAppletIndex/taskViewVideoView`,
                        headers: headers,
                        method: 'POST',
                        data: data
                    }
                    const result = await this.request(options, 0)
                    //console.log(JSON.stringify(result))
                    if (result.code !== 0)
                        return this.sendMessage(result.message)
                    if (result.data.point === 0)
                        return this.sendMessage('❌今日已观看过视频了')
                    this.sendMessage(`✅观看视频成功，${result.data.task.description || '识别失败了'}`, true)
                    //console.log(JSON.stringify(result))
                } catch (e) {
                    throw new Error(`❌请求观看视频接口失败，${e.message}`)
                }
            }
            //订阅消息
            async taskSubscribeMessage() {
                try {
                    if (!(this.auth))
                        return
                    const data = {
                        "tag": "subscribe_message_202410"
                    }
                    const headers = this.getAppSign(data, [])
                    const options = {
                        url: `${this.baseURL}/BlzAppletIndex/taskSubscribeMessage`,
                        headers: headers,
                        method: 'POST',
                        data: data
                    }
                    const result = await this.request(options, 0)
                    if (result.code !== 0)
                        return this.sendMessage(result.message)
                    if (result.data.point === 0)
                        return this.sendMessage('❌今日已订阅过消息了')
                    this.sendMessage(`✅订阅消息成功，${result.data.task.description || '识别失败了'}`, true)
                    //
                } catch (e) {
                    throw new Error(`❌请求订阅消息接口失败，${e.message}`)
                }
            }
            // 获取信息
            async userInfo() {
                try {
                    if (!(this.auth))
                        return
                    const data = {

                    }
                    const headers = this.getAppSign(data, ['play_time_finish', 'user_record_id'])
                    const options = {
                        url: `${this.baseURL}/user?is_jifen_clear_data=1`,
                        headers: headers,
                        method: 'GET',
                    }
                    const result = await this.request(options, 0)
                    if (result.code !== 0)
                        return this.sendMessage(result.message)
                    this.sendMessage(`用户【${result.data.name}】积分：${result.data.point}`, true)

                } catch (e) {
                    throw new Error(`❌获取信息接口失败，${e.message}`)
                }
            }



            getAppSign(o, e) {
                if (!this.ua)
                    this.ua = wqwlkj.generateRandomUA()
                var a = Math.round(Date.now() / 1000);
                var i = "DYSHJS^M&.YXZRGS";
                var s = this.auth
                var c = "";
                e.forEach(key => {
                    if (o.hasOwnProperty(key)) {
                        c += key + o[key].toString();
                    }
                });
                c = a + c + i + s;
                //console.log(c)
                var r = {
                    'User-Agent': this.ua,
                    "accept": "*/*",
                    "accept-language": "zh-CN,zh;q=0.9",
                    apptime: a,
                    appsign: wqwlkj.md5(c, true).substr(-10),
                    Authorization: s,
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "x-version": "0.0.1",
                    "xweb_xhr": "1",
                    "Referer": "https://servicewechat.com/wxefd0fe341e06b815/508/page-frame.html",
                    "Referrer-Policy": "unsafe-url"
                };
                return r;
            }

            getToday() {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份补零
                const day = String(now.getDate()).padStart(2, '0');        // 日期补零

                return `${year}-${month}-${day}`;
            }

            async main() {
                await this.init(this.ck)
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                this.sendMessage(`开始签到...`)
                const result = await this.sign()
                if (result == '' || result == null || result == undefined || result === '授权过期')
                    return this.sendMessage('❌授权已过期或ck无效，请重新获取', true)
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.wumianStart()
                // 遍历所有配置的活动
                for (const [activityType, config] of Object.entries(this.activityConfig)) {
                    this.sendMessage(`开始${config.name}游戏...`);

                    // 查询剩余次数
                    const times = await this.commonUserMains(activityType);

                    if (times > 0) {
                        // 开始活动
                        const recordId = await this.commonDrawGet(activityType);

                        if (recordId) {
                            // 随机等待时间
                            const delay = wqwlkj.getRandom(30, 40);
                            await wqwlkj.sleep(delay);

                            // 结束活动
                            await this.commonDraws(activityType, recordId);
                        }
                    }

                    // 活动间间隔
                    await wqwlkj.sleep(wqwlkj.getRandom(3, 5));
                }

                this.sendMessage(`开始观看视频`)
                await this.taskViewVideoView()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))

                this.sendMessage(`开始订阅消息..`)
                await this.taskSubscribeMessage()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))

                await this.memberdayStart()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))

                this.sendMessage(`开始获取个人信息...`)
                await this.userInfo()
            }
            // 带重试机制的请求方法
            async request(options, retryCount = 0) {
                try {
                    const data = await wqwlkj.request(options, this.proxy);
                    return data;

                } catch (error) {
                    this.sendMessage(`🔐检测到请求发生错误，正在重试...`)
                    let newProxy;
                    if (isProxy) {
                        newProxy = await wqwlkj.getProxy(this.index, proxy);
                        this.proxy = newProxy
                        this.sendMessage(`✅代理更新成功:${this.proxy}`);
                    } else {
                        this.sendMessage(`⚠️未使用代理`);
                        newProxy = true
                    }

                    if (retryCount < this.maxRetries && newProxy) {
                        this.sendMessage(`🕒${this.retryDelay * (retryCount + 1)}s秒后重试...`);
                        await wqwlkj.sleep(this.retryDelay * (retryCount + 1));
                        return await this.request(options, retryCount + 1);
                    }

                    throw new Error(`❌请求最终失败: ${error.message}`);
                }
            }

            sendMessage(message, isPush = false) {
                message = `账号[${this.index + 1}](${this.remark}): ${message}`
                if (isNotify && isPush) {
                    return wqwlkj.sendMessage(message + "\n")
                }
                console.log(message)
            }

        }

        console.log(`${name}开始执行...`);
        const tokens = wqwlkj.checkEnv(process.env[ckName]);
        //console.log(`共${tokens.length}个账号`);
        const totalBatches = Math.ceil(tokens.length / bfs);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * bfs;
            const end = start + bfs;
            const batch = tokens.slice(start, end);

            console.log(`开始执行第 ${batchIndex + 1} 批任务 (${start + 1}-${Math.min(end, tokens.length)})`);

            const taskInstances = batch.map(token => new Task(token));
            const tasks = taskInstances.map(instance => instance.main());
            const results = await Promise.allSettled(tasks);

            results.forEach((result, index) => {
                const task = taskInstances[index];
                if (result.status === 'rejected') {
                    task.sendMessage(result.reason);
                }
            });

            await wqwlkj.sleep(wqwlkj.getRandom(3, 5));
        }

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();