


/**
 * 脚本：wqwl_银鱼（通用版）.js
 * 作者：wqwlkj 裙：960690899
 * 描述：小程序：银鱼质亨，不一定，搜索 银愉 关键字，橙色图标应该就是了
 * 环境变量：wqwl_yinyu，多个换行或新建多个变量
 * 环境变量描述：抓包能提现的小程序的headers下的Authori-zation和Form-type，这里要的是能提现的Form-type，格式auth1#type1#备注1
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 15 0 0,23 * * *
 */


/**
 * 各个小程序之间的ck是互通的，小程序用越新的越好。
 * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
 * ⚠️1. 如果没有你能获取视频的route,请自行添加到VIDEO_FROM_TYPES. ⚠️
 * ⚠️2. 提示提现失败的,找到能手动提现的小程序,填入他的Form-type.   ⚠️
 * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
 */


//如果没有你能获取视频的route，请自行添加到VIDEO_FROM_TYPES
//路由列表，多个循环尝试获取视频列表，可自行添加，已经远程获取，如果有不同，可以联系提供：远程数据地址https://gitee.com/cobbWmy/img/raw/staticApi/data/%E9%93%B6%E9%B1%BCroute.json
let VIDEO_FROM_TYPES = [
    "routine-zhixiang",
    "routine-jylantian",
    "routine-yipin",
    "routine-zhixiang",
    "routine-shenghuo",
    "routine-jiangxuan",
    "routine-tuangou"
]


const axios = require('axios');
const fs = require('fs');

//代理链接
let proxy = process.env["wqwl_daili"] || '';

//是否用代理，默认使用（填了代理链接）
let isProxy = process.env["wqwl_useProxy"] || false;

//并发数，默认4
let bfs = process.env["wqwl_bfs"] || 4;

// 是否通知
let isNotify = true;

//账号索引
let index = 0;

//开启则打印每一次请求的返回结果
let isDebug = false;

//ck环境变量名
const ckName = 'wqwl_yinyu';

//脚本名称
const name = '微信小程序银鱼质亨'


//银鱼专属方法
async function getVideoRoute() {
    const config = {
        method: 'get',
        url: `https://gitee.com/cobbWmy/img/raw/staticApi/data/%E9%93%B6%E9%B1%BCroute.json`
    };
    try {
        const res = await axios(config)
        const data = res.data
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (parseError) {
                // console.log("获取远程route配置失败，使用默认配置")
            }
        }
        if (Array.isArray(data)) {
            // 找出data中存在但VIDEO_FROM_TYPES中不存在的元素
            const newItems = data.filter(item => !VIDEO_FROM_TYPES.includes(item));

            // 将新的元素追加到原数组后面
            VIDEO_FROM_TYPES = VIDEO_FROM_TYPES.concat(newItems);
            console.log(`✅ 成功获取远程route配置,目前共【${VIDEO_FROM_TYPES.length}】个route`);
        }
        else {
            console.log("❌ 获取远程route配置失败，使用默认配置")
        }

    }
    catch (e) {
        console.log("❌ 获取远程route配置失败，使用默认配置")

    }

}

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
        if (typeof wqwlkj.findTypes == "function") {
            let type = await wqwlkj.findTypes(name);
            console.log(`============================
🚀 当前脚本：${name} 🚀
📂 所属分类：${type} 📂
============================\n`)
        }
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
        await getVideoRoute()

        let fileData = wqwlkj.readFile('yinyu')
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://n03.sentezhenxuan.com/api'
                this.maxRetries = 3; // 最大重试次数
                this.retryDelay = 3; // 重试延迟(秒)
                this.money = 0;

            }
            async init() {
                const ckData = this.ck.split('#')
                if (ckData.length < 2) {
                    this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                    return false;
                }
                else if (ckData.length === 2) {
                    this.remark = `${ckData[0].slice(0, 8)}-${this.index}`;
                }
                else {
                    this.remark = ckData[2];
                }
                this.auth = ckData[0];
                this.type = ckData[1];
                if (!/^[A-Za-z-]+$/.test(this.type)) {
                    this.sendMessage(`⚠️没传正确的Form-type，使用默认值：routine-tuangou（提现失败请手动替换）`)
                    this.type = 'routine-tuangou';
                }
                if (!VIDEO_FROM_TYPES.includes(this.type))
                    VIDEO_FROM_TYPES.unshift(this.type)
                if (!fileData[this.remark])
                    fileData[this.remark] = this.type

                //优先使用缓存route
                const targetValue = fileData[this.remark]
                const index = VIDEO_FROM_TYPES.indexOf(targetValue)
                if (index > -1) {
                    VIDEO_FROM_TYPES.splice(index, 1)
                }
                VIDEO_FROM_TYPES.unshift(targetValue)

                if (!this.auth.includes('Bearer'))
                    this.auth = `Bearer ${this.auth}`
                const jwtData = this.parseJWT(this.auth)
                //  console.log(jwtData)
                if (jwtData?.payload?.iss)
                    this.baseUrl = `https://${jwtData?.payload?.iss}/api`
                else if (jwtData?.payload?.aud)
                    this.baseUrl = `https://${jwtData?.payload?.aud}/api`
                else
                    this.sendMessage(`⚠️使用ck获取host，使用默认host：n03.sentezhenxuan.com`)
                //console.log(this.baseUrl)
                //'https://n03.sentezhenxuan.com/api'
                this.headers = {
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Content-Type": "application/json",
                    "Connection": "keep-alive",
                    "Referer": "https://servicewechat.com/wx5b82dfe3747e533f/5/page-frame.html",
                    "Host": "n05.sentezhenxuan.com",
                    "Authori-zation": this.auth,
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50 NetType/WIFI Language/zh_CN",
                    "Cb-lang": "zh-CN",
                    "Form-type": this.type,
                    "xweb_xhr": "1"
                };
                if (proxy && isProxy) {
                    this.proxy = await wqwlkj.getProxy(this.index, proxy)
                    //console.log(`使用代理：${this.proxy}`)
                    this.sendMessage(`✅使用代理：${this.proxy}`)
                }
                else {
                    this.proxy = ''
                    this.sendMessage(`⚠️不使用代理`)
                }
                return true
            }
            async getVideoIds() {
                try {
                    const headers = JSON.parse(JSON.stringify(this.headers))
                    //headers['Form-type'] = VIDEO_FROM_TYPES

                    // 循环请求所有路由
                    for (const route of VIDEO_FROM_TYPES) {
                        this.sendMessage(`🎯 尝试使用${route}获取视频`)
                        headers['Form-type'] = route
                        const options = {
                            url: `${this.baseUrl}/video/list?page=1&limit=10&status=1&source=0&isXn=1`,
                            headers: headers,
                            method: 'GET',
                        }

                        let res = await this.request(options);

                        if (res && res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
                            this.sendMessage(`✅ 使用${route}获取视频列表成功`)
                            // 找到有数据的路由，提取videoIds并返回
                            this.videoIds = res.data.map(item => item.id).filter(id => typeof id === 'number');
                            //用作缓存
                            fileData[this.remark] = route;
                            return true;
                        }
                        this.sendMessage(`⚠️ 使用${route}获取视频为空，切换下一个路由`)
                        await wqwlkj.sleep(1)


                        // 如果是最后一个路由且没有数据，继续执行到循环结束
                    }

                    // 所有路由都没有数据
                    this.videoIds = [];
                    return true;

                } catch (e) {
                    this.sendMessage(`❌获取视频id请求失败，${e.message}`)
                    this.videoIds = [];
                    return false;
                }
            }

            async watchVideos() {
                if (this.videoIds.length <= 0)
                    return this.sendMessage(`⚠️ 无视频可刷，跳过此步骤`)
                try {
                    const total = this.videoIds.length;
                    // console.log(this.videoIds)
                    let i = 0
                    for (; i < total; i++) {
                        const options = {
                            url: `${this.baseUrl}/video/videoJob`,
                            headers: this.headers,
                            method: 'POST',
                            data: JSON.stringify(
                                {
                                    vid: this.videoIds[i],
                                    startTime: Date.now() - 80000,
                                    endTime: Date.now(),
                                    baseVersion: "3.8.9",
                                    playMode: 0,
                                }
                            )
                        }
                        let res = await this.request(options);

                        //res = this.JSONpare(res)
                        if (res || res.status == 200) {

                            this.sendMessage(`🎥 视频 ${i + 1}/${total} 刷完 (ID: ${this.videoIds[i]})`, i + 1 === total);
                        } else {
                            this.sendMessage(`⚠️ 视频 ${i + 1}/${total} 异常:`, data?.msg || '无数据')
                        }
                        await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                    }
                    return true;
                }
                catch (e) {
                    this.sendMessage(`❌ 视频观看失败:，${e.message || e}`)
                    return false;
                }
            }

            async getMoney() {
                try {
                    const options = {
                        url: `${this.baseUrl}/user`,
                        headers: this.headers,
                        method: 'GET',
                    }

                    let res = await this.request(options);
                    if (res?.status == 200) {
                        const money = res?.data?.now_money
                        if (money) {
                            this.sendMessage(`✅ 获取余额成功，当前余额：${money}`)
                            this.money = money
                        } else {
                            this.sendMessage(`❌ 获取余额失败:${res?.msg || "未知原因"}`)
                        }
                    } else {
                        this.sendMessage(`❌ 获取余额失败:${res?.msg || "未知原因"}`)
                    }

                }
                catch (e) {
                    this.sendMessage(`❌ 获取余额请求失败:，${e.message || e}`)
                    return false;
                }
            }

            async doWithdraw() {
                try {
                    await this.getMoney()
                    if (this.money < 0.1)
                        return this.sendMessage(`⚠️余额不足0.1，直接跳出提现`)
                    const header = JSON.parse(JSON.stringify(this.headers))
                    header['Accept-Language'] = "zh-CN,zh;q=0.9";
                    header['User-Agent'] = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323d) NetType/WIFI Language/zh_CN"
                    const options = {
                        url: `${this.baseUrl}/userTx`,
                        headers: header,
                        method: 'GET',
                    }
                    let res = await this.request(options);
                    //res = this.JSONpare(res)
                    if (res.code === 200 || res.status === 200) {
                        this.sendMessage(`💰 提现发起成功，接口返回: ${res.msg || '成功'} `, true);
                    } else {
                        this.sendMessage(`❌ 提现发起失败，接口返回: ${res.msg}`, true)
                    }

                }
                catch (e) {
                    this.sendMessage(`❌ 提现请求失败:，${e.message || e}`)
                    return false;
                }
            }

            async main() {
                const init = await this.init()
                if (!init) return;
                this.sendMessage(`🔍 正在获取视频列表...`)
                const getId = await this.getVideoIds()
                if (!getId) return;
                this.sendMessage(`📽️ 获取到 ${this.videoIds.length} 个视频ID，准备刷视频...`)
                const watchVideo = await this.watchVideos()
                if (!watchVideo) return;
                this.sendMessage(`💳 正在尝试提现...`)
                await this.doWithdraw()
            }

            // 手动解析 JWT（Base64 解码）
            parseJWT(token) {
                try {
                    const cleanToken = token.replace('Bearer ', '');

                    // JWT 由三部分组成：header.payload.signature
                    const parts = cleanToken.split('.');
                    if (parts.length !== 3) {
                        throw new Error('无效的 JWT 格式');
                    }

                    // Base64Url 解码
                    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

                    return {
                        header,
                        payload,
                        signature: parts[2]
                    };
                } catch (error) {
                    console.error('JWT 解析失败:', error.message);
                    return null;
                }
            }

            // 带重试机制的请求方法
            async request(options, retryCount = 0) {
                try {
                    const data = await wqwlkj.request(options, this.proxy);
                    if (isDebug) {
                        if (isDebug === 2)
                            console.log(JSON.stringify(options))
                        const formatData = (data) => {
                            if (data === null) return 'null';
                            if (data === undefined) return 'undefined';

                            if (typeof data === 'string') return data;
                            if (typeof data === 'object') {
                                try {
                                    return JSON.stringify(data, null, 2); // 美化输出
                                } catch (error) {
                                    return `[对象序列化失败: ${error.message}]`;
                                }
                            }

                            return String(data);
                        };

                        this.sendMessage(`[调试输出] ${options?.method}请求${options?.url}返回：${formatData(data)}`);
                    }
                    return data;

                } catch (error) {
                    this.sendMessage(`🔐 检测到请求发生错误，正在重试...`)
                    let newProxy;
                    if (isProxy) {
                        newProxy = await wqwlkj.getProxy(this.index, proxy);
                        this.proxy = newProxy
                        this.sendMessage(`✅ 代理更新成功:${this.proxy}`);
                    } else {
                        this.sendMessage(`⚠️ 未使用代理`);
                        newProxy = true
                    }

                    if (retryCount < this.maxRetries && newProxy) {
                        this.sendMessage(`🕒${this.retryDelay * (retryCount + 1)}s秒后重试...`);
                        await wqwlkj.sleep(this.retryDelay * (retryCount + 1));
                        return await this.request(options, retryCount + 1);
                    }

                    throw new Error(`❌ 请求最终失败: ${error.message}`);
                }
            }


            sendMessage(message, isPush = false) {
                message = `账号[${this.index + 1}](${this.remark}): ${message}`
                if (isNotify && isPush) {
                    return wqwlkj.sendMessage(message + "\n")
                }
                console.log(message)
                return message
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
        wqwlkj.saveFile(fileData, 'yinyu')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();