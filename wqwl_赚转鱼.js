/**
 * 脚本：wqwl_赚转鱼.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序赚转鱼
 * 环境变量：wqwl_zzy，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的user-token，格式例如：user-token#备注1
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 2 * * * 一天一次
 */

/**
 * ck好短，一个小时不到，不如手动,写了就发
 */


const axios = require('axios');
const fs = require('fs');


//代理链接
let proxy = process.env["wqwl_daili"] || '';

//是否用代理，默认使用（填了代理链接）
let isProxy = process.env["wqwl_useProxy"] || true;

//并发数，默认4
let bfs = process.env["wqwl_bfs"] || 4;

// 是否通知
let isNotify = true;

//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_zzy';

//脚本名称
const name = '微信小程序赚转鱼'


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

        // let fileData = wqwlkj.readFile('zzy')
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://app.duoyukeji.net/api'
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
                    "appid": "wx9ab1b6f621909585",
                    "channel": "weixin",
                    "content-type": "application/json",
                    "interface-version": "1.0",
                    "provider": "retrieve",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "user-token": this.token,
                    "xweb_xhr": "1",
                    "Referer": "https://servicewechat.com/wx9ab1b6f621909585/198/page-frame.html",
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

            async signIn() {
                try {
                    const options = {
                        url: `${this.baseUrl}/mine/gold/signIn`,
                        headers: this.headers,
                        method: 'GET'
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.msg === '签到成功')
                        this.sendMessage(`✅签到成功`)
                    else
                        this.sendMessage(`❌签到失败，原因：${res.msg}`)

                } catch (e) {
                    throw new Error(`❌签到请求失败，${e.message}`)
                }
            }

            async signIn() {
                try {
                    const options = {
                        url: `${this.baseUrl}/mine/gold/signIn`,
                        headers: this.headers,
                        method: 'GET'
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.msg === '签到成功')
                        this.sendMessage(`✅签到成功`)
                    else
                        this.sendMessage(`❌签到失败，原因：${res.msg}`)

                } catch (e) {
                    throw new Error(`❌签到请求失败，${e.message}`)
                }
            }
            async getTimes() {
                try {
                    const options = {
                        url: `${this.baseUrl}/mine/gold/mining/progress`,
                        headers: this.headers,
                        method: 'GET'
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.data.residueNumber === null) {
                        this.sendMessage(`❌请手动领取旷工再运行`)
                        return false
                    }
                    this.sendMessage(`✅已获取${res.data.residueNumber}次挖矿机会`)
                    for (let i = 0; i < res.data.residueNumber; i++) {
                        await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                        await this.residue()
                    }

                } catch (e) {
                    throw new Error(`❌获取次数请求失败，${e.message}`)
                }
            }

            async residue() {
                try {
                    const options = {
                        url: `${this.baseUrl}/open/activity/participation/activity?activityRuleId=3`,
                        headers: this.headers,
                        method: 'GET'
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.msg === '成功') {
                        this.sendMessage(`✅挖矿成功，获得【${res.data.prizeName}】，准备兑换...`)
                        await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                        await this.updatePrize(res.data.activityLogId)
                    }

                    else
                        this.sendMessage(`❌挖矿失败，原因：${res.msg}`)

                } catch (e) {
                    throw new Error(`❌挖矿请求失败，${e.message}`)
                }
            }

            async updatePrize(activityLogId) {
                try {
                    const options = {
                        url: `${this.baseUrl}/open/activity/updatePrize`,
                        headers: this.headers,
                        method: 'POST',
                        data: JSON.stringify({
                            activityRuleId: 3,
                            id: activityLogId
                        })
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.msg === '兑换成功') {
                        this.sendMessage(`✅兑换成功，获得【${res.data}】元`)
                        await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                    }
                    else
                        this.sendMessage(`❌挖矿失败，原因：${res.msg}`)
                } catch (e) {
                    throw new Error(`❌挖矿请求失败，${e.message}`)
                }
            }


            async userMessage() {
                try {
                    const options = {
                        url: `${this.baseUrl}/open/popularize/userMessage`,
                        headers: this.headers,
                        method: 'POST',
                        data: JSON.stringify({
                        })
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.data.id) {
                        this.sendMessage(`✅用户【${res.data.name}】余额：${res.data.account}元`, true)
                    }
                    else
                        this.sendMessage(`❌查询用户信息失败，原因：${res.msg}`)
                } catch (e) {
                    throw new Error(`❌查询用户信息请求失败，${e.message}`)
                }
            }
            //
            async main() {
                const isFinish = await this.init()
                if (!isFinish)
                    return
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.signIn()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.getTimes()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.userMessage()

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
        // wqwlkj.saveFile(fileData, 'zzy')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();