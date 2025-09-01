/**
 * 脚本：wqwl_爱裹旧衣回收.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序爱裹旧衣回收
 * 环境变量：wqwl_aiguo，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的authorization，格式例如：authorization#备注1（authorization去掉Bearer ）
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 3 * * * 一天一次
 */

/**
 * 积分不能全抵，我签到七天只得0.03，想玩就玩吧，ck不知道多久过期，自己登录好像会顶ck
 */


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

//是否抽奖
let isDraw = true;

//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_aiguo';

//脚本名称
const name = '微信小程序爱裹旧衣回收'


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

        // let fileData = wqwlkj.readFile('aiguo')
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://alipay.haliaeetus.cn/fuli'
                this.maxRetries = 3; // 最大重试次数
                this.retryDelay = 3; // 重试延迟(秒)
            }

            async init() {
                const ckData = this.ck.split('#')
                if (ckData.length < 1) {
                    return this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 1) {
                    this.remark = ckData[0].slice(0, 8);
                }
                else {
                    this.remark = ckData[1];
                }
                this.token = ckData[0];
                this.headers = {
                    "accept": "*/*",
                    "accept-language": "zh-CN,zh;q=0.9",
                    "authorization": this.token,
                    "channelno": "",
                    "content-type": "application/json",
                    "plateform": "WX",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "xweb_xhr": "1",
                    "Referer": "https://servicewechat.com/wx4ff260333d3c5ddd/245/page-frame.html",
                    "Referrer-Policy": "unsafe-url"
                }
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

            async signed() {
                try {
                    const options = {
                        url: `${this.baseUrl}/api/fuli/signed`,
                        headers: this.headers,
                        method: 'GET'
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.status === 200)
                        this.sendMessage(`✅签到成功`)
                    else
                        this.sendMessage(`❌签到失败，原因：${res.msg}`)

                } catch (e) {
                    throw new Error(`❌签到请求失败，${e.message}`)
                }
            }

            async account() {
                try {
                    const options = {
                        url: `${this.baseUrl}/api/jf/account`,
                        headers: this.headers,
                        method: 'POST',
                        data: {}
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.status === 200) {
                        this.sendMessage(`✅当前积分为：${res.data}`)
                        return res.data
                    }
                    else
                        this.sendMessage(`❌查询失败，原因：${res.msg}`)
                    return 0

                } catch (e) {
                    throw new Error(`❌查询请求失败，${e.message}`)
                }
            }
            //currentTime
            async currentTime() {
                try {
                    const options = {
                        url: `${this.baseUrl}/currentTime`,
                        headers: this.headers,
                        method: 'GET',
                    }
                    const res = await this.request(options, this.proxy)
                    //1756117235827
                    if ((typeof res === 'number' && res.toString().length === 13) ||
                        (typeof res === 'string' && res.length === 13)) {
                        return res
                    } else {
                        this.sendMessage(`❌获取时间失败，服务器返回: ${JSON.stringify(res)}`)
                    }

                } catch (e) {
                    throw new Error(`❌获取时间请求失败，${e.message}`)
                }
            }

            //
            async wheelDraw() {
                try {
                    const options = {
                        url: `${this.baseUrl}/api/fuli/wheel/wheelDraw`,
                        headers: this.headers,
                        method: 'POST',
                        data: JSON.stringify({ data: "" }),
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.status === 200) {
                        if (res.data.type === 0)
                            this.sendMessage(`✅抽奖成功，获得奖品：${res.data.name}`)
                        else
                            this.sendMessage(`✅抽奖成功，获得奖品：${res.data.name}`, true)

                    } else {
                        this.sendMessage(`❌抽奖失败，原因：${res.msg}`)
                    }


                } catch (e) {
                    throw new Error(`❌抽奖请求失败，${e.message}`)
                }
            }
            async doTask(task) {
                try {
                    let data = {
                        data: {
                            status: task.status,
                            type: task.type,
                            taskNo: task.taskNo,
                        },
                        m: await this.currentTime(),
                    }
                    data.s = this.sign(data.m + JSON.stringify(data.data))
                    // console.log(data)
                    const options = {
                        url: `${this.baseUrl}/api/earnPoint/doTask`,
                        headers: this.headers,
                        method: 'POST',
                        data: data
                    }
                    const res = await this.request(options, this.proxy)
                    // console.log(res)
                    if (res.status === 200 || res.msg === '您已领取该任务') {
                        this.sendMessage(`✅【${task.taskName}】任务${task.status === 1 ? '完成' : '领取'}成功`)
                        return true
                    }
                    else {
                        this.sendMessage(`❌【${task.taskName}】任务失败，原因：${res.msg}`)
                        return false
                    }
                } catch (e) {
                    throw new Error(`❌任务请求失败，${e.message}`)
                }
            }

            async startTask() {
                const taskList = [
                    {
                        taskName: '衣服预约',
                        taskNo: '1000',
                        type: 1
                    },
                    {
                        taskName: '旧书预约',
                        taskNo: '1001',
                        type: 1
                    },
                    {
                        taskName: '参与天天抽奖',
                        taskNo: '1008',
                        type: 1
                    },
                ]
                for (let task of taskList) {
                    task.status = 0
                    const isStart = await this.doTask(task)
                    await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                    if (!isStart)
                        continue;
                    task.status = 1
                    await this.doTask(task)
                    await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                }
            }

            sign(t) {
                t = t.split("").sort().join("").replace(/^\s*|\s*$/g, "")
                return wqwlkj.md5(t)
            }

            async main() {
                const isFinish = await this.init()
                if (!isFinish)
                    return
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.signed()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.startTask()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                const jf = await this.account()
                if (!isDraw)
                    return
                for (let i = 0; i < Math.floor(jf / 10); i++) {
                    this.sendMessage(`📝第${i + 1}次抽奖...`)
                    await this.wheelDraw()
                    await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                }
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.account()
            }

            // 带重试机制的请求方法
            async request(options, retryCount = 0) {
                try {
                    const data = await wqwlkj.request(options, this.proxy);
                    return data;

                } catch (error) {
                    this.sendMessage(`🔐检测到请求发生错误，正在重试...`)
                    // 刷新代理
                    const newProxy = await wqwlkj.getProxy(this.index, proxy);
                    this.proxy = newProxy
                    this.sendMessage(`✅代理更新成功:${this.proxy}`);

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
        // wqwlkj.saveFile(fileData, 'aiguo')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();