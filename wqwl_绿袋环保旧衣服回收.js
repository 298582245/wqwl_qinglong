/**
 * 脚本：wqwl_绿袋环保旧衣服回收.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序绿袋环保旧衣服回收
 * 环境变量：wqwl_lvdhb，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的token，格式例如：token#备注1
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 3 * * * 一天一次
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
const ckName = 'wqwl_lvdhb';

//脚本名称
const name = '微信小程序绿袋环保旧衣服回收'


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

        let fileData = wqwlkj.readFile('lvdhb') || {}
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://www.lvdhb.com/MiniProgramApiCore/api/v3'
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
                let ua
                if (!fileData[this.remark])
                    fileData[this.remark] = {}
                if (!fileData[this.remark]['ua']) {
                    ua = wqwlkj.generateRandomUA();
                    fileData[this.remark]['ua'] = ua
                }
                else
                    ua = fileData[this.remark]['ua'];
                this.sendMessage(`🎲使用ua：${ua}`);
                this.headers = {
                    "accept": "*/*",
                    "accept-language": "zh-CN,zh;q=0.9",
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "xweb_xhr": "1",
                    "referrer": "https://servicewechat.com/wx55da7d089eab6cdb/139/page-frame.html",
                    "token": this.token,
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

            async sign() {
                try {
                    const options = {
                        method: 'POST',
                        url: `${this.baseUrl}/Login/Sign`,
                        headers: this.headers,
                        data: {}
                    }
                    const res = await this.request(options)
                    console.log(res)
                    if (res.Success)
                        this.sendMessage(`✅签到成功，获得积分：${res.Data}`, true)
                    else
                        this.sendMessage(`❌签到失败，${res.Message}`)
                    return true
                }
                catch (e) {
                    this.sendMessage(`❌签到请求失败，${e.message}`)
                    return false
                }
            }

            async info() {
                try {
                    const options = {
                        method: 'GET',
                        url: `${this.baseUrl}/My/GetMyScore`,
                        headers: this.headers,
                    }
                    const res = await this.request(options)
                    console.log(res)
                    if (res) {
                        this.sendMessage(`🪙当前积分${parseInt(res)}`, true)
                        if (parseInt(res) >= 100) {
                            this.sendMessage(`🔁积分达到100以上，准备提现`)
                            await this.withdraw(parseInt(res))
                        } else {
                            this.sendMessage(`⚠️积分不足100，不提现`)
                        }
                    }
                    else
                        this.sendMessage(`❌信息获取失败，${res}`)
                    return true
                }
                catch (e) {
                    this.sendMessage(`❌信息获取请求失败，${e.message}`)
                    return false
                }
            }
            // 提现
            async withdraw(score) {
                try {
                    const withdrawAmount = score
                    const url = `${config.baseUrl}/cash/SaveCash`;
                    const options = {
                        url: url,
                        headers: this.headers,
                        method: 'POST',
                        data: {
                            "AliAccount": "直接到微信钱包的余额",
                            "Score": withdrawAmount.toString()
                        }
                    };

                    const res = await this.request(options);
                    if (res.Success) {
                        this.sendMessage(`✅提现成功，提现积分：${withdrawAmount}`, true)
                    } else {
                        this.sendMessage(`❌提现失败: ${res.Message || '未知错误'}`, true)
                    }
                } catch (e) {
                    this.sendMessage(`❌提现请求失败，${e.message}`)
                    return false
                }
            }


            async main() {
                const isFinish = await this.init()
                if (!isFinish)
                    return
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                const bool = await this.sign()
                if (!bool)
                    return
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
                    // 刷新代理
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
        wqwlkj.saveFile(fileData, 'lvdhb')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();