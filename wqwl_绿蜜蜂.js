/**
 * 脚本：wqwl_绿蜜蜂.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序绿蜜蜂旧衣服回收
 * 环境变量：wqwl_lvmf，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的access-token和user-token，格式例如：access-token#user-token#备注1
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 0 * * * 一天一次即可
 */


const axios = require('axios');
const fs = require('fs');


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

        const isNotify = true; // 是否通知
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

        let index = 0;
        const ckName = 'wqwl_lvmf';
        const name = '微信小程序绿蜜蜂旧衣服回收'

        class Task {
            constructor(ck) {
                this.index = index++;
                this.baseURL = 'https://lmf.lvmifo.com/api'
                this.ck = ck
            }

            async init(ck) {
                const ckData = ck.split('#')
                if (ckData.length < 2) {
                    return sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 2) {
                    this.remark = ckData[1];
                }
                else {
                    this.remark = ckData[2];
                }
                this.accessToken = ckData[0];
                this.userToken = ckData[1];
                this.headers = {
                    "accept": "*/*",
                    "accept-language": "zh-CN,zh;q=0.9",
                    "access-token": this.accessToken,
                    "content-type": "application/x-www-form-urlencoded",
                    "lat": "",
                    "lng": "",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "this-shop-id": "0",
                    "user-token": this.userToken,
                    "xweb_xhr": "1",
                    "Referer": "https://servicewechat.com/wx6fcde446296d9588/289/page-frame.html",
                    "Referrer-Policy": "unsafe-url",
                    "version": "v1.0.0"
                }
                if (process.env["wqwl_daili"] != undefined) {
                    this.proxy = await wqwlkj.getProxy()
                }
                else {
                    this.proxy = ''
                }
            }

            // 签到
            async sign() {
                try {
                    if (!(this.accessToken && this.userToken))
                        return
                    const options = {
                        url: `${this.baseURL}/5dca57afa379e?m=toSign`,
                        headers: this.headers,
                        method: 'GET',
                    }
                    const result = await wqwlkj.request(options, this.proxy)
                    if (result.code === 1) {
                        this.sendMessage(`✅签到成功，获得积分🪙：${result.data.get_integral}，获得余额💰：${result.data.get_red_packet}`, true)
                    } else {
                        this.sendMessage(`❌签到失败，${result.msg}`, true)
                    }
                } catch (e) {
                    throw new Error(`❌请求签到接口失败，${e.message}`)
                }
            }

            // 获取用户信息
            async getUserInfo() {
                try {
                    if (!(this.accessToken && this.userToken))
                        return
                    const options = {
                        url: `${this.baseURL}/5dca57afa379e?m=getUserInfo`,
                        headers: this.headers,
                        method: 'GET',
                    }
                    const result = await wqwlkj.request(options, this.proxy)
                    if (result.code === 1) {
                        this.sendMessage(`用户数据汇总\n🙍用户信息：${result.data.nick_name}(${result.data.id})\n💰用户财产：积分：${result.data.integral}，余额：${result.data.amount}`, true)
                    } else {
                        this.sendMessage(`❌获取用户信息失败，${result.msg}`, true)
                    }
                } catch (e) {
                    throw new Error(`❌请求用户信息接口失败，${e.message}`)
                }

            }

            async main() {
                await this.init(this.ck)
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                await this.sign()
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                await this.getUserInfo()
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
            }

            sendMessage(message, isPush = false) {
                message = `账号[${this.index + 1}](${this.remark}): ${message}`
                if (isNotify && isPush)
                    wqwlkj.sendMessage(message + "\n")
                else
                    console.log(message)
            }

        }

        console.log(`${name}开始执行...`);
        const tokens = wqwlkj.checkEnv(process.env[ckName]);
        const tasks = tokens.map(token => new Task(token).main());
        await Promise.all(tasks); // 所有任务并发执行
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();