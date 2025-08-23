/**
 * 脚本：wqwl_且悠.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序且悠
 * 环境变量：wqwl_qieyou，多个换行或新建多个变量
 * 环境变量描述：抓包请求参数下的access_token，请求头中Extra-Data中的sid,uuid格式例如：access_token#sid#uuid#备注1
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 3 * * * 一天一次
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

//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_qieyou';

//脚本名称
const name = '微信小程序且悠'


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

        // let fileData = wqwlkj.readFile('qieyou')
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://h5.youzan.com'
                this.maxRetries = 3; // 最大重试次数
                this.retryDelay = 3; // 重试延迟(秒)
            }

            async init() {
                const ckData = this.ck.split('#')
                if (ckData.length < 3) {
                    return this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 3) {
                    this.remark = ckData[0].slice(0, 8);
                }
                else {
                    this.remark = ckData[3];
                }
                this.token = ckData[0];
                this.sid = ckData[1];
                this.uuid = ckData[2];
                this.headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090922) XWEB/8555',
                    'Content-Type': 'application/json',
                    'Extra-Data': JSON.stringify({
                        is_weapp: 1,
                        sid: this.sid,
                        version: "3.165.8.101",
                        client: "weapp",
                        bizEnv: "retail",
                        uuid: this.uuid,
                        ftime: Date.now()
                    }),
                    'xweb_xhr': '1',
                    'Referer': 'https://servicewechat.com/wxe344bbbf9be876c9/90/page-frame.html'
                }
                this.params = {
                    app_id: 'wxe344bbbf9be876c9',
                    kdt_id: 150539347,
                    access_token: this.token
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


            async checkInfo() {
                try {
                    let headers = this.headers
                    headers['ftime'] = Date.now()
                    const options = {
                        url: `${this.baseUrl}/wscump/checkin/check-in-info.json`,
                        method: 'GET',
                        headers: headers,
                        params: this.params,
                        proxy: this.proxy
                    }
                    const res = await this.request(options, this.proxy)
                    if (res.code === 0) {
                        const checkInId = res.data.checkInId
                        this.sendMessage(`✅获取签到id成功，id为：${checkInId}`)
                        return checkInId
                    }
                    else {
                        this.sendMessage(`❌获取签到ID信息失败，${res.message}`)
                        return false
                    }
                } catch (e) {
                    throw new Error(`❌获取签到ID信息请求失败，${e.message}`)
                }
            }

            async checkIn(checkinId) {
                try {
                    let headers = this.headers
                    headers['ftime'] = Date.now()
                    let params = {
                        checkinId: checkinId,
                        ...this.params
                    }
                    const options = {
                        url: `${this.baseUrl}/wscump/checkin/checkinV2.json`,
                        method: 'GET',
                        headers: headers,
                        params: params,
                        proxy: this.proxy
                    }
                    const res = await this.request(options, this.proxy)
                    //  console.log(res)
                    if (res.code === 0) {
                        //const checkInId = res.data.checkInId
                        this.sendMessage(`✅签到成功`)
                        return true
                    }
                    else {
                        this.sendMessage(`❌签到失败，${res.msg}`)
                        return false
                    }
                } catch (e) {
                    throw new Error(`❌签到请求失败，${e.message}`)
                }
            }

            async info() {
                try {
                    let headers = this.headers
                    headers['ftime'] = Date.now()

                    const options = {
                        url: `${this.baseUrl}/wscuser/membercenter/init-data.json`,
                        method: 'GET',
                        headers: headers,
                        params: this.params,
                        proxy: this.proxy
                    }
                    const res = await this.request(options, this.proxy)

                    if (res.code === 0) {
                        //const checkInId = res.data.checkInId
                        this.sendMessage(`✅当前积分：${res?.data?.member?.stats?.points}`, true)
                        return true
                    }
                    else {
                        this.sendMessage(`❌获取信息失败，${res.message}`)
                        return false
                    }
                } catch (e) {
                    throw new Error(`❌获取信息请求失败，${e.message}`)
                }
            }

            async main() {
                await this.init()
                const checkInId = await this.checkInfo()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                if (checkInId) {
                    await this.checkIn(checkInId)
                }
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.info()

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
        // wqwlkj.saveFile(fileData, 'qieyou')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();